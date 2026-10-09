# TASK_LIST.md — Checklist de Implementação em 5 Etapas

Este arquivo lista detalhadamente os requisitos, tarefas técnicas e status de execução das 5 próximas funcionalidades do **ReUse**.

---

## 📌 Status Geral

- [x] **Etapa 1**: Trocas por Proximidade
- [x] **Etapa 2**: Favoritos
- [x] **Etapa 3**: Histórico de Trocas
- [x] **Etapa 4**: Reputação e Avaliações
- [x] **Etapa 5**: Dashboard Simples no Perfil
- [ ] **Etapa 6**: Assistente Virtual com IBM watsonx (Execução & Orientação)

---

## 🗺️ Etapa 1: Trocas por Proximidade

> **Objetivo**: Permitir que usuários filtrem e ordenem itens disponíveis no Feed com base na distância geográfica (km) entre sua localização e o anunciante.

### Tarefas
- [x] **1.1. Suporte a Coordenadas no Cadastro/Perfil**
  - [x] Verificado preenchimento de `latitude` e `longitude` no modelo `Endereco`.
- [x] **1.2. Utilitário de Distância**
  - [x] Criado módulo `src/lib/geo.ts` com cálculo de Haversine (`calculateDistanceKm`) e formatação discreta (`formatDistance`).
- [x] **1.3. Filtros no Feed (`/discover`)**
  - [x] Adicionado seletor de raio de distância (*Qualquer Distância, Até 5 km, 10 km, 25 km, 50 km*).
  - [x] Adicionada ordenação opcional (*Mais Recentes* e *Mais Próximos*).
  - [x] Indicador contextual de origem do cálculo no topo dos resultados.
  - [x] Badge discreta com distância aproximada em cada card de item (ex: `A 1,2 km de você`).
- [x] **1.4. Testes e Validação**
  - [x] Cenários validados com e sem localização (fallback gracioso sem expor coordenadas exatas e sem quebras).


---

## ⭐ Etapa 2: Favoritos

> **Objetivo**: Permitir que os usuários salvem itens do Feed para consulta posterior e acompanhamento fácil.

### Tarefas
- [x] **2.1. Modelagem Prisma**
  - [x] Adicionar o modelo `Favorito` em `prisma/schema.prisma` com constraint única `@@unique([id_usuario, id_item])`.
  - [x] Executado `npm run prisma:push` e `npm run prisma:generate`.
- [x] **2.2. API Handlers**
  - [x] Criada rota `/api/favoritos` com métodos `GET`, `POST` e `DELETE` protegidos por autenticação e validados com Zod.
- [x] **2.3. Interface e Botão de Favoritar**
  - [x] Criado componente client `FavoriteButton` com feedback otimista e ícone de coração (`Heart` do Lucide).
  - [x] Integrado botão discreto nos cards do Feed (`/discover`).
  - [x] Redirecionamento automático para `/login` para usuários não autenticados.
- [x] **2.4. Seção no Perfil**
  - [x] Adicionada a seção "Meus Favoritos" no `/perfil` exibindo os itens favoritados pelo usuário.
  - [x] Badge de status seguro para itens indisponíveis/trocados e links diretos para detalhes do item.


---

## 📜 Etapa 3: Histórico de Trocas

> **Objetivo**: Aprimorar a gestão de trocas com histórico completo, estados finais e registro cronológico das negociações sem criar novas tabelas.

### Tarefas
- [x] **3.1. Separação Visual no Painel (`/trocas`)**
  - [x] Propostas ativas divididas em: *Propostas Recebidas Pendentes* e *Propostas Enviadas Aguardando Resposta*.
  - [x] Seção dedicada de *Histórico de Trocas* para estados concluídos (`ACEITA`, `RECUSADA`, `CANCELADA`).
- [x] **3.2. Identificação de Papéis e Prazos**
  - [x] Badges visuais indicando claramente se o usuário propôs ou recebeu a negociação.
  - [x] Exibição das datas e horários de solicitação e resposta/conclusão.
  - [x] Ação de cancelamento de proposta enviada pendente pelo proponente.
- [x] **3.3. Filtros do Histórico**
  - [x] Filtros por status (*Todas, Aceitas, Recusadas, Canceladas*) integrados via query params simples.
- [x] **3.4. Métrica no Perfil (`/perfil`)**
  - [x] Indicador "Trocas Realizadas" no header do perfil computando apenas trocas com status `ACEITA`.


---

## 🌟 Etapa 4: Reputação e Avaliações

> **Objetivo**: Estabelecer confiança na comunidade permitindo notas e depoimentos após trocas concluídas com sucesso.

### Tarefas
- [x] **4.1. Ajuste no Modelo Prisma**
  - [x] Vincular `Avaliacao` à `Troca` (`id_troca Int` com relação opcional ou única para evitar avaliações duplicadas por troca).
  - [x] Rodar `npm run prisma:push` e `npm run prisma:generate`.
- [x] **4.2. API de Avaliação**
  - [x] Criar `POST /api/avaliacoes` com validação Zod (`nota` de 1 a 5, `comentario` opcional, verificação se a troca foi realmente `ACEITA`).
