import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  User,
  MapPin,
  Mail,
  Calendar,
  Package,
  PlusCircle,
  Heart,
  Star,
  MessageSquare,
  ArrowRightLeft,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import styles from './perfil.module.css';

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [itens, trocasRealizadasCount, favoritos, avaliacoesRecebidas, ultimasTrocas] =
    await Promise.all([
      prisma.item.findMany({
        where: { id_usuario: user.id_usuario },
        include: { categoria: true },
        orderBy: { data_cadastro: 'desc' },
      }),
      prisma.troca.count({
        where: {
          status: 'ACEITA',
          OR: [
            { id_usuario_proponente: user.id_usuario },
            { id_usuario_destinatario: user.id_usuario },
          ],
        },
      }),
      prisma.favorito.findMany({
        where: { id_usuario: user.id_usuario },
        include: {
          item: {
            include: {
              categoria: true,
              usuario: {
                include: { endereco: true },
              },
            },
          },
        },
        orderBy: { data_cadastro: 'desc' },
      }),
      prisma.avaliacao.findMany({
        where: { id_avaliado: user.id_usuario },
        include: {
          avaliador: true,
        },
        orderBy: { data_cadastro: 'desc' },
      }),
      prisma.troca.findMany({
        where: {
          OR: [
            { id_usuario_proponente: user.id_usuario },
            { id_usuario_destinatario: user.id_usuario },
          ],
        },
        include: {
          proponente: true,
          destinatario: true,
        },
        orderBy: { data_solicitacao: 'desc' },
        take: 5,
      }),
    ]);

  // Calcular reputação média do usuário logado
  const totalAvaliacoes = avaliacoesRecebidas.length;
  const ratingMedio =
    totalAvaliacoes > 0
      ? Number(
          (
            avaliacoesRecebidas.reduce((acc, curr) => acc + curr.nota, 0) /
            totalAvaliacoes
          ).toFixed(1)
        )
      : null;

  // Montar lista unificada de Atividade Recente baseada em dados reais
  interface ActivityItemData {
    id: string;
    titulo: string;
    descricao?: string;
    data: Date;
    tipo: 'troca_aceita' | 'troca_recusada' | 'troca_pendente' | 'avaliacao' | 'favorito' | 'item';
  }

  const atividades: ActivityItemData[] = [];

  // 1. Trocas
  for (const t of ultimasTrocas) {
    const isProposer = t.id_usuario_proponente === user.id_usuario;
    const outroUsuario = isProposer ? t.destinatario.nome : t.proponente.nome;
    const dataEvento = t.data_resposta || t.data_solicitacao;

    if (t.status === 'ACEITA') {
      atividades.push({
        id: `troca-${t.id_troca}`,
        titulo: `Troca aceita com ${outroUsuario}`,
        descricao: 'A negociação foi concluída com sucesso.',
        data: new Date(dataEvento),
        tipo: 'troca_aceita',
      });
    } else if (t.status === 'RECUSADA') {
      atividades.push({
        id: `troca-${t.id_troca}`,
        titulo: `Troca recusada com ${outroUsuario}`,
        descricao: 'A proposta foi recusada.',
        data: new Date(dataEvento),
        tipo: 'troca_recusada',
      });
    } else if (t.status === 'PENDENTE') {
      atividades.push({
        id: `troca-${t.id_troca}`,
        titulo: isProposer
          ? `Proposta enviada para ${outroUsuario}`
          : `Nova proposta recebida de ${outroUsuario}`,
        descricao: 'Aguardando resposta.',
        data: new Date(dataEvento),
        tipo: 'troca_pendente',
      });
    }
  }

  // 2. Avaliações recebidas
  for (const av of avaliacoesRecebidas.slice(0, 3)) {
    atividades.push({
      id: `avaliacao-${av.id_avaliacao}`,
      titulo: `Avaliação recebida de ${av.avaliador.nome}`,
      descricao: `Nota: ${av.nota} estrela(s)${av.comentario ? ` — "${av.comentario}"` : ''}`,
      data: new Date(av.data_cadastro),
      tipo: 'avaliacao',
    });
  }

  // 3. Favoritos adicionados
  for (const fav of favoritos.slice(0, 3)) {
    atividades.push({
      id: `fav-${fav.id_favorito}`,
      titulo: `Item favoritado: ${fav.item.nome}`,
      descricao: `Categoria: ${fav.item.categoria.nome}`,
      data: new Date(fav.data_cadastro),
      tipo: 'favorito',
    });
  }

  // 4. Itens publicados
  for (const it of itens.slice(0, 3)) {
    atividades.push({
      id: `item-${it.id_item}`,
      titulo: `Objeto cadastrado: ${it.nome}`,
      descricao: `${it.categoria.nome} • ${it.estado_conservacao}`,
      data: new Date(it.data_cadastro),
      tipo: 'item',
    });
  }

  // Ordenar decrescente por data e limitar a 5 eventos mais recentes
  atividades.sort((a, b) => b.data.getTime() - a.data.getTime());
  const atividadesRecentes = atividades.slice(0, 5);

  return (
    <div className={styles.wrapper}>
      {/* Header do Perfil */}
      <div className={styles.cardHeader}>
        <div className={styles.avatarLarge}>
          {user.nome.slice(0, 1).toUpperCase()}
        </div>

        <div className={styles.profileInfo}>
          <h1 className={styles.name}>{user.nome}</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}><Mail size={15} /> {user.email}</span>
            {user.endereco && (
              <span className={styles.metaItem}>
                <MapPin size={15} /> {user.endereco.bairro ? `${user.endereco.bairro}, ` : ''}{user.endereco.cidade} - {user.endereco.uf}
              </span>
            )}
            <span className={styles.metaItem}>
              <Calendar size={15} /> Membro desde {new Date(user.data_cadastro).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* DASHBOARD PESSOAL DO USUÁRIO (Resumo) */}
      <div className={styles.dashboardSection}>
        <div className={styles.dashboardHeader}>
          <h2 className={styles.dashboardTitle}>
            <LayoutDashboard size={20} color="#1F3C88" /> Resumo
          </h2>
        </div>

        <div className={styles.dashboardGrid}>
          {/* 1. Meus itens */}
          <Link href="#meus-itens" className={styles.metricCard}>
            <div className={styles.metricIconBox} style={{ backgroundColor: '#EEF2FF', color: '#1F3C88' }}>
              <Package size={22} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{itens.length}</div>
              <div className={styles.metricLabel}>Meus itens</div>
              <div className={styles.metricSubtext}>
                {itens.filter((i) => i.disponivel).length} disponíveis
              </div>
            </div>
          </Link>

          {/* 2. Trocas realizadas */}
          <Link href="/trocas" className={styles.metricCard}>
            <div className={styles.metricIconBox} style={{ backgroundColor: '#FFF7ED', color: '#FF9F1C' }}>
              <ArrowRightLeft size={22} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{trocasRealizadasCount}</div>
              <div className={styles.metricLabel}>Trocas realizadas</div>
              <div className={styles.metricSubtext}>Concluídas com sucesso</div>
            </div>
          </Link>

          {/* 3. Favoritos */}
          <Link href="#favoritos" className={styles.metricCard}>
            <div className={styles.metricIconBox} style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
              <Heart size={22} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{favoritos.length}</div>
              <div className={styles.metricLabel}>Favoritos</div>
              <div className={styles.metricSubtext}>Itens salvos</div>
            </div>
          </Link>

          {/* 4. Reputação */}
          <Link href="#avaliacoes" className={styles.metricCard}>
            <div className={styles.metricIconBox} style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Star size={22} fill={ratingMedio ? '#D97706' : 'none'} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>
                {ratingMedio !== null ? (
                  <span>{ratingMedio} <Star size={16} fill="#FF9F1C" color="#FF9F1C" style={{ display: 'inline', verticalAlign: 'baseline' }} /></span>
                ) : (
                  <span style={{ fontSize: '1rem', color: '#64748b' }}>Sem avaliações</span>
                )}
              </div>
              <div className={styles.metricLabel}>Reputação</div>
              <div className={styles.metricSubtext}>
                {totalAvaliacoes > 0
                  ? `${totalAvaliacoes} ${totalAvaliacoes === 1 ? 'avaliação recebida' : 'avaliações recebidas'}`
                  : 'Nenhuma avaliação ainda'}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* SEÇÃO: ATIVIDADE RECENTE (baseada exclusivamente em dados reais) */}
      {atividadesRecentes.length > 0 && (
        <div className={styles.recentActivitySection}>
          <div className={styles.dashboardHeader}>
            <h2 className={styles.dashboardTitle}>
              <Clock size={20} color="#1F3C88" /> Atividade recente
            </h2>
          </div>

          <div className={styles.activityList}>
            {atividadesRecentes.map((ativ) => {
              let iconEl = <Clock size={16} color="#64748b" />;
              let bgColor = '#F1F5F9';

              if (ativ.tipo === 'troca_aceita') {
                iconEl = <CheckCircle2 size={16} color="#10B981" />;
                bgColor = '#ECFDF5';
              } else if (ativ.tipo === 'troca_recusada') {
                iconEl = <XCircle size={16} color="#EF4444" />;
                bgColor = '#FEF2F2';
              } else if (ativ.tipo === 'troca_pendente') {
                iconEl = <ArrowRightLeft size={16} color="#FF9F1C" />;
                bgColor = '#FFF7ED';
              } else if (ativ.tipo === 'avaliacao') {
                iconEl = <Star size={16} color="#D97706" fill="#D97706" />;
                bgColor = '#FEF3C7';
              } else if (ativ.tipo === 'favorito') {
                iconEl = <Heart size={16} color="#EF4444" fill="#EF4444" />;
                bgColor = '#FEF2F2';
              } else if (ativ.tipo === 'item') {
                iconEl = <Package size={16} color="#1F3C88" />;
                bgColor = '#EEF2FF';
              }

              return (
                <div key={ativ.id} className={styles.activityItem}>
                  <div className={styles.activityLeft}>
                    <div className={styles.activityIcon} style={{ backgroundColor: bgColor }}>
                      {iconEl}
                    </div>
                    <div>
                      <div className={styles.activityText}>
                        <strong>{ativ.titulo}</strong>
                      </div>
                      {ativ.descricao && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {ativ.descricao}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={styles.activityTime}>
                    {ativ.data.toLocaleDateString('pt-BR')} às{' '}
                    {ativ.data.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meus Itens Cadastrados */}
      <div id="meus-itens" className={styles.itensSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Package size={22} /> Meus Objetos Cadastrados ({itens.length})
          </h2>
          <Link href="/itens/novo" className={styles.btnNovo}>
            <PlusCircle size={16} /> Novo Item
          </Link>
        </div>

        {itens.length === 0 ? (
          <div className={styles.empty}>
            <p>Você ainda não cadastrou nenhum item para troca.</p>
            <Link href="/itens/novo" className={styles.btnNovo} style={{ display: 'inline-flex', marginTop: '1rem' }}>
              Publicar primeiro objeto
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {itens.map((it) => (
              <div key={it.id_item} className={styles.itemCard}>
                <div className={styles.thumbArea}>
                  <Image
                    src={it.foto_item || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&auto=format&fit=crop&q=80'}
                    alt={it.nome}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <span className={styles.statusPill}>
                    {it.disponivel ? 'Disponível' : 'Trocado'}
                  </span>
                </div>
                <div className={styles.itemBody}>
                  <h3 className={styles.itemTitle}>{it.nome}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {it.categoria.nome} • {it.estado_conservacao}
                  </div>
                  <Link href={`/itens/${it.id_item}`} style={{ color: '#FF9F1C', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.75rem', display: 'inline-block' }}>
                    Ver Anúncio →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meus Favoritos */}
      <div id="favoritos" className={styles.itensSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Heart size={22} color="#EF4444" fill="#EF4444" /> Meus Favoritos ({favoritos.length})
          </h2>
        </div>

        {favoritos.length === 0 ? (
          <div className={styles.empty}>
            <p>Você ainda não favoritou nenhum item.</p>
            <Link href="/discover" className={styles.btnNovo} style={{ display: 'inline-flex', marginTop: '1rem' }}>
              Explorar Itens no Feed
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {favoritos.map((fav) => {
              const it = fav.item;
              return (
                <div key={fav.id_favorito} className={styles.itemCard}>
                  <div className={styles.thumbArea}>
                    <Image
                      src={it.foto_item || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&auto=format&fit=crop&q=80'}
                      alt={it.nome}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.favoriteCardAction}>
                      <FavoriteButton
                        itemId={it.id_item}
                        initialIsFavorite={true}
                        isAuthenticated={true}
                      />
                    </div>
                    <span
                      className={`${styles.statusPill} ${
                        !it.disponivel ? styles.statusUnavailable : ''
                      }`}
                    >
                      {it.disponivel ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                  <div className={styles.itemBody}>
                    <h3 className={styles.itemTitle}>{it.nome}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {it.categoria.nome} • {it.estado_conservacao}
                    </div>
                    <div className={styles.favFooter}>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Dono: {it.usuario.nome.split(' ')[0]}
                      </span>
                      <Link
                        href={`/itens/${it.id_item}`}
                        style={{
                          color: '#1F3C88',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                        }}
                      >
                        Ver Detalhes →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Seção de Avaliações Recebidas */}
      <div id="avaliacoes" className={styles.itensSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <MessageSquare size={22} color="#1F3C88" /> Avaliações Recebidas ({totalAvaliacoes})
          </h2>
        </div>

        {totalAvaliacoes === 0 ? (
          <div className={styles.empty}>
            <p>Você ainda não recebeu nenhuma avaliação de outros usuários.</p>
          </div>
        ) : (
          <div className={styles.commentsList}>
            {avaliacoesRecebidas.map((av) => (
              <div key={av.id_avaliacao} className={styles.commentCard}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentUser}>
                    <div className={styles.avatarSmall}>
                      {av.avaliador.nome.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <strong className={styles.commentAuthor}>{av.avaliador.nome}</strong>
                      <div className={styles.commentDate}>
                        {new Date(av.data_cadastro).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className={styles.commentRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= av.nota ? '#FF9F1C' : 'transparent'}
                        color={star <= av.nota ? '#FF9F1C' : '#cbd5e1'}
                      />
                    ))}
                  </div>
                </div>
                {av.comentario && (
                  <p className={styles.commentText}>&ldquo;{av.comentario}&rdquo;</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
