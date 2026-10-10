/**
 * Utilitários para integração com IBM watsonx Orchestrate via protocolo A2A (Agent-to-Agent).
 */

export interface OrchestrateMessageOutput {
  replyText: string;
  intent?: string;
  entities?: Record<string, unknown>;
  sessionId?: string;
  rawResponse?: unknown;
}

export interface IamTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expiration: number;
}

export interface A2APart {
  kind?: string;
  text?: string;
  [key: string]: unknown;
}

export interface A2AMessage {
  messageId?: string;
  role?: string;
  parts?: A2APart[];
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
      [key: string]: unknown;
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
    } | string;
    output?: {
      text?: string;
      message?: string;
      generic?: Array<{ text?: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  [key: string]: unknown;
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
 * Extrai texto recursivamente de qualquer objeto ou estrutura JSON retornada pelo Orchestrate.
 */
function deepFindTexts(obj: unknown, maxDepth = 6): string[] {
  if (!obj || maxDepth <= 0) return [];
  const results: string[] = [];

  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed.length > 0) results.push(trimmed);
    return results;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...deepFindTexts(item, maxDepth - 1));
    }
    return results;
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;

    // Se tiver 'parts', analisa cada part
    if (Array.isArray(record.parts)) {
      for (const p of record.parts) {
        if (p && typeof p.text === 'string' && p.text.trim()) {
          results.push(p.text.trim());
        }
      }
    }

    // Se tiver campo 'text' direto
    if (typeof record.text === 'string' && record.text.trim()) {
      results.push(record.text.trim());
    }

    // Se tiver campo 'message' direto (que seja string)
    if (typeof record.message === 'string' && record.message.trim() && !record.message.includes('jsonrpc')) {
      results.push(record.message.trim());
    }
  }

  return results;
}

/**
 * Extrai texto de forma robusta a partir de mensagens, artefatos ou conversation_result de uma resposta A2A.
 */
export function extractTextFromA2AResponse(a2aRes: A2AResponse): string {
  if (!a2aRes) return '';

  const collectedTexts: string[] = [];

  // Se houver result
  if (a2aRes.result) {
    const result = a2aRes.result;

    // 1. Mensagens diretas do result (messages / history)
    const candidateLists = [result.messages, result.history];
    for (const list of candidateLists) {
      if (Array.isArray(list)) {
        for (const msg of list) {
          // Mensagens de assistente têm prioridade máxima
          const isAssistant = !msg.role || msg.role === 'assistant' || msg.role === 'agent' || msg.role === 'model';
          if (isAssistant && Array.isArray(msg.parts)) {
            for (const part of msg.parts) {
              if (part && typeof part.text === 'string' && part.text.trim()) {
                collectedTexts.push(part.text.trim());
              }
            }
          }
        }
      }
    }

    // 2. conversation_result (pode vir como objeto { text: "..." } ou string direta)
    if (result.conversation_result) {
      if (typeof result.conversation_result === 'string' && result.conversation_result.trim()) {
        collectedTexts.push(result.conversation_result.trim());
      } else if (typeof result.conversation_result === 'object') {
        const cr = result.conversation_result as Record<string, unknown>;
        if (typeof cr.text === 'string' && cr.text.trim()) {
          collectedTexts.push(cr.text.trim());
        }
      }
    }

    // 3. Artefatos
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

    // 4. Campo output genérico (caso o Orchestrate formate como output.text ou output.generic)
    if (result.output) {
      if (typeof result.output.text === 'string' && result.output.text.trim()) {
        collectedTexts.push(result.output.text.trim());
      }
      if (Array.isArray(result.output.generic)) {
        for (const g of result.output.generic) {
          if (g && typeof g.text === 'string' && g.text.trim()) {
            collectedTexts.push(g.text.trim());
          }
        }
      }
    }

    // 5. Fallback profundo se nenhuma das estruturas acima trouxe texto
    if (collectedTexts.length === 0) {
      const deepTexts = deepFindTexts(result);
      if (deepTexts.length > 0) {
        collectedTexts.push(...deepTexts);
      }
    }
  }

  // Se encontramos textos, deduplica preservando a ordem
  if (collectedTexts.length > 0) {
    const unique = collectedTexts.filter((t, idx, arr) => arr.indexOf(t) === idx);
    return unique.join('\n\n');
  }

  // Se houver mensagem de erro ou status de erro no JSON-RPC
  if (a2aRes.error && typeof a2aRes.error.message === 'string') {
    return a2aRes.error.message;
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

  // Se a API key não estiver configurada no ambiente
  if (!apiKey) {
    console.warn('[watsonx Orchestrate] Nenhuma API Key configurada (WATSONX_ORCHESTRATE_API_KEY). Usando fallback local.');
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
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

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
      const errBody = await res.text().catch(() => '');
      console.error(
        `[watsonx Orchestrate A2A] Erro HTTP status ${res.status}:`,
        errBody.slice(0, 300)
      );
      return null;
    }

    const json = (await res.json()) as A2AResponse;

    // Verificar se houve erro JSON-RPC
    if (json.error) {
      console.error(
        `[watsonx Orchestrate A2A] Erro JSON-RPC (código ${json.error.code}):`,
        json.error.message
      );
      return null;
    }

    const replyText = extractTextFromA2AResponse(json);

    if (!replyText) {
      console.warn('[watsonx Orchestrate A2A] Resposta recebida da IBM sem texto extraível:', JSON.stringify(json).slice(0, 300));
      return null;
    }

    return {
      replyText,
      sessionId,
      rawResponse: json,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('[watsonx Orchestrate A2A] Timeout ao comunicar com o agente (25s excedidos).');
    } else {
      console.error('[watsonx Orchestrate A2A] Falha de conexão:', error?.message || error);
    }
    return null;
  }
}
