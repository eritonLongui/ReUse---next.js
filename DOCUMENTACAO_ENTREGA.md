# ReUse! — Documentação Oficial do Projeto Web
**Entrega Acadêmica — FIAP (Next.js, Prisma ORM & PostgreSQL)**

---

## 1. Visão Geral do Projeto

O **ReUse!** é uma plataforma digital voltada à **economia circular**, reutilização de produtos e consumo consciente. O projeto visa conectar pessoas interessadas em **trocar objetos parados em bom estado**, evitando o descarte prematuro e fortalecendo comunidades locais.

A versão Web foi concebida e desenvolvida com **Next.js (App Router, React 19, TypeScript)**, estilização modular com **CSS Modules**, camada de persistência com **Prisma ORM** e banco de dados relacional **PostgreSQL**, preservando rigorosamente a identidade visual original (destaque em laranja `#FF9F1C`, primária `#1F3C88`, sem utilização de verde como cor principal e suporte aos assets oficiais do ReUse).

---

## 2. Desenvolvimento NextJS (Critério: 60%)

A arquitetura de rotas foi construída sobre o **App Router** do Next.js, combinando Server Components (para renderização rápida e consultas diretas ao banco de dados com Prisma) e Client Components (para interações de formulários, feedback em tempo real e chamadas de API).

### 2.1 Telas Desenvolvidas e seus Objetivos

| Rota | Tela | Tipo | Objetivo e Funcionalidades |
|---|---|---|---|
| `/` | **Landing Page / Home** | Server Component | Apresenta o manifesto e proposta de valor do ReUse (*"Troque. Reutilize. Transforme."*), seções conceituais (*"O Problema"* e *"A Solução"*), contadores estatísticos em tempo real e destaques de itens recentes disponíveis. |
| `/discover` | **Feed de Trocas** | Server Component | Principal área da plataforma. Permite buscar itens por palavra-chave, filtrar por categoria e estado de conservação, exibindo cards com fotos, donos e localização aproximada (Bairro, Cidade/UF). |
| `/itens/[id]` | **Detalhe do Item e Proposta** | Server + Client | Exibe todos os dados do objeto (conservação, descrição completa, proprietário e localização). Caso o usuário esteja autenticado, renderiza o formulário `ProposalForm` para selecionar um dos seus próprios itens e enviar uma proposta de troca com mensagem. |
| `/itens/novo` | **Anunciar Item** | Client Component | Formulário validado com **Zod** para cadastro de novos objetos de desapego, selecionando categoria ativa, estado de conservação, descrição e imagem. |
| `/trocas` | **Painel de Trocas** | Server + Client | Gestão completa de propostas recebidas e enviadas. Permite visualizar o item ofertado versus o item desejado, status (*PENDENTE, ACEITA, RECUSADA*) e botões interativos para aceitar ou recusar trocas em tempo real. |
| `/perfil` | **Perfil do Usuário** | Server Component | Exibe dados do usuário logado, endereço consultado, métricas de trocas e a grade com todos os itens cadastrados pelo próprio membro. |
| `/login` | **Autenticação** | Client Component | Acesso seguro à plataforma utilizando e-mail e senha com validação Zod e gerenciamento de sessão via cookies HttpOnly. |
| `/cadastro` | **Cadastro com ViaCEP** | Client Component | Registro de novos usuários com consulta automática ao webservice do **ViaCEP** no evento `onBlur` do campo de CEP, autopreenchendo logradouro, bairro, cidade e estado. Criptografa senhas com `bcryptjs`. |

### 2.2 Estrutura de Componentes Reutilizáveis
- `Header.tsx`: Cabeçalho responsivo com logo oficial, navegação rápida, links condicionais de autenticação e badge do perfil do usuário com botão de logout.
- `Footer.tsx`: Rodapé com links institucionais, missão sustentável e identificação do projeto acadêmico.
- `ProposalForm.tsx`: Componente de cliente para proposição de trocas com seleção de itens do inventário.
- `TradeActions.tsx`: Componente de cliente para aceite ou recusa com atualização de status.

---

## 3. Prisma ORM (Critério: 25%)

O **Prisma ORM (v6)** atua como camada única e fortemente tipada de abstração e acesso a dados relacional no PostgreSQL.

### 3.1 Contexto de Utilização por Tela e Operação

1. **Feed e Descoberta (`/discover`):**
   - Utilização de `prisma.item.findMany()` com cláusula `where` combinando filtros case-insensitive (`contains`), relacionamento com `categoria` e inclusão relacional do dono e seu respectivo `endereco`.
   ```typescript
   const items = await prisma.item.findMany({
     where: {
       disponivel: true,
       ...(q && { OR: [{ nome: { contains: q, mode: 'insensitive' } }, { descricao: { contains: q, mode: 'insensitive' } }] }),
       ...(cat && { categoria: { nome: cat } }),
       ...(estado && { estado_conservacao: estado }),
     },
     include: {
       categoria: true,
       usuario: { include: { endereco: true } },
     },
     orderBy: { data_cadastro: 'desc' },
   });
   ```

