import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import CreateItemClient from './CreateItemClient';

export default async function NovoItemPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const categories = await prisma.categoria.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  });

  return <CreateItemClient categories={categories} />;
}
