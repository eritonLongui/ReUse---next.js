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

// Ações e consultas reais da plataforma que têm implementação no backend (actions.ts)
const IMPLEMENTED_BACKEND_ACTIONS = [
  'consultar_trocas_pendentes',
  'consultar_meus_itens',
  'pausar_item',
  'reativar_item',
  'consultar_reputacao',
  'buscar_itens',
] as const;

function isImplementedBackendAction(intentName: string): boolean {
  return (IMPLEMENTED_BACKEND_ACTIONS as readonly string[]).includes(intentName);
}

/**
 * Heurística local de fallback e detecção de ações da plataforma
 */
function detectLocalIntent(text: string): { intent: string; params: Record<string, unknown> } {
  const normalized = text.toLowerCase();

  // 1. Ações e consultas de dados da conta (alta prioridade local)
  if (
    normalized.includes('troca') &&
    (normalized.includes('pendente') ||
      normalized.includes('recebi') ||
      normalized.includes('enviad') ||
      normalized.includes('minhas troca') ||
      normalized.includes('proposta'))
  ) {
    return { intent: 'consultar_trocas_pendentes', params: {} };
  }

  if (
    normalized.includes('meus item') ||
    normalized.includes('meus objeto') ||
    normalized.includes('itens cadastrado') ||
    normalized.includes('meus anuncio') ||
    normalized.includes('anúncios cadastrados')
  ) {
    return { intent: 'consultar_meus_itens', params: {} };
  }

  if (
    normalized.includes('pausar') &&
    (normalized.includes('item') || normalized.includes('anúncio') || normalized.includes('objeto'))
  ) {
    return { intent: 'pausar_item', params: {} };
  }

  if (
    normalized.includes('reativar') &&
    (normalized.includes('item') || normalized.includes('anúncio') || normalized.includes('objeto'))
  ) {
    return { intent: 'reativar_item', params: {} };
  }

  if (
    normalized.includes('reputa') ||
    normalized.includes('avalia') ||
    normalized.includes('minha nota') ||
    normalized.includes('minhas estrela')
  ) {
    return { intent: 'consultar_reputacao', params: {} };
  }

  if (
    normalized.startsWith('buscar') ||
    normalized.startsWith('procurar') ||
    normalized.startsWith('encontrar')
  ) {
    return { intent: 'buscar_itens', params: { termo: text.replace(/^(buscar|procurar|encontrar)\s*/i, '').trim() } };
  }

  // 2. Dúvidas informativas / orientações (podem ser atendidas pelo IBM Orchestrate ou FAQ local)
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

    let intent = '';
    let entities: Record<string, unknown> = {};
    let activeSessionId: string | undefined = sessionId;
    let orchestrateReply: string | undefined = undefined;

    // Identifica intenção local da plataforma a partir da mensagem
    const local = detectLocalIntent(message);

    // Prioridade de Roteamento:
    // 1. Se a mensagem do usuário for uma ação/consulta de dados com implementação no backend,
    //    executamos a função local segura com os dados reais do usuário (actions.ts).
    if (isImplementedBackendAction(local.intent)) {
      intent = local.intent;
      entities = local.params;
    } else {
      // 2. Para dúvidas gerais, orientações ou conversas livres:
      // Tentar obter resposta conversacional do agente IBM watsonx Orchestrate via A2A
      const orchestrateResult = await sendWatsonxAssistantMessage(message, sessionId);

      intent = orchestrateResult?.intent || '';
      entities = orchestrateResult?.entities || {};
      orchestrateReply = orchestrateResult?.replyText;
      if (orchestrateResult?.sessionId) {
        activeSessionId = orchestrateResult.sessionId;
      }

      if (orchestrateReply && orchestrateReply.trim().length > 0) {
        // Primeira opção para dúvidas e conversa geral: o agente IBM watsonx Orchestrate
        intent = 'resposta_agente_orchestrate';
      } else {
        // Fallback local caso o agente da IBM não responda ou não esteja configurado
        intent = local.intent;
        entities = local.params;
      }
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
        // Se a intent for resposta_agente_orchestrate ou se houver texto do Orchestrate
        if (orchestrateReply) {
          response = {
            reply: orchestrateReply,
            intentDetected: intent,
          };
        } else {
          // Verifica se é uma intenção de FAQ / Ajuda local
          const faq = getFaqResponse(intent);
          if (faq) {
            response = faq;
          } else {
            const fallback = getFaqResponse('ajuda_geral');
            response = fallback || {
              reply: 'Desculpe, não entendi completamente. Posso ajudar com suas trocas pendentes, seus itens cadastrados ou dúvidas sobre a plataforma.',
            };
          }
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
