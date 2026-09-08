import { z } from 'zod';

export const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve conter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve conter pelo menos 6 caracteres'),
  cep: z.string().min(8, 'CEP inválido'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  bairro: z.string().optional(),
  cidade: z.string().min(1, 'Cidade é obrigatório'),
  uf: z.string().length(2, 'UF deve conter 2 letras'),
  foto_perfil: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe sua senha'),
});

export const itemSchema = z.object({
  nome: z.string().min(2, 'Título do item deve ter pelo menos 2 letras'),
  descricao: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  estado_conservacao: z.enum(['Novo', 'Como Novo', 'Bom', 'Marcas de Uso']),
  id_categoria: z.coerce.number().positive('Selecione uma categoria'),
  foto_item: z.string().optional(),
});

export const trocaSchema = z.object({
  id_item_desejado: z.coerce.number().positive(),
  id_item_ofertado: z.coerce.number().positive(),
  mensagem: z.string().optional(),
});
