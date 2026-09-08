import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { ArrowRight, Recycle, ShieldCheck, MapPin, Sparkles, Box, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default async function HomePage() {
  let stats = { items: 0, users: 0, categories: 0 };
  let recentItems: Array<{
    id_item: number;
    nome: string;
    estado_conservacao: string;
    foto_item: string | null;
    categoria: { nome: string };
    usuario: { nome: string; endereco: { cidade: string; uf: string } | null };
  }> = [];

  try {
    const [itemsCount, usersCount, catCount, latest] = await Promise.all([
      prisma.item.count({ where: { disponivel: true } }),
      prisma.usuario.count(),
      prisma.categoria.count({ where: { ativo: true } }),
      prisma.item.findMany({
        where: { disponivel: true },
        take: 4,
        orderBy: { data_cadastro: 'desc' },
        include: {
          categoria: true,
          usuario: {
            include: { endereco: true },
          },
        },
      }),
    ]);
    stats = { items: itemsCount, users: usersCount, categories: catCount };
    recentItems = latest;
  } catch {
    // Caso o banco ainda não esteja conectado, roda a tela em modo de demonstração
  }

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div>
            <div className={styles.heroTag}>
              <Sparkles size={16} /> Plataforma de Economia Circular
            </div>
            <h1 className={styles.headline}>
              Troque. Reutilize. <br />
              <span className={styles.headlineAccent}>Transforme.</span>
            </h1>
            <p className={styles.subtitle}>
              Uma plataforma digital que dá novos ciclos aos seus objetos, conecta pessoas da sua região e estimula o consumo consciente sem custos.
            </p>
            <div className={styles.heroActions}>
              <Link href="/discover" className={styles.btnCta}>
                Explorar Feed de Trocas <ArrowRight size={18} />
              </Link>
              <Link href="/cadastro" className={styles.btnOutline}>
                Cadastrar Agora
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <Image
                src="/images/sombreado.png"
                alt="ReUse Logo"
                width={200}
                height={120}
                style={{ objectFit: 'contain', margin: '0 auto 1.5rem' }}
                priority
              />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Impacto Sustentável
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Conectando quem tem ao que alguém precisa, reduzindo a pegada de descarte.
              </p>
              <div className={styles.statGrid}>
                <div className={styles.statBox}>
                  <span className={styles.statNumber}>{stats.items > 0 ? stats.items : '50+'}</span>
                  <span className={styles.statLabel}>Itens Ativos</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statNumber}>{stats.users > 0 ? stats.users : '100%'}</span>
                  <span className={styles.statLabel}>Gratuito</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O Problema e A Solução */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionPreTitle}>Proposta de Valor</div>
            <h2 className={styles.sectionTitle}>Por que criamos o ReUse?</h2>
            <p className={styles.sectionDesc}>
              Acreditamos que o ciclo de vida de um produto não deve terminar em uma gaveta ou no lixo enquanto ele ainda tiver valor para outra pessoa.
            </p>
          </div>

          <div className={styles.cardsGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Recycle size={28} />
              </div>
              <h3 className={styles.featureTitle}>O Problema do Descarte</h3>
              <p className={styles.featureText}>
                Muitos objetos em perfeito estado de conservação são esquecidos ou descartados prematuramente simplesmente por falta de conexão entre quem tem e quem gostaria de usá-los.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ShieldCheck size={28} />
              </div>
              <h3 className={styles.featureTitle}>A Solução ReUse!</h3>
              <p className={styles.featureText}>
                Uma ponte direta entre membros da comunidade local. Você publica itens que não usa mais, explora ofertas de interesse e negocia trocas justas, sem transações financeiras.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <MapPin size={28} />
              </div>
              <h3 className={styles.featureTitle}>Proximidade e Comunidade</h3>
              <p className={styles.featureText}>
                Integração com CEP e localização para facilitar trocas presenciais em pontos de encontro seguros, aproximando pessoas do mesmo bairro ou cidade.
              </p>
            </div>
          </div>

          {/* Banner de Ação */}
          <div className={styles.ctaBanner}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F3C88', marginBottom: '0.75rem' }}>
              Pronto para dar um novo destino ao que está parado?
            </h3>
            <p style={{ color: '#64748b', marginBottom: '1.75rem', maxWidth: '560px', margin: '0 auto 1.75rem' }}>
              Leva menos de 1 minuto para criar sua conta e cadastrar seu primeiro item para troca.
            </p>
            <Link href="/cadastro" className={styles.btnCta}>
              Criar Minha Conta Gratuita <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
