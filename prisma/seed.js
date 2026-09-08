import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do ReUse!...');

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

  const categoriasCriadas = [];
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
    categoriasCriadas.push(c);
  }
  console.log(`${categoriasCriadas.length} categorias configuradas.`);

  // 2. Usuários de Exemplo
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

  console.log('Usuários de demonstração prontos.');

  // 3. Itens Cadastrados para Demonstração de Trocas
  const catEletronicos = categoriasCriadas.find((c) => c.nome === 'Eletrônicos');
  const catLivros = categoriasCriadas.find((c) => c.nome === 'Livros e Revistas');
  const catEsportes = categoriasCriadas.find((c) => c.nome === 'Esportes e Lazer');
  const catMusica = categoriasCriadas.find((c) => c.nome === 'Música e Instrumentos');

  if (catEletronicos && catLivros && catEsportes && catMusica) {
    const item1 = await prisma.item.create({
      data: {
        nome: 'Kindle Paperwhite 11ª Geração',
        descricao: 'Leitor digital com tela antirreflexo de 6.8 polegadas e iluminação ajustável. Bateria com duração de semanas. Sem nenhum arranhão na tela.',
        estado_conservacao: 'Como Novo',
        foto_item: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600&auto=format&fit=crop&q=80',
        disponivel: true,
        id_usuario: u1.id_usuario,
        id_categoria: catEletronicos.id_categoria,
      },
    });

    const item2 = await prisma.item.create({
      data: {
        nome: 'Livro Clean Architecture - Robert C. Martin',
        descricao: 'Livro clássico sobre arquitetura de software, guia do artesão para estrutura e design. Folhas limpas, sem anotações ou grifos.',
        estado_conservacao: 'Novo',
        foto_item: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        disponivel: true,
        id_usuario: u2.id_usuario,
        id_categoria: catLivros.id_categoria,
      },
    });

    const item3 = await prisma.item.create({
      data: {
        nome: 'Bicicleta Caloi Aro 29 em Alumínio',
        descricao: 'Bicicleta montada com câmbio Shimano de 21 velocidades, freios a disco mecânicos e amortecedor dianteiro. Acompanha capacete e bomba de ar.',
        estado_conservacao: 'Bom',
        foto_item: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
        disponivel: true,
        id_usuario: u2.id_usuario,
        id_categoria: catEsportes.id_categoria,
      },
    });

    const item4 = await prisma.item.create({
      data: {
        nome: 'Guitarra Fender Stratocaster Squier',
        descricao: 'Cor preta com escudo branco, recém regulada por luthier profissional. Acompanha capa protetora acolchoada e correia confortável.',
        estado_conservacao: 'Como Novo',
        foto_item: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=600&auto=format&fit=crop&q=80',
        disponivel: true,
        id_usuario: u3.id_usuario,
        id_categoria: catMusica.id_categoria,
      },
    });

    // 4. Proposta de Troca de Exemplo
    const trocaExemplo = await prisma.troca.create({
      data: {
        id_usuario_proponente: u1.id_usuario,
        id_usuario_destinatario: u2.id_usuario,
        status: 'PENDENTE',
        mensagem: 'Olá Marina! Tenho muito interesse no livro de Clean Architecture. Aceita meu Kindle ou outro item do meu perfil em troca?',
      },
    });

    await prisma.itemTroca.create({
      data: {
        id_troca: trocaExemplo.id_troca,
        id_item: item1.id_item,
        papel_item: 'OFERTADO',
      },
    });

    await prisma.itemTroca.create({
      data: {
        id_troca: trocaExemplo.id_troca,
        id_item: item2.id_item,
        papel_item: 'DESEJADO',
      },
    });

    console.log('Itens e trocas de exemplo inseridos com sucesso.');
  }

  console.log('Seed do ReUse! concluído com êxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
