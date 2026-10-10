/**
 * Tipos e utilitários para integração com IBM watsonx Orchestrate via protocolo A2A (Agent-to-Agent).
 */

export interface OrchestrateMessageOutput {
  replyText: string;
  intent?: string;
  entities?: Record<string, unknown>;
  sessionId?: string;
}

export interface IamTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expiration: number;
}

export interface A2APart {
  kind: string;
  text?: string;
  [key: string]: unknown;
}

export interface A2AMessage {
  messageId: string;
  role: 'user' | 'assistant' | 'system';
  parts: A2APart[];
  contextId?: string;
  taskId?: string;
  [key: string]: unknown;
}

export interface A2AResponse {
  jsonrpc?: string;
  id?: string;
  result?: {
    status?: {
      state?: string;
      message?: string;
    };
    messages?: A2AMessage[];
    history?: A2AMessage[];
    artifacts?: Array<{
      name?: string;
      identifier?: string;
      parts?: A2APart[];
      [key: string]: unknown;
    }>;
    conversation_result?: {
      text?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// Cache em memória do token IAM (válido por processo Node.js serverless)
interface CachedToken {
  token: string;
  expiresAtMs: number;
}

let cachedIamToken: CachedToken | null = null;

/**
 * Obtém um IAM Access Token usando a API Key configurada na IBM Cloud.
 * Faz cache com margem de segurança de 2 minutos antes da expiração.
 */
export async function getIbmIamAccessToken(apiKey: string, timeoutMs = 10000): Promise<string> {
  const now = Date.now();
  if (cachedIamToken && cachedIamToken.expiresAtMs > now + 120_000) {
    return cachedIamToken.token;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiKey);

    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Falha na autenticação IAM (status ${res.status}): ${errText.slice(0, 150)}`);
    }

    const data = (await res.json()) as IamTokenResponse;
    if (!data.access_token) {
      throw new Error('Resposta do IAM não continha access_token');
    }

    // data.expires_in vem em segundos (geralmente 3600 = 1 hora)
    const expiresInSec = typeof data.expires_in === 'number' ? data.expires_in : 3600;
    cachedIamToken = {
      token: data.access_token,
      expiresAtMs: now + expiresInSec * 1000,
    };

    return data.access_token;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extrai texto de forma robusta a partir de mensagens, artefatos ou conversation_result de uma resposta A2A.
 */
export function extractTextFromA2AResponse(a2aRes: A2AResponse): string {
  if (!a2aRes || !a2aRes.result) {
    return '';
  }

  const result = a2aRes.result;
  const collectedTexts: string[] = [];

  // 1. Mensagens diretas do result
  const candidateLists = [result.messages, result.history];
  for (const list of candidateLists) {
    if (Array.isArray(list)) {
      for (const msg of list) {
        // Focar em mensagens do assistente
        if (msg && msg.role === 'assistant' && Array.isArray(msg.parts)) {
          for (const part of msg.parts) {
            if (part && typeof part.text === 'string' && part.text.trim()) {
              collectedTexts.push(part.text.trim());
            }
          }
        }
      }
    }
  }

  // 2. Artefatos (ex: conversation_result ou outros artefatos com texto)
  if (Array.isArray(result.artifacts)) {
    for (const art of result.artifacts) {
      if (Array.isArray(art.parts)) {
        for (const part of art.parts) {
          if (part && typeof part.text === 'string' && part.text.trim()) {
            collectedTexts.push(part.text.trim());
          }
        }
      }
    }
  }

  // 3. conversation_result direto
  if (result.conversation_result && typeof result.conversation_result.text === 'string') {
    const convText = result.conversation_result.text.trim();
    if (convText) {
      collectedTexts.push(convText);
    }
  }

  // Se encontramos textos, removemos duplicatas consecutivas e unimos
  if (collectedTexts.length > 0) {
    const unique = collectedTexts.filter((t, idx, arr) => arr.indexOf(t) === idx);
    return unique.join('\n\n');
  }

  // Fallback: se houver alguma mensagem de erro de status
  if (result.status && result.status.message) {
    return result.status.message;
  }

  return '';
}

/**
 * Cliente desacoplado para integração com o IBM watsonx Orchestrate via protocolo A2A.
 */
export async function sendWatsonxAssistantMessage(
  message: string,
  existingSessionId?: string
): Promise<OrchestrateMessageOutput | null> {
  const apiKey =
    process.env.WATSONX_ORCHESTRATE_API_KEY || process.env.WATSONX_API_KEY;

  const agentUrl =
    process.env.WATSONX_ORCHESTRATE_AGENT_URL ||
    'https://api.au-syd.watson-orchestrate.cloud.ibm.com/instances/683cf7ca-4458-4c3b-b7df-c6d7f29b2e24/v1/orchestrate/A2A/agents/4c21d327-f8e5-401e-92c7-651e3b6428e1/environment/770cbc64-b448-4ecc-a9bf-6a8c7bccaf51';

  // Se a API key não estiver configurada no ambiente, retorna null
  // para permitir que o backend execute o fallback gracioso sem quebras.
  if (!apiKey) {
    return null;
  }

  const requestId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const sessionId = existingSessionId || crypto.randomUUID();

  try {
    // 1. Obter IAM access token
    const token = await getIbmIamAccessToken(apiKey);

    // 2. Chamar o agente A2A via JSON-RPC 2.0 (message/send)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    let res: Response;
    try {
      res = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method: 'message/send',
          params: {
            message: {
              messageId,
              role: 'user',
              parts: [
                {
                  kind: 'text',
                  text: message,
                },
              ],
            },
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      console.error(
        `Erro HTTP ao chamar watsonx Orchestrate A2A: status ${res.status}`
      );
      return null;
    }

    const json = (await res.json()) as A2AResponse;

    // Verificar se houve erro JSON-RPC
    if (json.error) {
      console.error(
        `Erro JSON-RPC no watsonx Orchestrate A2A (código ${json.error.code}): ${json.error.message}`
      );
      return null;
    }

    const replyText = extractTextFromA2AResponse(json);

    return {
      replyText: replyText || '',
      sessionId,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('Timeout ao comunicar com o watsonx Orchestrate A2A');
    } else {
      console.error('Falha de conexão com o watsonx Orchestrate A2A:', error?.message || error);
    }
    return null;
  }
}
