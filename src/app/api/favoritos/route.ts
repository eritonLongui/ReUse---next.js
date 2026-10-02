import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const favoriteSchema = z.object({
  id_item: z.number().int().positive(),
});

// GET: Retorna os IDs dos itens favoritados pelo usuário logado
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const favoritos = await prisma.favorito.findMany({
      where: { id_usuario: user.id_usuario },
      select: { id_item: true },
    });

    const itemIds = favoritos.map((f) => f.id_item);
    return NextResponse.json({ favoritos: itemIds });
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar favoritos' },
      { status: 500 }
    );
  }
}

// POST: Adiciona um item aos favoritos
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id_item } = favoriteSchema.parse(body);

    // Verifica se o item existe
    const item = await prisma.item.findUnique({
      where: { id_item },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    // Cria o favorito garantindo unicidade
    const favorito = await prisma.favorito.upsert({
      where: {
        id_usuario_id_item: {
          id_usuario: user.id_usuario,
          id_item,
        },
      },
      update: {},
      create: {
        id_usuario: user.id_usuario,
        id_item,
      },
    });

    return NextResponse.json({ success: true, favorito }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao adicionar favorito:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar solicitação' },
      { status: 400 }
    );
  }
}

// DELETE: Remove um item dos favoritos
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id_item } = favoriteSchema.parse(body);

    await prisma.favorito.deleteMany({
      where: {
        id_usuario: user.id_usuario,
        id_item,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover favorito:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar solicitação' },
      { status: 400 }
    );
  }
}
