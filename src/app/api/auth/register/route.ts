import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { hashPassword, setSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const existingUser = await prisma.usuario.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário cadastrado com este e-mail' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(validated.senha);

    const newUser = await prisma.usuario.create({
      data: {
        nome: validated.nome,
        email: validated.email,
        senha: hashedPassword,
        foto_perfil: validated.foto_perfil || null,
        endereco: {
          create: {
            cep: validated.cep,
            logradouro: validated.logradouro,
            bairro: validated.bairro || null,
            cidade: validated.cidade,
            uf: validated.uf,
          },
        },
      },
    });

    await setSession(newUser.id_usuario);

    return NextResponse.json({ success: true, userId: newUser.id_usuario });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: err?.message || 'Falha ao processar cadastro' },
      { status: 400 }
    );
  }
}
