import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MapPin, ArrowRightLeft, ShieldCheck, User } from 'lucide-react';
import styles from './itemDetail.module.css';
import ProposalForm from './ProposalForm';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) notFound();

  const [item, currentUser] = await Promise.all([
    prisma.item.findUnique({
      where: { id_item: itemId },
      include: {
        categoria: true,
        usuario: {
          include: { endereco: true },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!item) notFound();

  // Itens do usuário atual para oferecer em troca
  let myItems: any[] = [];
  if (currentUser) {
    myItems = await prisma.item.findMany({
      where: {
        id_usuario: currentUser.id_usuario,
        disponivel: true,
        id_item: { not: item.id_item },
      },
    });
  }

  const isOwner = currentUser?.id_usuario === item.id_usuario;

  return (
    <div className={styles.detailWrapper}>
      <div className={styles.grid}>
        <div className={styles.imageArea}>
          <Image
            src={item.foto_item || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&auto=format&fit=crop&q=80'}
            alt={item.nome}
            fill
            className={styles.image}
            priority
          />
        </div>

        <div className={styles.infoArea}>
          <span className={styles.catBadge}>{item.categoria.nome}</span>
          <h1 className={styles.title}>{item.nome}</h1>
          <div className={styles.condition}>
            <ShieldCheck size={16} color="#10a378" />
            <span>Estado: <strong>{item.estado_conservacao}</strong></span>
          </div>

          <p className={styles.desc}>{item.descricao}</p>

          <div className={styles.ownerCard}>
            <div className={styles.ownerAvatar}>
              {item.usuario.nome.slice(0, 1).toUpperCase()}
            </div>
            <div className={styles.ownerDetails}>
              <h4>{item.usuario.nome}</h4>
              {item.usuario.endereco && (
                <div className={styles.ownerLocation}>
                  <MapPin size={14} />
                  <span>
                    {item.usuario.endereco.bairro ? `${item.usuario.endereco.bairro}, ` : ''}
                    {item.usuario.endereco.cidade} - {item.usuario.endereco.uf}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.proposalBox}>
            {isOwner ? (
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontWeight: 600, color: '#1F3C88' }}>Este item pertence a você!</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Acompanhe as propostas recebidas no seu painel.
                </p>
              </div>
            ) : !currentUser ? (
              <div style={{ textAlign: 'center', padding: '1.25rem', background: '#FFF4E5', borderRadius: '8px' }}>
                <h4 style={{ color: '#FF9F1C', fontWeight: 700, marginBottom: '0.5rem' }}>Deseja trocar por este item?</h4>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                  Entre ou crie uma conta para propor uma troca ao dono.
                </p>
                <Link href="/login" className={styles.btnProposta}>
                  Entrar para Negociar
                </Link>
              </div>
            ) : myItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.25rem', background: '#f1f5f9', borderRadius: '8px' }}>
                <p style={{ fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                  Você ainda não possui itens disponíveis para oferecer em troca.
                </p>
                <Link href="/itens/novo" className={styles.btnProposta}>
                  Cadastrar um item para ofertar
                </Link>
              </div>
            ) : (
              <ProposalForm
                itemDesejadoId={item.id_item}
                myItems={myItems}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
