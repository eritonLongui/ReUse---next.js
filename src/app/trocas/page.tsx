import { redirect } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ArrowRightLeft, Clock, Check, X, ShieldAlert } from 'lucide-react';
import styles from './trocas.module.css';
import TradeActions from './TradeActions';

export default async function TrocasPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [recebidas, enviadas] = await Promise.all([
    prisma.troca.findMany({
      where: { id_usuario_destinatario: user.id_usuario },
      include: {
        proponente: true,
        itens: {
          include: { item: true },
        },
      },
      orderBy: { data_solicitacao: 'desc' },
    }),
    prisma.troca.findMany({
      where: { id_usuario_proponente: user.id_usuario },
      include: {
        destinatario: true,
        itens: {
          include: { item: true },
        },
      },
      orderBy: { data_solicitacao: 'desc' },
    }),
  ]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Minhas Trocas</h1>
        <p className={styles.subtitle}>Gerencie suas propostas recebidas e enviadas para membros da comunidade</p>
      </div>

      {/* Propostas Recebidas */}
      <h2 className={styles.sectionTitle}>
        <ArrowRightLeft size={20} /> Propostas Recebidas ({recebidas.length})
      </h2>
      {recebidas.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic', marginBottom: '2rem' }}>
          Você ainda não recebeu propostas de troca para os seus itens.
        </p>
      ) : (
        recebidas.map((t) => {
          const ofertado = t.itens.find((i) => i.papel_item === 'OFERTADO')?.item;
          const desejado = t.itens.find((i) => i.papel_item === 'DESEJADO')?.item;
          return (
            <div key={t.id_troca} className={styles.tradeCard}>
              <div className={styles.tradeHeader}>
                <div>
                  <strong>Proposta de {t.proponente.nome}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(t.data_solicitacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${styles['status' + t.status]}`}>
                  {t.status}
                </span>
              </div>

              <div className={styles.tradeItems}>
                <div className={styles.itemBox}>
                  {ofertado?.foto_item && (
                    <Image src={ofertado.foto_item} alt={ofertado.nome} width={60} height={60} className={styles.itemThumb} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#FF9F1C', fontWeight: 700 }}>ELE(A) OFERECE</div>
                    <strong>{ofertado?.nome}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ofertado?.estado_conservacao}</div>
                  </div>
                </div>

                <div style={{ color: '#94a3b8', fontWeight: 800 }}>⇄</div>

                <div className={styles.itemBox}>
                  {desejado?.foto_item && (
                    <Image src={desejado.foto_item} alt={desejado.nome} width={60} height={60} className={styles.itemThumb} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#1F3C88', fontWeight: 700 }}>PELO SEU ITEM</div>
                    <strong>{desejado?.nome}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{desejado?.estado_conservacao}</div>
                  </div>
                </div>
              </div>

              {t.mensagem && <div className={styles.message}>&ldquo;{t.mensagem}&rdquo;</div>}

              {t.status === 'PENDENTE' && (
                <TradeActions tradeId={t.id_troca} />
              )}
            </div>
          );
        })
      )}

      {/* Propostas Enviadas */}
      <h2 className={styles.sectionTitle}>
        <Clock size={20} /> Propostas Enviadas ({enviadas.length})
      </h2>
      {enviadas.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          Você ainda não enviou propostas de troca para outros membros.
        </p>
      ) : (
        enviadas.map((t) => {
          const ofertado = t.itens.find((i) => i.papel_item === 'OFERTADO')?.item;
          const desejado = t.itens.find((i) => i.papel_item === 'DESEJADO')?.item;
          return (
            <div key={t.id_troca} className={styles.tradeCard}>
              <div className={styles.tradeHeader}>
                <div>
                  <strong>Para {t.destinatario.nome}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(t.data_solicitacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${styles['status' + t.status]}`}>
                  {t.status}
                </span>
              </div>

              <div className={styles.tradeItems}>
                <div className={styles.itemBox}>
                  {ofertado?.foto_item && (
                    <Image src={ofertado.foto_item} alt={ofertado.nome} width={60} height={60} className={styles.itemThumb} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#FF9F1C', fontWeight: 700 }}>VOCÊ OFERECEU</div>
                    <strong>{ofertado?.nome}</strong>
                  </div>
                </div>

                <div style={{ color: '#94a3b8', fontWeight: 800 }}>⇄</div>

                <div className={styles.itemBox}>
                  {desejado?.foto_item && (
                    <Image src={desejado.foto_item} alt={desejado.nome} width={60} height={60} className={styles.itemThumb} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#1F3C88', fontWeight: 700 }}>PELO ITEM DELE(A)</div>
                    <strong>{desejado?.nome}</strong>
                  </div>
                </div>
              </div>

              {t.mensagem && <div className={styles.message}>&ldquo;{t.mensagem}&rdquo;</div>}
            </div>
          );
        })
      )}
    </div>
  );
}
