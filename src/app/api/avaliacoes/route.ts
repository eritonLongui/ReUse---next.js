import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const avaliacaoSchema = z.object({
  id_troca: z.number().int().positive('ID da troca inválido'),
  id_avaliado: z.number().int().positive('ID do usuário avaliado inválido'),
  nota: z.number().int().min(1, 'A nota mínima é 1').max(5, 'A nota máxima é 5'),
  comentario: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const result = avaliacaoSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues.map((e: z.ZodIssue) => e.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { id_troca, id_avaliado, nota, comentario } = result.data;
    const id_avaliador = user.id_usuario;

    if (id_avaliador === id_avaliado) {
      return NextResponse.json({ error: 'Você não pode avaliar a si mesmo' }, { status: 400 });
    }

    // Verificar se a troca existe e está ACEITA
    const troca = await prisma.troca.findUnique({
      where: { id_troca },
    });

    if (!troca) {
      return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
    }

    if (troca.status !== 'ACEITA') {
      return NextResponse.json({ error: 'Só é possível avaliar trocas aceitas/concluídas' }, { status: 400 });
    }

    // Verificar se o usuário faz parte da troca (proponente ou destinatário)
    if (troca.id_usuario_proponente !== id_avaliador && troca.id_usuario_destinatario !== id_avaliador) {
      return NextResponse.json({ error: 'Você não é participante desta troca' }, { status: 403 });
    }

    // Verificar se o avaliado também faz parte da troca
    if (troca.id_usuario_proponente !== id_avaliado && troca.id_usuario_destinatario !== id_avaliado) {
      return NextResponse.json({ error: 'O usuário avaliado não faz parte desta troca' }, { status: 400 });
    }

    // Verificar se já existe avaliação deste avaliador para esta troca
    const existente = await prisma.avaliacao.findFirst({
      where: {
        id_troca,
        id_avaliador,
      },
    });

    if (existente) {
      return NextResponse.json({ error: 'Você já avaliou esta troca' }, { status: 400 });
    }

    // Criar avaliação
    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        id_troca,
        id_avaliador,
        id_avaliado,
        nota,
        comentario: comentario?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, avaliacao: novaAvaliacao }, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar avaliação:', error);
    return NextResponse.json({ error: 'Erro interno ao processar avaliação' }, { status: 500 });
  }
}
