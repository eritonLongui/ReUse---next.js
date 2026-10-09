import { AssistantResponse, AssistantIntent } from './types';

/**
 * Catálogo estruturado de respostas de orientação da plataforma ReUse!
 */
export const FAQ_RESPONSES: Record<
  string,
  {
    reply: string;
    quickActions?: AssistantResponse['quickActions'];
  }
> = {
  ajuda_cadastrar_item: {
    reply:
      'Para anunciar um objeto no ReUse:\n\n' +
      '1. Acesse o menu **"Anunciar Item"** ou o botão superior.\n' +
      '2. Preencha o título, selecione a categoria e o estado de conservação (Novo, Como Novo, Bom, Marcas de Uso).\n' +
      '3. Descreva bem o objeto e informe a URL de uma foto do produto.\n' +
      '4. Clique em **"Publicar Objeto"**. Ele ficará visível para outros membros da comunidade local!',
    quickActions: [
      {
        label: 'Anunciar Objeto Agora',
        actionType: 'navigate',
        payload: { url: '/itens/novo' },
      },
    ],
  },

  ajuda_fazer_troca: {
    reply:
      'Como funciona o fluxo de trocas:\n\n' +
      '1. **Encontrar item**: Explore o Feed de Trocas e escolha um objeto desejado.\n' +
      '2. **Propor permuta**: Na página do anúncio, escolha um dos seus itens cadastrados para oferecer em troca e envie uma mensagem opcional.\n' +
      '3. **Aprovação**: O dono do item receberá sua notificação na aba **Minhas Trocas** e poderá aceitar ou recusar.\n' +
      '4. **Conclusão**: Ao aceitar, ambos os itens são marcados como trocados e a negociação é finalizada.',
    quickActions: [
      {
        label: 'Explorar Feed de Trocas',
        actionType: 'navigate',
        payload: { url: '/discover' },
      },
      {
        label: 'Ver Minhas Trocas',
        actionType: 'navigate',
        payload: { url: '/trocas' },
      },
    ],
  },

  ajuda_proximidade: {
    reply:
      'O ReUse calcula a distância geográfica aproximada entre os participantes:\n\n' +
      '• Ao cadastrar seu endereço com CEP, calculamos a localização aproximada.\n' +
      '• No **Feed de Trocas (/discover)**, você pode filtrar por raio (até 5 km, 10 km, 25 km ou 50 km) e ordenar pelos itens **Mais Próximos**.\n' +
      '• Suas coordenadas exatas nunca são reveladas a outros usuários por questões de segurança e privacidade.',
    quickActions: [
      {
        label: 'Ver Itens Próximos',
        actionType: 'navigate',
        payload: { url: '/discover?ordem=proximidade' },
      },
      {
        label: 'Meu Endereço no Perfil',
        actionType: 'navigate',
        payload: { url: '/perfil' },
      },
    ],
  },

  ajuda_avaliar: {
    reply:
      'A reputação da comunidade é construída através de avaliações mútuas:\n\n' +
      '• Quando uma troca é **Aceita**, um botão **"Avaliar Troca"** fica disponível na página **Minhas Trocas**.\n' +
      '• Você pode atribuir uma nota de 1 a 5 estrelas e deixar um depoimento sobre a pontualidade e o estado do objeto.\n' +
      '• As avaliações recebidas compõem a sua nota média no perfil.',
    quickActions: [
      {
        label: 'Histórico de Trocas',
        actionType: 'navigate',
        payload: { url: '/trocas' },
      },
      {
        label: 'Minha Reputação',
        actionType: 'navigate',
        payload: { url: '/perfil#avaliacoes' },
      },
    ],
  },

  ajuda_geral: {
    reply:
      'Olá! Sou o assistente virtual do **ReUse!** ♻️\n\n' +
      'Posso ajudar você a:\n' +
      '• Consultar suas **propostas de troca pendentes**\n' +
      '• Ver seus **itens anunciados** ou pausar um anúncio\n' +
      '• Consultar sua **reputação e avaliações**\n' +
      '• Buscar objetos por categoria ou proximidade\n' +
      '• Tirar dúvidas sobre o funcionamento da plataforma',
    quickActions: [
      {
        label: 'Propostas Pendentes',
        actionType: 'send_message',
        payload: { messageText: 'Quais trocas pendentes eu tenho?' },
      },
      {
        label: 'Meus Itens Cadastrados',
        actionType: 'send_message',
        payload: { messageText: 'Ver meus itens cadastrados' },
      },
      {
        label: 'Como fazer uma troca?',
        actionType: 'send_message',
        payload: { messageText: 'Como funciona uma troca?' },
      },
    ],
  },
};

/**
 * Retorna resposta de FAQ ou ajuda estruturada
 */
export function getFaqResponse(intent: AssistantIntent | string): AssistantResponse | null {
  const faq = FAQ_RESPONSES[intent];
  if (!faq) return null;

  return {
    reply: faq.reply,
    intentDetected: intent,
    quickActions: faq.quickActions,
  };
}
