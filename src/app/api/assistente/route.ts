import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assistantMessageInputSchema, AssistantResponse } from '@/lib/assistant/types';
import {
  handleConsultarTrocasPendentes,
  handleConsultarMeusItens,
  handleAlternarDisponibilidadeItem,
  handleConsultarReputacao,
  handleBuscarItens,
} from '@/lib/assistant/actions';
import { getFaqResponse } from '@/lib/assistant/faq';
import { sendWatsonxAssistantMessage } from '@/lib/assistant/watsonClient';

/**
 * Heurística local de fallback quando o watsonx não estiver configurado ou offline
 */
function detectLocalIntent(text: string): { intent: string; params: Record<string, unknown> } {
  const normalized = text.toLowerCase();

  if (normalized.includes('troca') && (normalized.includes('pendente') || normalized.includes('recebi') || normalized.includes('enviad'))) {
    return { intent: 'consultar_trocas_pendentes', params: {} };
  }

  if (normalized.includes('meus item') || normalized.includes('meus objeto') || normalized.includes('itens cadastrado') || normalized.includes('meus anuncio')) {
    return { intent: 'consultar_meus_itens', params: {} };
  }

  if (normalized.includes('reputa') || normalized.includes('avalia') || normalized.includes('minha nota') || normalized.includes('estrela')) {
    return { intent: 'consultar_reputacao', params: {} };
  }

  if (normalized.includes('como cadastrar') || normalized.includes('como anunciar') || normalized.includes('publicar item')) {
    return { intent: 'ajuda_cadastrar_item', params: {} };
  }

  if (normalized.includes('como funciona a troca') || normalized.includes('como trocar') || normalized.includes('como fazer uma troca')) {
    return { intent: 'ajuda_fazer_troca', params: {} };
  }

  if (normalized.includes('proximidade') || normalized.includes('distancia') || normalized.includes('raio') || normalized.includes('perto')) {
    return { intent: 'ajuda_proximidade', params: {} };
  }

  if (normalized.includes('como avaliar')) {
    return { intent: 'ajuda_avaliar', params: {} };
  }

  if (normalized.includes('buscar') || normalized.includes('procurar') || normalized.includes('encontrar')) {
    return { intent: 'buscar_itens', params: { termo: text.replace(/buscar|procurar|encontrar/gi, '').trim() } };
  }

  return { intent: 'ajuda_geral', params: {} };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = assistantMessageInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { reply: 'Mensagem inválida. Por favor, envie um texto válido.' },
        { status: 400 }
      );
    }

    const { message, sessionId } = parsed.data;
    const currentUser = await getCurrentUser();

    // 1. Tentar obter intenção e entidades do IBM watsonx Assistant
    const watsonResult = await sendWatsonxAssistantMessage(message, sessionId);

    let intent = watsonResult?.intent;
    let entities = watsonResult?.entities || {};
    let watsonReply = watsonResult?.replyText;
    const activeSessionId = watsonResult?.sessionId || sessionId;

    // Se o watsonx não retornou uma intent mapeada ou está em fallback, utiliza detector local
    if (!intent) {
      const local = detectLocalIntent(message);
      intent = local.intent;
      entities = local.params;
    }

    // 2. Despacho seguro de ações conforme a intenção identificada
    let response: AssistantResponse;

    switch (intent) {
      case 'consultar_trocas_pendentes': {
        if (!currentUser) {
          response = {
            reply: 'Para consultar suas propostas de troca pendentes, você precisa estar conectado à sua conta.',
            requiresAuth: true,
            quickActions: [{ label: 'Entrar na Conta', actionType: 'navigate', payload: { url: '/login' } }],
          };
        } else {
          response = await handleConsultarTrocasPendentes(currentUser.id_usuario);
        }
        break;
      }

      case 'consultar_meus_itens': {
        if (!currentUser) {
          response = {
            reply: 'Para visualizar os seus objetos cadastrados, por favor faça login na plataforma.',
            requiresAuth: true,
            quickActions: [{ label: 'Entrar na Conta', actionType: 'navigate', payload: { url: '/login' } }],
          };
        } else {
          response = await handleConsultarMeusItens(currentUser.id_usuario);
        }
        break;
      }

      case 'pausar_item':
      case 'reativar_item': {
        if (!currentUser) {
          response = {
            reply: 'Você precisa estar logado para alterar a disponibilidade de seus itens.',
            requiresAuth: true,
            quickActions: [{ label: 'Entrar na Conta', actionType: 'navigate', payload: { url: '/login' } }],
          };
        } else {
          response = await handleAlternarDisponibilidadeItem(currentUser.id_usuario, {
            id_item: Number(entities.id_item),
            disponivel: intent === 'reativar_item',
          });
        }
        break;
      }

      case 'consultar_reputacao': {
        if (!currentUser) {
          response = {
            reply: 'Para consultar sua reputação e avaliações recebidas, você precisa estar conectado à sua conta.',
            requiresAuth: true,
            quickActions: [{ label: 'Entrar na Conta', actionType: 'navigate', payload: { url: '/login' } }],
          };
        } else {
          response = await handleConsultarReputacao(currentUser.id_usuario);
        }
        break;
      }

      case 'buscar_itens': {
        response = await handleBuscarItens(entities);
        break;
      }

      default: {
        // Verifica se é uma intenção de FAQ / Ajuda
        const faq = getFaqResponse(intent);
        if (faq) {
          response = faq;
        } else if (watsonReply) {
          response = {
            reply: watsonReply,
            intentDetected: intent,
          };
        } else {
          const fallback = getFaqResponse('ajuda_geral');
          response = fallback || {
            reply: 'Desculpe, não entendi completamente. Posso ajudar com suas trocas pendentes, seus itens cadastrados ou dúvidas sobre a plataforma.',
          };
        }
        break;
      }
    }

    response.sessionId = activeSessionId;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro na rota /api/assistente:', error);
    return NextResponse.json(
      {
        reply: 'Ocorreu um erro interno ao processar sua solicitação. Por favor, tente novamente.',
      },
      { status: 500 }
    );
  }
}
