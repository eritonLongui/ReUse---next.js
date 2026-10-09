import { z } from 'zod';

/**
 * Catálogo de intents de alta prioridade suportadas pelo assistente
 */
export const ASSISTANT_INTENTS = [
  'consultar_trocas_pendentes',
  'consultar_meus_itens',
  'pausar_item',
  'reativar_item',
  'consultar_reputacao',
  'buscar_itens',
  'ajuda_cadastrar_item',
  'ajuda_fazer_troca',
  'ajuda_proximidade',
  'ajuda_avaliar',
  'ajuda_geral',
] as const;

export type AssistantIntent = (typeof ASSISTANT_INTENTS)[number];

/**
 * Esquema de validação para a mensagem vinda do usuário no chat
 */
export const assistantMessageInputSchema = z.object({
  message: z.string().trim().min(1, 'A mensagem não pode estar vazia').max(1000, 'Mensagem muito longa'),
  sessionId: z.string().optional(),
});

export type AssistantMessageInput = z.infer<typeof assistantMessageInputSchema>;

/**
 * Esquemas de parâmetros para cada ação estruturada do backend
 */
export const alternarDisponibilidadeItemSchema = z.object({
  id_item: z.number().int().positive('ID do item deve ser um número positivo'),
  disponivel: z.boolean(),
});

export const buscarItensSchema = z.object({
  termo: z.string().optional(),
  categoria: z.string().optional(),
  raioKm: z.number().positive().optional(),
  ordem: z.enum(['recentes', 'proximidade']).optional(),
});

export type AlternarDisponibilidadeItemParams = z.infer<typeof alternarDisponibilidadeItemSchema>;
export type BuscarItensParams = z.infer<typeof buscarItensSchema>;

/**
 * Tipos de ação rápida / botão sugerido que o assistente pode retornar na UI
 */
export interface AssistantQuickAction {
  label: string;
  actionType: 'navigate' | 'send_message' | 'execute_action';
  payload: {
    url?: string;
    messageText?: string;
    actionName?: AssistantIntent;
    params?: Record<string, unknown>;
  };
}

/**
 * Estrutura de resposta padronizada do assistente para o frontend
 */
export interface AssistantResponse {
  sessionId?: string;
  reply: string;
  intentDetected?: AssistantIntent | string;
  data?: unknown;
  quickActions?: AssistantQuickAction[];
  requiresAuth?: boolean;
}