- [x] **4.3. Interface de Feedback / Avaliação**
  - [x] Adicionar botão "Avaliar Troca" no histórico da página `/trocas` para trocas concluídas ainda não avaliadas.
  - [x] Criar modal ou formulário inline com seletor de estrelas interativo (1 a 5).
- [x] **4.4. Exibição da Reputação**
  - [x] No `/perfil`: calcular e exibir a nota média, total de avaliações e lista dos últimos comentários recebidos.

---

## 📊 Etapa 5: Dashboard Simples no Perfil

> **Objetivo**: Oferecer ao usuário um painel analítico pessoal com métricas de engajamento, trocas e atividades recentes reais.

### Tarefas
- [x] **5.1. Agregação de Dados e Consultas**
  - [x] Queries otimizadas e eficientes no Server Component do `/perfil` (itens, trocas ACEITA, favoritos, avaliações e histórico recente).
- [x] **5.2. Componentes de UI do Dashboard (Resumo)**
  - [x] Cards compactos, responsivos e clicáveis (Meus Itens, Trocas Realizadas, Favoritos e Reputação com tratamento gracioso de sem avaliações).
  - [x] Seção de "Atividade recente" baseada exclusivamente em dados reais existentes.
- [x] **5.3. Responsividade e Polimento**
  - [x] Layout fluido em desktop e mobile com CSS Modules seguindo a paleta oficial.

---

## 🤖 Etapa 6: Assistente Virtual com IBM watsonx (Execução & Orientação)
 
> **Objetivo**: Integrar um assistente virtual conversacional capaz de responder dúvidas sobre a plataforma e executar consultas e ações seguras autorizadas pelo usuário autenticado.
 
### Tarefas
- [x] **6.1. Contrato e Arquitetura da Camada de Assistente**
  - [x] Definir catálogo de intents e schemas Zod para ações e consultas estruturadas.
  - [x] Criar especificações dos payloads de entrada e saída para integração com o watsonx.
  - [x] Documentar o fluxo de autorização server-side baseado em sessão HttpOnly.
- [x] **6.2. Camada Segura de Ações e Consultas do Backend**
  - [x] Criar serviço isolado para despacho de intenções seguras (`src/lib/assistant/actions.ts`).
  - [x] Implementar consultas autorizadas:
    - [x] `consultar_trocas_pendentes` (recebidas e enviadas).
    - [x] `consultar_meus_itens` (itens cadastrados e status).
    - [x] `consultar_reputacao` (nota média e total de avaliações).
  - [x] Implementar ações autorizadas:
    - [x] `alternar_disponibilidade_item` (pausar/reativar anúncio próprio).
    - [x] `buscar_itens` (mapeamento para busca com filtros e distância).
- [ ] **6.3. Base de Conhecimento e Respostas de Orientação (FAQ / Ajuda)**
  - [ ] Mapear respostas estruturadas de orientação da plataforma:
    - [ ] Como criar conta e autenticar.
    - [ ] Como cadastrar um objeto.
    - [ ] Como funciona a busca por proximidade geográfica.
    - [ ] Como enviar, responder ou cancelar uma proposta de troca.
    - [ ] Como avaliar usuários e consultar reputação.
  - [ ] Gerar links contextuais para navegação direta (`/itens/novo`, `/discover`, `/trocas`, `/perfil`).
- [ ] **6.4. Interface Conversacional (Chat Widget no Frontend)**
  - [ ] Criar componente de chat flutuante acessível globalmente em `src/app/layout.tsx`.
  - [ ] Implementar visual aderente à paleta ReUse (`#1F3C88`, `#FF9F1C`, CSS Modules).
  - [ ] Suportar cards de ação rápida (botões interativos para navegar, alternar disponibilidade de item ou ver trocas).
  - [ ] Tratar estados de loading, mensagens de erro amigáveis e feedback de ações executadas.
- [ ] **6.5. Endpoint de Integração com IBM watsonx e Conexão Externa**
  - [ ] Criar Route Handler protegido `/api/assistente` (com validação Zod e checagem de sessão).
  - [ ] Implementar cliente/adaptador desacoplado para chamada ao IBM watsonx (Assistant API v2).
  - [ ] Configurar variáveis de ambiente seguras (`WATSONX_API_KEY`, `WATSONX_SERVICE_URL`, `WATSONX_ASSISTANT_ID`, etc.).
  - [ ] Tratar fallback gracioso em caso de indisponibilidade da API externa.
- [ ] **6.6. Validação, Testes e Documentação**
  - [ ] Testar cenários autenticados vs não autenticados (garantir que ações restritas sejam bloqueadas).
  - [ ] Validar que nenhum usuário consiga alterar ou visualizar dados privados de terceiros via intenções.
  - [ ] Validar build (`npm run lint` e `npm run build`).

---

## 💡 Guia de Execução para os Agentes

1. Selecione a etapa com tarefas pendentes na ordem numérica (Etapa 1 -> Etapa 2 -> Etapa 3 -> Etapa 4 -> Etapa 5 -> Etapa 6).
2. Marque a caixa de seleção com `[x]` à medida que cada subtarefa for completada.
3. Não inicie uma etapa subsequente sem antes validar as alterações e o build da etapa atual.
