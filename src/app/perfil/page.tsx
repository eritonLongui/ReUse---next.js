import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { User, MapPin, Mail, Calendar, Package, PlusCircle, Heart } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import styles from './perfil.module.css';

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [itens, trocasRealizadasCount, favoritos] = await Promise.all([
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
  ]);

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

        <div className={styles.statBadges}>
          <div className={styles.statBadge}>
            <span className={styles.statNum}>{itens.length}</span>
            <span className={styles.statTxt}>Itens Cadastrados</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statNum}>{trocasRealizadasCount}</span>
            <span className={styles.statTxt}>Trocas Realizadas</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statNum}>{favoritos.length}</span>
            <span className={styles.statTxt}>Favoritos</span>
          </div>
        </div>
      </div>

      {/* Meus Itens Cadastrados */}
      <div className={styles.itensSection}>
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
      <div className={styles.itensSection}>
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
    </div>
  );
}
