# Contrato e Arquitetura do Assistente Virtual ReUse! (IBM watsonx)

Este documento descreve os contratos de dados, formatos de requisição/resposta, intenções reconhecidas e garantias de segurança para a integração com o **IBM watsonx Assistant**.

---

## 1. Visão Geral da Arquitetura

```text
[ Cliente (Chat Widget) ]
           │
           │ POST /api/assistente { message, sessionId? } (Cookie HttpOnly incluso)
           ▼
[ Next.js Route Handler /api/assistente ]
   ├── 1. Identificação de Sessão Segura via getCurrentUser()
   ├── 2. Chamada à API v2 do IBM watsonx Assistant (REST API nativa)
   ├── 3. Detecção de Intent e Entidades estruturadas
   ├── 4. Se a Intent for uma Ação Protegida:
   │       └── Despacha para src/lib/assistant/actions.ts (validação Zod + checagem de propriedade)
   └── 5. Retorno de AssistantResponse unificado
```

---

## 2. Catálogo de Intents de Alta Prioridade

| Intent | Tipo | Autenticação Exigida? | Descrição |
| :--- | :--- | :--- | :--- |
| `consultar_trocas_pendentes` | Consulta | Sim | Retorna propostas recebidas e enviadas com status `PENDENTE`. |
| `consultar_meus_itens` | Consulta | Sim | Retorna lista dos itens cadastrados pelo usuário autenticado. |
| `pausar_item` | Mutação | Sim | Altera `disponivel` para `false` do item indicado (apenas se for do usuário). |
| `reativar_item` | Mutação | Sim | Altera `disponivel` para `true` do item indicado (apenas se for do usuário). |
| `consultar_reputacao` | Consulta | Sim | Retorna nota média, total de avaliações e comentários recebidos. |
| `buscar_itens` | Navegação / Busca | Não | Interpreta filtros (categoria, termo, raio) e gera link contextual para `/discover`. |
| `ajuda_cadastrar_item` | FAQ | Não | Orientações de como anunciar um item com atalho para `/itens/novo`. |
| `ajuda_fazer_troca` | FAQ | Não | Explica o ciclo de propostas, aceitação e recusa. |
| `ajuda_proximidade` | FAQ | Não | Explica como o cálculo geográfico e filtros de raio em km funcionam. |
| `ajuda_avaliar` | FAQ | Não | Explica as regras de reputação após trocas aceitas. |
| `ajuda_geral` | FAQ | Não | Apresenta as principais funcionalidades da plataforma. |

---

## 3. Contrato da API (`POST /api/assistente`)

### 3.1. Entrada (Request)
```json
{
  "message": "Quais propostas de troca eu tenho pendentes?",
  "sessionId": "opcional-watson-session-id"
}
```

* Validação com Zod: `message` (obrigatória, entre 1 e 1000 caracteres), `sessionId` (opcional).

### 3.2. Saída (Response)
```json
{
  "sessionId": "a1b2c3d4-...",
  "reply": "Você possui 2 propostas de troca pendentes para seus itens.",
  "intentDetected": "consultar_trocas_pendentes",
  "data": {
    "totalRecebidas": 2,
    "totalEnviadas": 0,
    "recebidas": [...]
  },
  "quickActions": [
    {
      "label": "Ver Minhas Trocas",
      "actionType": "navigate",
      "payload": {
        "url": "/trocas"
      }
    }
  ],
  "requiresAuth": false
}
```

---

## 4. Garantias de Segurança

1. **Sessão Confiável**: A identidade do usuário nunca é aceita via corpo da mensagem do chat ou JSON enviado pelo cliente. O `id_usuario` é extraído exclusivamente via `getCurrentUser()` através do cookie seguro `reuse_session_user`.
2. **Autorização de Recursos Próprios**: Ao pausar/reativar um item (`pausar_item`), o sistema verifica no banco se `item.id_usuario === currentUser.id_usuario`. Se pertencer a outro usuário, a ação é bloqueada com status 403 / mensagem amigável de erro.
3. **Credenciais Ocultas**: Nenhuma chave (`WATSONX_API_KEY`) trafega para o navegador. Todas as chamadas para o watsonx Assistant ocorrem do servidor para a nuvem da IBM.
4. **Fallback Gracioso**: Se o watsonx estiver offline ou se as chaves ainda não estiverem configuradas, o backend responde com base de conhecimento local e orienta o usuário sem quebrar a aplicação.
