export interface WatsonxMessageOutput {
  replyText: string;
  intent?: string;
  entities?: Record<string, unknown>;
  sessionId?: string;
}

/**
 * Cliente desacoplado para integração com a REST API v2 do IBM watsonx Assistant
 */
export async function sendWatsonxAssistantMessage(
  message: string,
  existingSessionId?: string
): Promise<WatsonxMessageOutput | null> {
  const apiKey = process.env.WATSONX_API_KEY;
  const serviceUrl = process.env.WATSONX_SERVICE_URL;
  const assistantId = process.env.WATSONX_ASSISTANT_ID;

  // Se as variáveis de ambiente ainda não estiverem configuradas no .env,
  // retorna null para permitir fallback local gracioso sem quebrar o sistema.
  if (!apiKey || !serviceUrl || !assistantId) {
    return null;
  }

  try {
    const baseUrl = serviceUrl.replace(/\/+$/, '');
    const authHeader = `Basic ${Buffer.from(`apikey:${apiKey}`).toString('base64')}`;
    const apiVersion = '2023-06-15';

    // 1. Obter ou reutilizar Session ID
    let currentSessionId = existingSessionId;

    if (!currentSessionId) {
      const sessionRes = await fetch(
        `${baseUrl}/v2/assistants/${assistantId}/sessions?version=${apiVersion}`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!sessionRes.ok) {
        console.error('Falha ao criar sessão no watsonx Assistant:', await sessionRes.text());
        return null;
      }

      const sessionData = await sessionRes.json();
      currentSessionId = sessionData.session_id;
    }

    if (!currentSessionId) {
      return null;
    }

    // 2. Enviar mensagem do usuário para a sessão ativa
    const messageRes = await fetch(
      `${baseUrl}/v2/assistants/${assistantId}/sessions/${currentSessionId}/message?version=${apiVersion}`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            message_type: 'text',
            text: message,
            options: {
              return_context: true,
            },
          },
        }),
      }
    );

    if (!messageRes.ok) {
      console.error('Falha ao enviar mensagem ao watsonx Assistant:', await messageRes.text());
      return null;
    }

    const messageData = await messageRes.json();

    // Extrair respostas de texto
    const generic = messageData.output?.generic || [];
    const textResponses = generic
      .filter((g: any) => g.response_type === 'text' && g.text)
      .map((g: any) => g.text);

    const replyText = textResponses.join('\n\n') || '';

    // Extrair intenção principal
    const intents = messageData.output?.intents || [];
    const topIntent = intents.length > 0 ? intents[0].intent : undefined;

    // Extrair entidades mapeadas
    const rawEntities = messageData.output?.entities || [];
    const entities: Record<string, unknown> = {};
    for (const ent of rawEntities) {
      entities[ent.entity] = ent.value;
    }

    return {
      replyText,
      intent: topIntent,
      entities,
      sessionId: currentSessionId,
    };
  } catch (error) {
    console.error('Erro na chamada REST do watsonx Assistant:', error);
    return null;
  }
}