2. **Cadastro e Autenticação (`/api/auth/register` e `/api/auth/login`):**
   - Criação relacional atômica (nested write) de `Usuario` juntamente com seu `Endereco` em uma única instrução:
   ```typescript
   const newUser = await prisma.usuario.create({
     data: {
       nome: validated.nome,
       email: validated.email,
       senha: hashedPassword,
       endereco: {
         create: {
           cep: validated.cep,
           logradouro: validated.logradouro,
           bairro: validated.bairro,
           cidade: validated.cidade,
           uf: validated.uf,
         },
       },
     },
   });
   ```

3. **Proposta e Transação de Troca (`/api/trocas`):**
   - Utilização de transação interativa (`prisma.$transaction`) para garantir a consistência das tabelas `Troca` e a associativa `ItemTroca`:
   ```typescript
   const troca = await prisma.$transaction(async (tx) => {
     const novaTroca = await tx.troca.create({
       data: {
         id_usuario_proponente: user.id_usuario,
         id_usuario_destinatario: itemDesejado.id_usuario,
         mensagem: validated.mensagem,
         status: 'PENDENTE',
       },
     });

     await tx.itemTroca.create({
       data: { id_troca: novaTroca.id_troca, id_item: validated.id_item_ofertado, papel_item: 'OFERTADO' },
     });

     await tx.itemTroca.create({
       data: { id_troca: novaTroca.id_troca, id_item: validated.id_item_desejado, papel_item: 'DESEJADO' },
     });

     return novaTroca;
   });
   ```

4. **Aceite de Troca (`/api/trocas/[id]`):**
   - Transação que atualiza o status para `ACEITA` e automaticamente marca todos os itens envolvidos como `disponivel: false`.

---

## 4. Banco de Dados PostgreSQL (Critério: 15%)

A modelagem de dados segue a 3ª Forma Normal (3FN), com integridade referencial, constraints de unicidade e relacionamento N:N resolvido por entidade associativa.

### 4.1 Tabelas e seus Objetivos

1. **`usuarios` (`Usuario`)**:
   - **Objetivo**: Armazenar os membros da plataforma de trocas.
   - **Campos**: `id_usuario` (PK, Int autoincrement), `nome` (String), `email` (String Unique), `senha` (Hash bcrypt), `foto_perfil` (String opcional), `data_cadastro` (DateTime).

2. **`enderecos` (`Endereco`)**:
   - **Objetivo**: Armazenar a localização urbana do usuário para viabilizar trocas locais e cálculo de proximidade.
   - **Campos**: `id_endereco` (PK), `cep` (String), `logradouro` (String), `bairro` (String opcional), `cidade` (String), `uf` (String), `latitude` (Float opcional), `longitude` (Float opcional), `id_usuario` (FK Unique 1:1 com `Usuario` com `onDelete: Cascade`).

3. **`categorias` (`Categoria`)**:
   - **Objetivo**: Organizar e classificar os itens cadastrados (ex: Eletrônicos, Livros, Vestuário).
   - **Campos**: `id_categoria` (PK), `nome` (String Unique), `descricao` (String opcional), `ativo` (Boolean), `data_cadastro` (DateTime).

4. **`itens` (`Item`)**:
   - **Objetivo**: Representar os objetos disponibilizados para desapego e troca.
   - **Campos**: `id_item` (PK), `nome` (String), `descricao` (String), `estado_conservacao` (String), `foto_item` (String), `disponivel` (Boolean), `data_cadastro` (DateTime), `id_usuario` (FK `usuarios`), `id_categoria` (FK `categorias`).

5. **`trocas` (`Troca`)**:
   - **Objetivo**: Controlar o ciclo de vida de uma negociação entre dois usuários.
   - **Campos**: `id_troca` (PK), `id_usuario_proponente` (FK `usuarios`), `id_usuario_destinatario` (FK `usuarios`), `status` (String: PENDENTE, ACEITA, RECUSADA, CANCELADA), `mensagem` (String opcional), `data_solicitacao` (DateTime), `data_resposta` (DateTime opcional).

6. **`itens_troca` (`ItemTroca`)**:
   - **Objetivo**: Entidade associativa que resolve o relacionamento N:N entre `Item` e `Troca`, discriminando qual item foi ofertado e qual foi desejado.
   - **Campos**: `id_item_troca` (PK), `id_troca` (FK `trocas`), `id_item` (FK `itens`), `papel_item` (String: 'OFERTADO' ou 'DESEJADO'), `data_registro` (DateTime).

7. **`avaliacoes` (`Avaliacao`)**:
   - **Objetivo**: Registrar notas (1 a 5 estrelas) e feedbacks pós-troca para reputação da comunidade.
   - **Campos**: `id_avaliacao` (PK), `id_avaliador` (FK `usuarios`), `id_avaliado` (FK `usuarios`), `nota` (Int), `comentario` (String opcional), `data_cadastro` (DateTime).

---

## 5. Como Executar o Projeto Localmente

1. **Configurar as Variáveis de Ambiente:**
   - Copie o arquivo `.env.example` para `.env` e preencha a sua URL de banco PostgreSQL:
     ```env
     DATABASE_URL="postgresql://usuario:senha@host:porta/banco?sslmode=require"
     SESSION_SECRET="reuse-segredo-chave-super-segura"
     ```

2. **Aplicar as Migrações do Prisma no PostgreSQL:**
   ```bash
   npx prisma db push
   ```

3. **Popular o Banco com o Seed Acadêmico:**
   ```bash
   npm run prisma:seed
   ```

4. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`.

5. **Build de Produção:**
   ```bash
   npm run build
   npm run start
   ```
