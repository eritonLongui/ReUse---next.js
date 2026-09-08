import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { itemSchema } from '@/lib/validations';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = itemSchema.parse(body);

    const item = await prisma.item.create({
      data: {
        nome: validated.nome,
        descricao: validated.descricao,
        estado_conservacao: validated.estado_conservacao,
        foto_item: validated.foto_item || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&auto=format&fit=crop&q=80',
        id_usuario: user.id_usuario,
        id_categoria: validated.id_categoria,
      },
    });

    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao cadastrar item' }, { status: 400 });
  }
}
