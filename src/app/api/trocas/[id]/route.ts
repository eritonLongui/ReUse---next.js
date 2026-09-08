import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const idTroca = parseInt(id, 10);
  if (isNaN(idTroca)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const { status } = await req.json();
    if (!['ACEITA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const troca = await prisma.troca.findUnique({
      where: { id_troca: idTroca },
      include: { itens: true },
    });

    if (!troca) {
      return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
    }

    // Apenas destinatário pode aceitar/recusar; proponente pode cancelar
    if (status === 'ACEITA' || status === 'RECUSADA') {
      if (troca.id_usuario_destinatario !== user.id_usuario) {
        return NextResponse.json({ error: 'Apenas quem recebeu a proposta pode responder' }, { status: 403 });
      }
    }

    if (status === 'ACEITA') {
      // Quando aceita, marca itens como indisponíveis
      await prisma.$transaction(async (tx) => {
        await tx.troca.update({
          where: { id_troca: idTroca },
          data: { status, data_resposta: new Date() },
        });

        for (const it of troca.itens) {
          await tx.item.update({
            where: { id_item: it.id_item },
            data: { disponivel: false },
          });
        }
      });
    } else {
      await prisma.troca.update({
        where: { id_troca: idTroca },
        data: { status, data_resposta: new Date() },
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar troca' }, { status: 400 });
  }
}
