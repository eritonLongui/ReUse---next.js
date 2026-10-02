# TASK_LIST.md — Checklist de Implementação em 5 Etapas

Este arquivo lista detalhadamente os requisitos, tarefas técnicas e status de execução das 5 próximas funcionalidades do **ReUse!**.

---

## 📌 Status Geral

- [x] **Etapa 1**: Trocas por Proximidade
- [x] **Etapa 2**: Favoritos
- [x] **Etapa 3**: Histórico de Trocas
- [ ] **Etapa 4**: Reputação e Avaliações
- [ ] **Etapa 5**: Dashboard Simples no Perfil

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
- [ ] **4.1. Ajuste no Modelo Prisma**
  - [ ] Vincular `Avaliacao` à `Troca` (`id_troca Int` com relação opcional ou única para evitar avaliações duplicadas por troca).
  - [ ] Rodar `npm run prisma:push` e `npm run prisma:generate`.
- [ ] **4.2. API de Avaliação**
  - [ ] Criar `POST /api/avaliacoes` com validação Zod (`nota` de 1 a 5, `comentario` opcional, verificação se a troca foi realmente `CONCLUIDA`).
- [ ] **4.3. Interface de Feedback / Avaliação**
  - [ ] Adicionar botão "Avaliar Troca" no histórico da página `/trocas` para trocas concluídas ainda não avaliadas.
  - [ ] Criar modal ou formulário inline com seletor de estrelas interativo (1 a 5).
- [ ] **4.4. Exibição da Reputação**
  - [ ] No `/perfil`: calcular e exibir a nota média, total de avaliações e lista dos últimos comentários recebidos.
  - [ ] Em `/itens/[id]` e nos cards do feed: exibir badge com média do anunciante (ex: `★ 4.9 (12 avaliações)`).

---

## 📊 Etapa 5: Dashboard Simples no Perfil

> **Objetivo**: Oferecer ao usuário um painel analítico com métricas de engajamento, trocas e impacto ambiental positivo.

### Tarefas
- [ ] **5.1. Agregação de Dados e Consultas**
  - [ ] Criar queries otimizadas no Server Component do `/perfil`:
    - Total de itens cadastrados e ativos vs trocados.
    - Total de trocas concluídas com sucesso.
    - Média geral de reputação e avaliações recebidas.
    - Estimativa de impacto ecológico (ex: ~2.5 kg de resíduos e CO₂ evitados por item trocado).
- [ ] **5.2. Componentes de UI do Dashboard**
  - [ ] Criar cards de estatísticas destacados (estilo KPI cards) com ícones e variações de cores (`#1F3C88` e `#FF9F1C`).
  - [ ] Adicionar barra de progresso ou gráfico em CSS puro para divisão de itens por categoria.
  - [ ] Adicionar seção de "Destaque de Impacto Sustentável" com selo de economia circular.
- [ ] **5.3. Responsividade e Polimento**
  - [ ] Garantir layout fluido e legível em telas móveis e desktop.
  - [ ] Verificar consistência estética com os módulos CSS existentes.

---

## 💡 Guia de Execução para os Agentes

1. Selecione a etapa com tarefas pendentes na ordem numérica (Etapa 1 -> Etapa 2 -> Etapa 3 -> Etapa 4 -> Etapa 5).
2. Marque a caixa de seleção com `[x]` à medida que cada subtarefa for completada.
3. Não inicie uma etapa subsequente sem antes validar as alterações e o build da etapa atual.
