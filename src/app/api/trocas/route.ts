import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { trocaSchema } from '@/lib/validations';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = trocaSchema.parse(body);

    const itemDesejado = await prisma.item.findUnique({
      where: { id_item: validated.id_item_desejado },
    });

    if (!itemDesejado || !itemDesejado.disponivel) {
      return NextResponse.json({ error: 'O item desejado não está mais disponível' }, { status: 400 });
    }

    if (itemDesejado.id_usuario === user.id_usuario) {
      return NextResponse.json({ error: 'Você não pode propor uma troca para seu próprio item' }, { status: 400 });
    }

    // Criar troca e itens de troca em transação relacional
    const troca = await prisma.$transaction(async (tx) => {
      const novaTroca = await tx.troca.create({
        data: {
          id_usuario_proponente: user.id_usuario,
          id_usuario_destinatario: itemDesejado.id_usuario,
          mensagem: validated.mensagem || null,
          status: 'PENDENTE',
        },
      });

      // Vínculo do item ofertado
      await tx.itemTroca.create({
        data: {
          id_troca: novaTroca.id_troca,
          id_item: validated.id_item_ofertado,
          papel_item: 'OFERTADO',
        },
      });

      // Vínculo do item desejado
      await tx.itemTroca.create({
        data: {
          id_troca: novaTroca.id_troca,
          id_item: validated.id_item_desejado,
          papel_item: 'DESEJADO',
        },
      });

      return novaTroca;
    });

    return NextResponse.json(troca);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao criar proposta de troca' }, { status: 400 });
  }
}
