import { prisma } from '@/lib/prisma';
import {
  AlternarDisponibilidadeItemParams,
  BuscarItensParams,
  alternarDisponibilidadeItemSchema,
  buscarItensSchema,
  AssistantResponse,
} from './types';

/**
 * Consulta propostas de troca pendentes do usuário logado (recebidas e enviadas)
 */
export async function handleConsultarTrocasPendentes(userId: number): Promise<AssistantResponse> {
  const [recebidas, enviadas] = await Promise.all([
    prisma.troca.findMany({
      where: {
        id_usuario_destinatario: userId,
        status: 'PENDENTE',
      },
      include: {
        proponente: { select: { nome: true } },
        itens: {
          include: {
            item: { select: { id_item: true, nome: true } },
          },
        },
      },
      orderBy: { data_solicitacao: 'desc' },
      take: 5,
    }),
    prisma.troca.findMany({
      where: {
        id_usuario_proponente: userId,
        status: 'PENDENTE',
      },
      include: {
        destinatario: { select: { nome: true } },
        itens: {
          include: {
            item: { select: { id_item: true, nome: true } },
          },
        },
      },
      orderBy: { data_solicitacao: 'desc' },
      take: 5,
    }),
  ]);

  const totalRecebidas = recebidas.length;
  const totalEnviadas = enviadas.length;

  if (totalRecebidas === 0 && totalEnviadas === 0) {
    return {
      reply: 'Você não tem nenhuma proposta de troca pendente no momento.',
      intentDetected: 'consultar_trocas_pendentes',
      data: { totalRecebidas: 0, totalEnviadas: 0 },
      quickActions: [
        {
          label: 'Explorar Itens no Feed',
          actionType: 'navigate',
          payload: { url: '/discover' },
        },
      ],
    };
  }

  let detalhe = `Você tem **${totalRecebidas}** proposta(s) recebida(s) aguardando sua resposta e **${totalEnviadas}** enviada(s) aguardando retorno.`;

  if (totalRecebidas > 0) {
    const primeiraRecebida = recebidas[0];
    const itemOferecido = primeiraRecebida.itens.find((i) => i.papel_item === 'OFERTADO')?.item.nome;
    const itemDesejado = primeiraRecebida.itens.find((i) => i.papel_item === 'DESEJADO')?.item.nome;
    detalhe += `\n\nExemplo de proposta recebida recente: **${primeiraRecebida.proponente.nome}** ofereceu "${itemOferecido || 'um item'}" pelo seu "${itemDesejado || 'item'}".`;
  }

  return {
    reply: detalhe,
    intentDetected: 'consultar_trocas_pendentes',
    data: {
      totalRecebidas,
      totalEnviadas,
      recebidas: recebidas.map((r) => ({
        id_troca: r.id_troca,
        de: r.proponente.nome,
        data: r.data_solicitacao,
      })),
      enviadas: enviadas.map((e) => ({
        id_troca: e.id_troca,
        para: e.destinatario.nome,
        data: e.data_solicitacao,
      })),
    },
    quickActions: [
      {
        label: 'Ver Minhas Trocas',
        actionType: 'navigate',
        payload: { url: '/trocas' },
      },
    ],
  };
}

/**
 * Consulta os itens cadastrados pelo usuário autenticado
 */
export async function handleConsultarMeusItens(userId: number): Promise<AssistantResponse> {
  const itens = await prisma.item.findMany({
    where: { id_usuario: userId },
    include: { categoria: { select: { nome: true } } },
    orderBy: { data_cadastro: 'desc' },
  });

  if (itens.length === 0) {
    return {
      reply: 'Você ainda não cadastrou nenhum objeto para troca no ReUse.',
      intentDetected: 'consultar_meus_itens',
      data: { total: 0, itens: [] },
      quickActions: [
        {
          label: 'Cadastrar Meu Primeiro Item',
          actionType: 'navigate',
          payload: { url: '/itens/novo' },
        },
      ],
    };
  }

  const disponiveis = itens.filter((i) => i.disponivel);
  const pausadosOuTrocados = itens.filter((i) => !i.disponivel);

  let reply = `Você possui **${itens.length}** objeto(s) cadastrado(s) (${disponiveis.length} disponível(is) e ${pausadosOuTrocados.length} indisponível(is)/pausado(s)).`;

  const topItens = itens.slice(0, 3).map((it) => `• **${it.nome}** (${it.disponivel ? 'Disponível' : 'Pausado/Trocado'})`).join('\n');
  reply += `\n\nSeus itens mais recentes:\n${topItens}`;

  return {
    reply,
    intentDetected: 'consultar_meus_itens',
    data: {
      total: itens.length,
      disponiveis: disponiveis.length,
      pausados: pausadosOuTrocados.length,
      itens: itens.map((i) => ({
        id_item: i.id_item,
        nome: i.nome,
        disponivel: i.disponivel,
        categoria: i.categoria.nome,
      })),
    },
    quickActions: [
      {
        label: 'Ver Meus Objetos no Perfil',
        actionType: 'navigate',
        payload: { url: '/perfil#meus-itens' },
      },
      {
        label: 'Cadastrar Novo Item',
        actionType: 'navigate',
        payload: { url: '/itens/novo' },
      },
    ],
  };
}

