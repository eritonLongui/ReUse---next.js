import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateDistanceKm, formatDistance } from '@/lib/geo';
import FavoriteButton from '@/components/FavoriteButton';
import { Search, MapPin, ArrowRightLeft, Sparkles, Filter, Navigation } from 'lucide-react';
import styles from './discover.module.css';

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    estado?: string;
    raio?: string;
    ordem?: string;
  }>;
}) {
  const { q, cat, estado, raio, ordem } = await searchParams;

  let categories: Array<{ id_categoria: number; nome: string }> = [];
  let items: any[] = [];
  const currentUser = await getCurrentUser();

  const userCoords = currentUser?.endereco
    ? {
        latitude: currentUser.endereco.latitude,
        longitude: currentUser.endereco.longitude,
      }
    : null;

  const hasUserLocation =
    userCoords?.latitude != null && userCoords?.longitude != null;

  try {
    categories = await prisma.categoria.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });

    const whereClause: any = {
      disponivel: true,
    };

    if (q) {
      whereClause.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (cat) {
      whereClause.categoria = { nome: cat };
    }

    if (estado) {
      whereClause.estado_conservacao = estado;
    }

    const [fetchedItems, userFavorites] = await Promise.all([
      prisma.item.findMany({
        where: whereClause,
        include: {
          categoria: true,
          usuario: {
            include: { endereco: true },
          },
        },
        orderBy: { data_cadastro: 'desc' },
      }),
      currentUser
        ? prisma.favorito.findMany({
            where: { id_usuario: currentUser.id_usuario },
            select: { id_item: true },
          })
        : Promise.resolve([]),
    ]);

    const favoriteSet = new Set(userFavorites.map((f) => f.id_item));

    // Mapeia e calcula a distância aproximada de cada item em relação ao usuário logado
    const itemsWithDistance = fetchedItems.map((item) => {
      const itemCoords = item.usuario.endereco
        ? {
            latitude: item.usuario.endereco.latitude,
            longitude: item.usuario.endereco.longitude,
          }
        : null;

      const distanceKm = hasUserLocation
        ? calculateDistanceKm(userCoords, itemCoords)
        : null;

      return {
        ...item,
        distanceKm,
        formattedDistance: formatDistance(distanceKm),
        isFavorite: favoriteSet.has(item.id_item),
      };
    });

    // Filtro por raio de distância (se selecionado e se o usuário tiver localização)
    const maxRadius = raio ? parseFloat(raio) : null;
    let filteredItems = itemsWithDistance;

    if (maxRadius && !isNaN(maxRadius) && hasUserLocation) {
      filteredItems = filteredItems.filter(
        (item) => item.distanceKm !== null && item.distanceKm <= maxRadius
      );
    }

    // Ordenação (por proximidade ou padrão por mais recentes)
    if (ordem === 'proximidade' && hasUserLocation) {
      filteredItems.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    items = filteredItems;
  } catch (err) {
    console.error('Discover error:', err);
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.heroHeader}>
        <div>
          <h1 className={styles.title}>Feed de Trocas</h1>
          <p className={styles.subtitle}>
            Explore objetos disponíveis para troca perto de você na comunidade ReUse!
          </p>
        </div>

        <Link href="/itens/novo" className={styles.btnPropor} style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}>
          <Sparkles size={16} /> Anunciar Meu Item
        </Link>
      </div>

      {/* Formulário de Busca e Filtros */}
      <form method="GET" className={styles.searchBar}>
        <Search size={20} color="#94a3b8" style={{ marginLeft: '0.5rem' }} />
        <input
          type="text"
          name="q"
          placeholder="O que você está procurando hoje?"
          defaultValue={q || ''}
          className={styles.searchInput}
        />

        <select name="cat" defaultValue={cat || ''} className={styles.categorySelect}>
          <option value="">Todas as Categorias</option>
          {categories.map((c) => (
            <option key={c.id_categoria} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>

        <select name="estado" defaultValue={estado || ''} className={styles.categorySelect}>
          <option value="">Qualquer Estado</option>
          <option value="Novo">Novo</option>
          <option value="Como Novo">Como Novo</option>
          <option value="Bom">Bom</option>
          <option value="Marcas de Uso">Marcas de Uso</option>
        </select>

        {/* Filtro por Raio de Distância */}
        <select
          name="raio"
          defaultValue={raio || ''}
          className={styles.categorySelect}
          title={!hasUserLocation ? 'Cadastre seu endereço para filtrar por distância' : undefined}
        >
          <option value="">Qualquer Distância</option>
          <option value="5">Até 5 km</option>
          <option value="10">Até 10 km</option>
          <option value="25">Até 25 km</option>
          <option value="50">Até 50 km</option>
        </select>

        {/* Ordenação */}
        <select name="ordem" defaultValue={ordem || ''} className={styles.categorySelect}>
          <option value="">Mais Recentes</option>
          <option value="proximidade">Mais Próximos</option>
        </select>

        <button type="submit" className={styles.filterBtn}>
          <Filter size={16} /> Filtrar
        </button>
      </form>

      {/* Dica contextual de localização quando o usuário tiver endereço */}
      {currentUser && hasUserLocation && (
        <div className={styles.proximityHint}>
          <Navigation size={14} color="#1F3C88" />
          <span>
            Calculando distâncias a partir de <strong>{currentUser.endereco?.bairro || currentUser.endereco?.cidade}</strong>
          </span>
        </div>
      )}

      {/* Grid de Itens */}
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <ArrowRightLeft size={48} color="#FF9F1C" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1F3C88', marginBottom: '0.5rem' }}>
            Nenhum item encontrado
          </h3>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Não encontramos itens com os filtros selecionados ou ainda não há anúncios cadastrados nessa categoria/raio.
          </p>
          <Link href="/itens/novo" className={styles.btnPropor}>
            Seja o primeiro a desapegar e anunciar!
          </Link>
        </div>
      ) : (
        <div className={styles.itemsGrid}>
          {items.map((item) => (
            <div key={item.id_item} className={styles.itemCard}>
              <div className={styles.imageArea}>
                <Image
                  src={item.foto_item || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&auto=format&fit=crop&q=80'}
                  alt={item.nome}
                  fill
                  className={styles.itemImage}
                />
                <span className={styles.conditionBadge}>{item.estado_conservacao}</span>
                <span className={styles.categoryTag}>{item.categoria.nome}</span>

                {/* Botão de Favorito discreto sobre a imagem */}
                <div className={styles.favoriteAction}>
                  <FavoriteButton
                    itemId={item.id_item}
                    initialIsFavorite={item.isFavorite}
                    isAuthenticated={!!currentUser}
                  />
                </div>
              </div>

              <div className={styles.contentArea}>
                <h3 className={styles.itemTitle}>{item.nome}</h3>
                <p className={styles.itemDesc}>{item.descricao}</p>

                <div className={styles.cardFooter}>
                  <div>
                    <div className={styles.ownerInfo}>
                      <span>{item.usuario.nome.split(' ')[0]}</span>
                    </div>
                    {item.usuario.endereco && (
                      <div className={styles.location}>
                        <MapPin size={12} />
                        <span>
                          {item.usuario.endereco.bairro ? `${item.usuario.endereco.bairro}, ` : ''}
                          {item.usuario.endereco.cidade}/{item.usuario.endereco.uf}
                        </span>
                      </div>
                    )}
                    {item.formattedDistance && (
                      <div className={styles.distanceBadge}>
                        <Navigation size={11} />
                        <span>{item.formattedDistance}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/itens/${item.id_item}`} className={styles.btnPropor}>
                    <ArrowRightLeft size={14} /> Trocar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
