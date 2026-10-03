import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando seed ampliado do ReUse! ---');

  // Limpeza de tabelas dependentes para garantir dados consistentes
  await prisma.avaliacao.deleteMany({});
  await prisma.favorito.deleteMany({});
  await prisma.itemTroca.deleteMany({});
  await prisma.troca.deleteMany({});
  await prisma.item.deleteMany({});

  // 1. Categorias Oficiais
  const categoriasData = [
    { nome: 'Eletrônicos', descricao: 'Smartphones, notebooks, fones, consoles e periféricos' },
    { nome: 'Livros e Revistas', descricao: 'Obras literárias, didáticos, quadrinhos e revistas' },
    { nome: 'Vestuário e Acessórios', descricao: 'Roupas, calçados, bolsas, mochilas e relógios' },
    { nome: 'Casa e Decoração', descricao: 'Móveis, luminárias, utensílios e objetos decorativos' },
    { nome: 'Esportes e Lazer', descricao: 'Bicicletas, skates, bolas, pesos e artigos de camping' },
    { nome: 'Brinquedos e Jogos', descricao: 'Jogos de tabuleiro, bonecos, blocos e quebra-cabeças' },
    { nome: 'Música e Instrumentos', descricao: 'Guitarras, teclados, violões, amplificadores e pedais' },
  ];

  const categoriasMap = new Map();
  for (const cat of categoriasData) {
    const c = await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: {
        nome: cat.nome,
        descricao: cat.descricao,
        ativo: true,
      },
    });
    categoriasMap.set(c.nome, c.id_categoria);
  }
  console.log(`✓ ${categoriasMap.size} categorias configuradas.`);

  // 2. Usuários de Exemplo com localizações geográficas em SP
  const defaultPassword = await bcrypt.hash('123456', 10);

  const u1 = await prisma.usuario.upsert({
    where: { email: 'eriton@reuse.com' },
    update: {},
    create: {
      nome: 'Eriton Silva',
      email: 'eriton@reuse.com',
      senha: defaultPassword,
      foto_perfil: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      endereco: {
        create: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          latitude: -23.5614,
          longitude: -46.6559,
        },
      },
    },
  });

  const u2 = await prisma.usuario.upsert({
    where: { email: 'marina@reuse.com' },
    update: {},
    create: {
      nome: 'Marina Duarte',
      email: 'marina@reuse.com',
      senha: defaultPassword,
      foto_perfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      endereco: {
        create: {
          cep: '04538-133',
          logradouro: 'Avenida Brigadeiro Faria Lima',
          bairro: 'Itaim Bibi',
          cidade: 'São Paulo',
          uf: 'SP',
          latitude: -23.5868,
          longitude: -46.6826,
        },
      },
    },
  });

  const u3 = await prisma.usuario.upsert({
    where: { email: 'lucas@reuse.com' },
    update: {},
    create: {
      nome: 'Lucas Mendes',
      email: 'lucas@reuse.com',
      senha: defaultPassword,
      foto_perfil: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
      endereco: {
        create: {
          cep: '05014-000',
          logradouro: 'Rua Palestra Itália',
          bairro: 'Perdizes',
          cidade: 'São Paulo',
          uf: 'SP',
          latitude: -23.5273,
          longitude: -46.6784,
        },
      },
    },
  });

  const u4 = await prisma.usuario.upsert({
    where: { email: 'camila@reuse.com' },
    update: {},
    create: {
      nome: 'Camila Rocha',
      email: 'camila@reuse.com',
      senha: defaultPassword,
      foto_perfil: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      endereco: {
        create: {
          cep: '04005-000',
          logradouro: 'Rua Domingos de Morais',
          bairro: 'Vila Mariana',
          cidade: 'São Paulo',
          uf: 'SP',
          latitude: -23.5899,
          longitude: -46.6388,
        },
      },
    },
  });

  console.log('✓ 4 usuários configurados com endereços georreferenciados.');

  // 3. Itens Cadastrados Diversificados
  const itensParaCadastrar = [
    // Itens de Eriton (u1)
    {
      nome: 'Kindle Paperwhite 11ª Geração',
      descricao: 'Leitor digital com tela antirreflexo de 6.8 pol e bateria de semanas. Sem nenhum arranhão.',
      estado_conservacao: 'Como Novo',
      foto_item: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u1.id_usuario,
      id_categoria: categoriasMap.get('Eletrônicos'),
    },
    {
      nome: 'Headphone Bluetooth Sony WH-CH520',
      descricao: 'Fone de ouvido sem fio preto com até 50h de bateria e conexão multiponto excelente.',
      estado_conservacao: 'Excelente',
      foto_item: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u1.id_usuario,
      id_categoria: categoriasMap.get('Eletrônicos'),
    },
    {
      nome: 'Mochila Impermeável para Notebook',
      descricao: 'Mochila antifurto executiva com compartimento acolchoado para notebook de até 15.6 pol.',
      estado_conservacao: 'Bom',
      foto_item: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      disponivel: false,
      id_usuario: u1.id_usuario,
      id_categoria: categoriasMap.get('Vestuário e Acessórios'),
    },
    // Itens de Marina (u2)
    {
      nome: 'Livro Clean Architecture - Robert C. Martin',
      descricao: 'Guia do artesão para estrutura e design de software. Folhas limpas, sem anotações.',
      estado_conservacao: 'Novo',
      foto_item: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u2.id_usuario,
      id_categoria: categoriasMap.get('Livros e Revistas'),
    },
    {
      nome: 'Bicicleta Caloi Aro 29 em Alumínio',
      descricao: 'Câmbio Shimano 21 marchas, freios a disco mecânicos e amortecedor dianteiro.',
      estado_conservacao: 'Bom',
      foto_item: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u2.id_usuario,
      id_categoria: categoriasMap.get('Esportes e Lazer'),
    },
    {
      nome: 'Luminária Industrial Articulada',
      descricao: 'Luminária de mesa em metal cobre retrô, base pesada antiderrapante com lâmpada de filamento.',
      estado_conservacao: 'Como Novo',
      foto_item: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u2.id_usuario,
      id_categoria: categoriasMap.get('Casa e Decoração'),
    },
    // Itens de Lucas (u3)
    {
      nome: 'Guitarra Fender Stratocaster Squier',
      descricao: 'Cor preta com escudo branco, recém regulada por luthier. Acompanha capa e correia.',
      estado_conservacao: 'Como Novo',
      foto_item: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u3.id_usuario,
      id_categoria: categoriasMap.get('Música e Instrumentos'),
    },
    {
      nome: 'Jogo de Tabuleiro Catan - Edição Oficial',
      descricao: 'Jogo clássico de colonização e comércio completo, cartas com sleeves protetores.',
      estado_conservacao: 'Novo',
      foto_item: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u3.id_usuario,
      id_categoria: categoriasMap.get('Brinquedos e Jogos'),
    },
    // Itens de Camila (u4)
    {
      nome: 'Cafeteira Prensa Francesa em Vidro Borossilicato',
      descricao: 'Cafeteira de 600ml com êmbolo duplo em inox. Café encorpado e aromático.',
      estado_conservacao: 'Como Novo',
      foto_item: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u4.id_usuario,
      id_categoria: categoriasMap.get('Casa e Decoração'),
    },
    {
      nome: 'Patins In-line Ajustável Roller 38-41',
      descricao: 'Patins inline semi-profissional com rolamentos ABEC-7 e kit completo de proteção.',
      estado_conservacao: 'Bom',
      foto_item: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?w=600&auto=format&fit=crop&q=80',
      disponivel: true,
      id_usuario: u4.id_usuario,
      id_categoria: categoriasMap.get('Esportes e Lazer'),
    },
  ];

  const itensCriados = [];
  for (const it of itensParaCadastrar) {
    const item = await prisma.item.create({
      data: it,
    });
    itensCriados.push(item);
  }
  console.log(`✓ ${itensCriados.length} itens cadastrados no catálogo.`);

  const itemKindle = itensCriados[0];
  const itemFone = itensCriados[1];
  const itemMochila = itensCriados[2];
  const itemCleanArch = itensCriados[3];
  const itemBike = itensCriados[4];
  const itemLuminaria = itensCriados[5];
  const itemGuitarra = itensCriados[6];
  const itemCatan = itensCriados[7];
  const itemPrensa = itensCriados[8];

  // 4. Trocas em Diferentes Estados do Ciclo de Vida
  const troca1 = await prisma.troca.create({
    data: {
      id_usuario_proponente: u1.id_usuario,
      id_usuario_destinatario: u2.id_usuario,
      status: 'ACEITA',
      mensagem: 'Olá Marina, aceita trocar a mochila impermeável pelo seu livro de Clean Architecture?',
      data_solicitacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      data_resposta: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.itemTroca.createMany({
    data: [
      { id_troca: troca1.id_troca, id_item: itemMochila.id_item, papel_item: 'OFERTADO' },
      { id_troca: troca1.id_troca, id_item: itemCleanArch.id_item, papel_item: 'DESEJADO' },
    ],
  });

  const troca2 = await prisma.troca.create({
    data: {
      id_usuario_proponente: u3.id_usuario,
      id_usuario_destinatario: u1.id_usuario,
      status: 'ACEITA',
      mensagem: 'Fala Eriton! Tenho interesse no fone Sony, aceita o Catan?',
      data_solicitacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      data_resposta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.itemTroca.createMany({
    data: [
      { id_troca: troca2.id_troca, id_item: itemCatan.id_item, papel_item: 'OFERTADO' },
      { id_troca: troca2.id_troca, id_item: itemFone.id_item, papel_item: 'DESEJADO' },
    ],
  });

  const troca3 = await prisma.troca.create({
    data: {
      id_usuario_proponente: u4.id_usuario,
      id_usuario_destinatario: u1.id_usuario,
      status: 'PENDENTE',
      mensagem: 'Olá! Adorei seu Kindle Paperwhite. Aceitaria a prensa francesa e mais algum item?',
      data_solicitacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.itemTroca.createMany({
    data: [
      { id_troca: troca3.id_troca, id_item: itemPrensa.id_item, papel_item: 'OFERTADO' },
      { id_troca: troca3.id_troca, id_item: itemKindle.id_item, papel_item: 'DESEJADO' },
    ],
  });

  const troca4 = await prisma.troca.create({
    data: {
      id_usuario_proponente: u1.id_usuario,
      id_usuario_destinatario: u3.id_usuario,
      status: 'RECUSADA',
      mensagem: 'Olá Lucas! Aceita negociar a guitarra Fender pelo Kindle?',
      data_solicitacao: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      data_resposta: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.itemTroca.createMany({
    data: [
      { id_troca: troca4.id_troca, id_item: itemKindle.id_item, papel_item: 'OFERTADO' },
      { id_troca: troca4.id_troca, id_item: itemGuitarra.id_item, papel_item: 'DESEJADO' },
    ],
  });

  console.log('✓ 4 trocas registradas (2 Aceitas, 1 Pendente, 1 Recusada).');

  // 5. Avaliações e Reputação
  await prisma.avaliacao.create({
    data: {
      id_troca: troca1.id_troca,
      id_avaliador: u2.id_usuario,
      id_avaliado: u1.id_usuario,
      nota: 5,
      comentario: 'A troca foi excelente! A mochila estava impecável e o Eriton foi super pontual no ponto de encontro na Paulista.',
      data_cadastro: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.avaliacao.create({
    data: {
      id_troca: troca1.id_troca,
      id_avaliador: u1.id_usuario,
      id_avaliado: u2.id_usuario,
      nota: 5,
      comentario: 'Recomendo muito! O livro está novinho e a comunicação foi nota 10.',
      data_cadastro: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.avaliacao.create({
    data: {
      id_troca: troca2.id_troca,
      id_avaliador: u3.id_usuario,
      id_avaliado: u1.id_usuario,
      nota: 5,
      comentario: 'Muito gente boa, produto exatamente como descrito no anúncio. Comunidade ReUse recomendadíssima!',
      data_cadastro: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✓ Avaliações e comentários reais vinculados às trocas aceitas.');

  // 6. Favoritos do Usuário Eriton (u1)
  await prisma.favorito.createMany({
    data: [
      { id_usuario: u1.id_usuario, id_item: itemGuitarra.id_item },
      { id_usuario: u1.id_usuario, id_item: itemBike.id_item },
      { id_usuario: u1.id_usuario, id_item: itemLuminaria.id_item },
    ],
    skipDuplicates: true,
  });

  await prisma.favorito.createMany({
    data: [
      { id_usuario: u2.id_usuario, id_item: itemKindle.id_item },
      { id_usuario: u4.id_usuario, id_item: itemKindle.id_item },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Lista de itens favoritos configurada.');
  console.log('--- Seed do ReUse! finalizado com sucesso absoluto! ---');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