/**
 * Pausa ou reativa um anúncio de propriedade exclusiva do usuário
 */
export async function handleAlternarDisponibilidadeItem(
  userId: number,
  rawParams: unknown
): Promise<AssistantResponse> {
  const parseResult = alternarDisponibilidadeItemSchema.safeParse(rawParams);
  if (!parseResult.success) {
    return {
      reply: 'Não foi possível identificar o item a ser alterado. Por favor, especifique o objeto.',
      intentDetected: 'pausar_item',
    };
  }

  const { id_item, disponivel } = parseResult.data;

  // Busca o item no banco e garante que pertence ao usuário
  const item = await prisma.item.findUnique({
    where: { id_item },
    select: { id_item: true, nome: true, id_usuario: true, disponivel: true },
  });

  if (!item) {
    return {
      reply: 'O objeto solicitado não foi encontrado no sistema.',
      intentDetected: 'pausar_item',
    };
  }

  if (item.id_usuario !== userId) {
    return {
      reply: 'Você só pode pausar ou reativar itens que pertencem à sua própria conta.',
      intentDetected: 'pausar_item',
    };
  }

  // Atualiza disponibilidade no banco
  const itemAtualizado = await prisma.item.update({
    where: { id_item },
    data: { disponivel },
    select: { id_item: true, nome: true, disponivel: true },
  });

  const statusTexto = itemAtualizado.disponivel ? 'reativado e está disponível' : 'pausado';

  return {
    reply: `Pronto! O anúncio do item **"${itemAtualizado.nome}"** foi ${statusTexto} com sucesso.`,
    intentDetected: disponivel ? 'reativar_item' : 'pausar_item',
    data: itemAtualizado,
    quickActions: [
      {
        label: 'Ver no Perfil',
        actionType: 'navigate',
        payload: { url: `/itens/${itemAtualizado.id_item}` },
      },
    ],
  };
}

/**
 * Consulta a reputação do usuário autenticado (nota média, contagem e depoimentos)
 */
export async function handleConsultarReputacao(userId: number): Promise<AssistantResponse> {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { id_avaliado: userId },
    include: { avaliador: { select: { nome: true } } },
    orderBy: { data_cadastro: 'desc' },
  });

  const total = avaliacoes.length;
  if (total === 0) {
    return {
      reply: 'Você ainda não recebeu avaliações de trocas. Conclua trocas com sucesso para construir sua reputação na comunidade!',
      intentDetected: 'consultar_reputacao',
      data: { total: 0, media: null },
      quickActions: [
        {
          label: 'Ver Meu Perfil',
          actionType: 'navigate',
          payload: { url: '/perfil' },
        },
      ],
    };
  }

  const media = Number(
    (avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / total).toFixed(1)
  );

  let reply = `Sua reputação atual é de **${media} ★** com base em **${total}** avaliação(ões) recebida(s).`;

  const ultimaComComentario = avaliacoes.find((a) => a.comentario);
  if (ultimaComComentario) {
    reply += `\n\nÚltimo comentário recebido de **${ultimaComComentario.avaliador.nome}**: "${ultimaComComentario.comentario}"`;
  }

  return {
    reply,
    intentDetected: 'consultar_reputacao',
    data: { total, media },
    quickActions: [
      {
        label: 'Ver Depoimentos no Perfil',
        actionType: 'navigate',
        payload: { url: '/perfil#avaliacoes' },
      },
    ],
  };
}

/**
 * Converte filtros interpretados da conversa em navegação direta para o Feed (/discover)
 */
export async function handleBuscarItens(rawParams: unknown): Promise<AssistantResponse> {
  const parseResult = buscarItensSchema.safeParse(rawParams || {});
  const params: BuscarItensParams = parseResult.success ? parseResult.data : {};

  const queryParams = new URLSearchParams();

  if (params.termo) {
    queryParams.set('q', params.termo);
  }
  if (params.categoria) {
    queryParams.set('cat', params.categoria);
  }
  if (params.raioKm) {
    queryParams.set('raio', String(params.raioKm));
    queryParams.set('ordem', 'proximidade');
  } else if (params.ordem) {
    queryParams.set('ordem', params.ordem);
  }

  const queryString = queryParams.toString();
  const urlDestino = queryString ? `/discover?${queryString}` : '/discover';

  let reply = 'Preparei uma busca no Feed com os filtros que você solicitou.';
  if (params.categoria) {
    reply += `\n• Categoria: **${params.categoria}**`;
  }
  if (params.raioKm) {
    reply += `\n• Raio de distância: **Até ${params.raioKm} km** (ordenado por proximidade)`;
  }
  if (params.termo) {
    reply += `\n• Termo de busca: **"${params.termo}"**`;
  }

  return {
    reply,
    intentDetected: 'buscar_itens',
    data: { url: urlDestino, params },
    quickActions: [
      {
        label: 'Abrir Resultados no Feed',
        actionType: 'navigate',
        payload: { url: urlDestino },
      },
    ],
  };
}
