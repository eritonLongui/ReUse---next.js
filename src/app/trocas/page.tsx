import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  Send,
  Inbox,
  Calendar,
} from 'lucide-react';
import styles from './trocas.module.css';
import TradeActions from './TradeActions';
import TradeReviewAction from './TradeReviewAction';

export default async function TrocasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { status: statusFilter } = await searchParams;

  // Busca todas as trocas (recebidas e enviadas) com seus respectivos itens, usuários e avaliações
  const [recebidas, enviadas] = await Promise.all([
    prisma.troca.findMany({
      where: { id_usuario_destinatario: user.id_usuario },
      include: {
        proponente: true,
        itens: {
          include: { item: true },
        },
        avaliacoes: true,
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
        avaliacoes: true,
      },
      orderBy: { data_solicitacao: 'desc' },
    }),
  ]);

  // Separação em:
  // 1. Propostas Pendentes (recebidas e enviadas)
  const pendentesRecebidas = recebidas.filter((t) => t.status === 'PENDENTE');
  const pendentesEnviadas = enviadas.filter((t) => t.status === 'PENDENTE');

  // 2. Histórico consolidado (trocas que deixaram de ser PENDENTE: ACEITA, RECUSADA, CANCELADA)
  const historicoRecebidas = recebidas
    .filter((t) => t.status !== 'PENDENTE')
    .map((t) => ({ ...t, papelUsuario: 'DESTINATARIO' as const }));

  const historicoEnviadas = enviadas
    .filter((t) => t.status !== 'PENDENTE')
    .map((t) => ({ ...t, papelUsuario: 'PROPONENTE' as const }));

  const todosHistorico = [...historicoRecebidas, ...historicoEnviadas].sort(
    (a, b) =>
      new Date(b.data_resposta || b.data_solicitacao).getTime() -
      new Date(a.data_resposta || a.data_solicitacao).getTime()
  );

  // Aplicação de filtro simples por status no histórico
  const historicoFiltrado = statusFilter
    ? todosHistorico.filter((t) => t.status === statusFilter.toUpperCase())
    : todosHistorico;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Minhas Trocas</h1>
        <p className={styles.subtitle}>
          Gerencie suas propostas em andamento e acompanhe seu histórico de negociações.
        </p>
      </div>

      {/* =========================================
          SEÇÃO 1: TROCAS PENDENTES
         ========================================= */}
      <div style={{ marginBottom: '3.5rem' }}>
        {/* Propostas Recebidas Pendentes */}
        <h2 className={styles.sectionTitle}>
          <Inbox size={22} color="#1F3C88" /> Propostas Recebidas Pendentes ({pendentesRecebidas.length})
        </h2>
        {pendentesRecebidas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Você não possui propostas de troca pendentes para seus itens no momento.</p>
          </div>
        ) : (
          pendentesRecebidas.map((t) => {
            const ofertado = t.itens.find((i) => i.papel_item === 'OFERTADO')?.item;
            const desejado = t.itens.find((i) => i.papel_item === 'DESEJADO')?.item;
            return (
              <div key={t.id_troca} className={styles.tradeCard}>
                <div className={styles.tradeHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <strong>Proposta de {t.proponente.nome}</strong>
                      <span className={styles.roleBadgeReceiver}>Você recebeu</span>
                    </div>
                    <div className={styles.datesRow}>
                      <span>
                        Solicitada em {new Date(t.data_solicitacao).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(t.data_solicitacao).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${styles.statusPENDENTE}`}>
                    PENDENTE
                  </span>
                </div>

                <div className={styles.tradeItems}>
                  <div className={styles.itemBox}>
                    {ofertado?.foto_item && (
                      <Image
                        src={ofertado.foto_item}
                        alt={ofertado.nome}
                        width={60}
                        height={60}
                        className={styles.itemThumb}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#FF9F1C', fontWeight: 700 }}>
                        ELE(A) OFERECE
                      </div>
                      <Link href={`/itens/${ofertado?.id_item}`} style={{ color: '#0F172A', fontWeight: 700 }}>
                        {ofertado?.nome}
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {ofertado?.estado_conservacao}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: '#94a3b8', fontWeight: 800 }}>⇄</div>

                  <div className={styles.itemBox}>
                    {desejado?.foto_item && (
                      <Image
                        src={desejado.foto_item}
                        alt={desejado.nome}
                        width={60}
                        height={60}
                        className={styles.itemThumb}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#1F3C88', fontWeight: 700 }}>
                        PELO SEU ITEM
                      </div>
                      <Link href={`/itens/${desejado?.id_item}`} style={{ color: '#0F172A', fontWeight: 700 }}>
                        {desejado?.nome}
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {desejado?.estado_conservacao}
                      </div>
                    </div>
                  </div>
                </div>

                {t.mensagem && <div className={styles.message}>&ldquo;{t.mensagem}&rdquo;</div>}

                <TradeActions tradeId={t.id_troca} isProposer={false} />
              </div>
            );
          })
        )}

        {/* Propostas Enviadas Pendentes */}
        <h2 className={styles.sectionTitle} style={{ marginTop: '2.5rem' }}>
          <Send size={20} color="#FF9F1C" /> Propostas Enviadas Aguardando Resposta ({pendentesEnviadas.length})
        </h2>
        {pendentesEnviadas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Você não possui propostas enviadas aguardando resposta.</p>
          </div>
        ) : (
          pendentesEnviadas.map((t) => {
            const ofertado = t.itens.find((i) => i.papel_item === 'OFERTADO')?.item;
            const desejado = t.itens.find((i) => i.papel_item === 'DESEJADO')?.item;
            return (
              <div key={t.id_troca} className={styles.tradeCard}>
                <div className={styles.tradeHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <strong>Para {t.destinatario.nome}</strong>
                      <span className={styles.roleBadgeProposer}>Você propôs</span>
                    </div>
                    <div className={styles.datesRow}>
                      <span>
                        Enviada em {new Date(t.data_solicitacao).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(t.data_solicitacao).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${styles.statusPENDENTE}`}>
                    PENDENTE
                  </span>
                </div>

                <div className={styles.tradeItems}>
                  <div className={styles.itemBox}>
                    {ofertado?.foto_item && (
                      <Image
                        src={ofertado.foto_item}
                        alt={ofertado.nome}
                        width={60}
                        height={60}
                        className={styles.itemThumb}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#FF9F1C', fontWeight: 700 }}>
                        VOCÊ OFERECEU
                      </div>
                      <Link href={`/itens/${ofertado?.id_item}`} style={{ color: '#0F172A', fontWeight: 700 }}>
                        {ofertado?.nome}
                      </Link>
                    </div>
                  </div>

                  <div style={{ color: '#94a3b8', fontWeight: 800 }}>⇄</div>

                  <div className={styles.itemBox}>
                    {desejado?.foto_item && (
                      <Image
                        src={desejado.foto_item}
                        alt={desejado.nome}
                        width={60}
                        height={60}
                        className={styles.itemThumb}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#1F3C88', fontWeight: 700 }}>
                        PELO ITEM DELE(A)
                      </div>
                      <Link href={`/itens/${desejado?.id_item}`} style={{ color: '#0F172A', fontWeight: 700 }}>
                        {desejado?.nome}
                      </Link>
                    </div>
                  </div>
                </div>

                {t.mensagem && <div className={styles.message}>&ldquo;{t.mensagem}&rdquo;</div>}

                <TradeActions tradeId={t.id_troca} isProposer={true} />
              </div>
            );
          })
        )}
      </div>

      {/* =========================================
          SEÇÃO 2: HISTÓRICO DE TROCAS
         ========================================= */}
      <div>
        <h2 className={styles.sectionTitle}>
          <History size={22} color="#1F3C88" /> Histórico de Trocas ({todosHistorico.length})
        </h2>

        {/* Filtros simples de histórico */}
        <div className={styles.filterNav}>
          <Link
            href="/trocas"
            className={`${styles.filterLink} ${!statusFilter ? styles.filterLinkActive : ''}`}
          >
            Todas ({todosHistorico.length})
          </Link>
          <Link
            href="/trocas?status=aceita"
            className={`${styles.filterLink} ${
              statusFilter?.toUpperCase() === 'ACEITA' ? styles.filterLinkActive : ''
            }`}
          >
            Aceitas ({todosHistorico.filter((t) => t.status === 'ACEITA').length})
          </Link>
          <Link
            href="/trocas?status=recusada"
            className={`${styles.filterLink} ${
              statusFilter?.toUpperCase() === 'RECUSADA' ? styles.filterLinkActive : ''
            }`}
          >
            Recusadas ({todosHistorico.filter((t) => t.status === 'RECUSADA').length})
          </Link>
          <Link
            href="/trocas?status=cancelada"
            className={`${styles.filterLink} ${
              statusFilter?.toUpperCase() === 'CANCELADA' ? styles.filterLinkActive : ''
            }`}
          >
            Canceladas ({todosHistorico.filter((t) => t.status === 'CANCELADA').length})
          </Link>
        </div>

        {historicoFiltrado.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma troca finalizada encontrada neste filtro.</p>
          </div>
        ) : (
          historicoFiltrado.map((t) => {
            const ofertado = t.itens.find((i) => i.papel_item === 'OFERTADO')?.item;
            const desejado = t.itens.find((i) => i.papel_item === 'DESEJADO')?.item;
            const isProposer = t.papelUsuario === 'PROPONENTE';
            const parceiro = isProposer ? t.destinatario.nome : t.proponente.nome;

            return (
              <div key={t.id_troca} className={styles.tradeCard} style={{ opacity: t.status === 'ACEITA' ? 1 : 0.88 }}>
                <div className={styles.tradeHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <strong>
                        {isProposer ? `Negociação com ${parceiro}` : `Proposta de ${parceiro}`}
                      </strong>
                      <span
                        className={
                          isProposer ? styles.roleBadgeProposer : styles.roleBadgeReceiver
                        }
                      >
                        {isProposer ? 'Você propôs' : 'Você recebeu'}
                      </span>
                    </div>

                    <div className={styles.datesRow}>
                      <span>
                        Solicitada: {new Date(t.data_solicitacao).toLocaleDateString('pt-BR')}
                      </span>
                      {t.data_resposta && (
                        <span>
                          Finalizada:{' '}
                          {new Date(t.data_resposta).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(t.data_resposta).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`${styles.statusBadge} ${styles['status' + t.status]}`}>
                    {t.status}
                  </span>
                </div>

                <div className={styles.tradeItems}>
                  <div className={styles.itemBox}>
                    {ofertado?.foto_item && (
                      <Image
                        src={ofertado.foto_item}
                        alt={ofertado.nome}
                        width={60}
                        height={60}
                        className={styles.itemThumb}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#FF9F1C', fontWeight: 700 }}>
                        {isProposer ? 'VOCÊ OFERECEU' : `${parceiro.split(' ')[0]} OFERECEU`}
                      </div>
                      <Link href={`/itens/${ofertado?.id_item}`} style={{ color: '#0F172A', fontWeight: 700 }}>
                        {ofertado?.nome}
                      </Link>
                    </div>
                  </div>

                  <div style={{ color: '#94a3b8', fontWeight: 800 }}>⇄</div>

                  <div className={styles.itemBox}>
                    {desejado?.foto_item && (
                      <Image
                        src={desejado.foto_item}
                        alt={desejado.nome}
                        width={60}
                        height={60}
                        className={styles.itemThumb}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#1F3C88', fontWeight: 700 }}>
                        {isProposer ? `PELO ITEM DE ${parceiro.split(' ')[0]}` : 'PELO SEU ITEM'}
                      </div>
                      <Link href={`/itens/${desejado?.id_item}`} style={{ color: '#0F172A', fontWeight: 700 }}>
                        {desejado?.nome}
                      </Link>
                    </div>
                  </div>
                </div>

                {t.mensagem && <div className={styles.message}>&ldquo;{t.mensagem}&rdquo;</div>}

                {t.status === 'ACEITA' && (
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    {(() => {
                      const avaliacaoUsuario = t.avaliacoes.find((a) => a.id_avaliador === user.id_usuario);
                      const idAvaliado = isProposer ? t.id_usuario_destinatario : t.id_usuario_proponente;
                      return (
                        <TradeReviewAction
                          tradeId={t.id_troca}
                          evaluatedId={idAvaliado}
                          evaluatedName={parceiro}
                          hasBeenReviewed={!!avaliacaoUsuario}
                          existingRating={avaliacaoUsuario?.nota}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
