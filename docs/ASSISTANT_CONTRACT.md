# Contrato e Arquitetura do Assistente Virtual ReUse! (IBM watsonx Orchestrate A2A)

Este documento descreve os contratos de dados, formatos de requisição/resposta, intenções reconhecidas e garantias de segurança para a integração com o agente nativo do **IBM watsonx Orchestrate** via protocolo **A2A (Agent-to-Agent)**.

---

## 1. Visão Geral da Arquitetura

```text
[ Cliente (Chat Widget) ]
           │
           │ POST /api/assistente { message, sessionId? } (Cookie HttpOnly incluso)
           ▼
[ Next.js Route Handler /api/assistente ]
   ├── 1. Identificação de Sessão Segura via getCurrentUser()
   ├── 2. Autenticação IBM Cloud IAM (Token Bearer com cache serverless)
   ├── 3. Envio ao endpoint A2A (JSON-RPC 2.0 message/send com { kind: "text" })
   ├── 4. Extração de texto robusta do retorno A2A (messages, history, artifacts, conversation_result)
   ├── 5. Se houver ação de dados (trocas, itens, reputação):
   │       └── Despacha determinística e seguramente para src/lib/assistant/actions.ts
   └── 6. Retorno de AssistantResponse padronizado ao frontend
```

---

## 2. Configuração do Agente no IBM watsonx Orchestrate

- **Endpoint A2A Live**: `https://api.au-syd.watson-orchestrate.cloud.ibm.com/instances/683cf7ca-4458-4c3b-b7df-c6d7f29b2e24/v1/orchestrate/A2A/agents/4c21d327-f8e5-401e-92c7-651e3b6428e1/environment/770cbc64-b448-4ecc-a9bf-6a8c7bccaf51`
- **Agent ID**: `4c21d327-f8e5-401e-92c7-651e3b6428e1`
- **Environment ID**: `770cbc64-b448-4ecc-a9bf-6a8c7bccaf51`
- **Região**: `au-syd`
- **Autenticação**: IBM Cloud IAM (`https://iam.cloud.ibm.com/identity/token`)

### Variáveis de Ambiente Necessárias (Vercel / Produção)
* `WATSONX_ORCHESTRATE_API_KEY`: API Key da IBM Cloud com permissão no watsonx Orchestrate.
* `WATSONX_ORCHESTRATE_AGENT_URL`: URL completa do agente (opcional, fallback padrão configurado para o endpoint Live acima).

---

## 3. Protocolo A2A (JSON-RPC 2.0)

### Formato da Requisição Enviada ao Agente
```json
{
  "jsonrpc": "2.0",
  "id": "uuid-requisicao",
  "method": "message/send",
  "params": {
    "message": {
      "messageId": "uuid-mensagem",
      "role": "user",
      "parts": [
        {
          "kind": "text",
          "text": "Olá, como funciona a troca de itens no ReUse?"
        }
      ]
    }
  }
}
```

---

## 4. Contrato da API da Aplicação (`POST /api/assistente`)

### 4.1. Entrada (Request do Widget)
```json
{
  "message": "Quais propostas de troca eu tenho pendentes?",
  "sessionId": "opcional-session-id"
}
```

### 4.2. Saída (Response padronizado `AssistantResponse`)
```json
{
  "sessionId": "uuid-sessao",
  "reply": "Você tem 1 proposta recebida aguardando sua resposta...",
  "intentDetected": "consultar_trocas_pendentes",
  "data": { ... },
  "quickActions": [
    {
      "label": "Ver Minhas Trocas",
      "actionType": "navigate",
      "payload": { "url": "/trocas" }
    }
  ],
  "requiresAuth": false
}
```

---

## 5. Garantias de Segurança e Execução Determinística

1. **Sessão Confiável**: A identidade do usuário nunca é aceita via corpo da mensagem do chat ou JSON enviado pelo cliente. O `id_usuario` é extraído exclusivamente via `getCurrentUser()` através do cookie seguro `reuse_session_user`.
2. **Autorização Local de Recursos**: Nenhuma alteração no banco de dados (ex: pausar/reativar item) é executada diretamente a partir de texto de IA. A aplicação valida permissões no backend (garante que `item.id_usuario === currentUser.id_usuario`).
3. **Credenciais Ocultas**: As chaves `WATSONX_ORCHESTRATE_API_KEY` e tokens IAM nunca trafegam para o cliente e não constam em respostas HTTP.
4. **Resiliência e Fallback Gracioso**: Caso a API do Orchestrate esteja offline ou a chave não esteja configurada no ambiente local, o backend aciona fallback local amigável sem quebrar a UI.
