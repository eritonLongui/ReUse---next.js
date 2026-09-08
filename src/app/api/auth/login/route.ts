import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { verifyPassword, setSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, senha } = loginSchema.parse(body);

    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(senha, user.senha);
    if (!isValid) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    await setSession(user.id_usuario);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Falha ao processar login' },
      { status: 400 }
    );
  }
}
