import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Search, MapPin, ArrowRightLeft, Sparkles, Filter } from 'lucide-react';
import styles from './discover.module.css';

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; estado?: string }>;
}) {
  const { q, cat, estado } = await searchParams;

  let categories: Array<{ id_categoria: number; nome: string }> = [];
  let items: any[] = [];

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

    items = await prisma.item.findMany({
      where: whereClause,
      include: {
        categoria: true,
        usuario: {
          include: { endereco: true },
        },
      },
      orderBy: { data_cadastro: 'desc' },
    });
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

        <button type="submit" className={styles.filterBtn}>
          <Filter size={16} /> Filtrar
        </button>
      </form>

      {/* Grid de Itens */}
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <ArrowRightLeft size={48} color="#FF9F1C" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1F3C88', marginBottom: '0.5rem' }}>
            Nenhum item encontrado
          </h3>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Não encontramos itens com os filtros selecionados ou ainda não há anúncios cadastrados nessa categoria.
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
