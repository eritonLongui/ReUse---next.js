import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <div className={styles.brandTitle}>
              <Image
                src="/images/isotipo.png"
                alt="ReUse Icon"
                width={32}
                height={32}
                style={{ objectFit: 'contain' }}
              />
              <span>ReUse!</span>
            </div>
            <p className={styles.brandDesc}>
              Plataforma digital voltada à economia sustentável, reutilização de produtos e consumo consciente. Troque. Reutilize. Transforme.
            </p>
          </div>

          <div>
            <h4 className={styles.colTitle}>Navegação</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}><Link href="/">Início</Link></li>
              <li className={styles.linkItem}><Link href="/discover">Explorar Itens</Link></li>
              <li className={styles.linkItem}><Link href="/itens/novo">Anunciar para Troca</Link></li>
              <li className={styles.linkItem}><Link href="/trocas">Painel de Trocas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Categorias</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}><Link href="/discover?cat=Eletrônicos">Eletrônicos</Link></li>
              <li className={styles.linkItem}><Link href="/discover?cat=Livros">Livros & Revistas</Link></li>
              <li className={styles.linkItem}><Link href="/discover?cat=Moda">Moda e Acessórios</Link></li>
              <li className={styles.linkItem}><Link href="/discover?cat=Decoração">Casa & Jardim</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Acadêmico</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}><span style={{ color: '#6b7280' }}>FIAP — Next.js & Prisma</span></li>
              <li className={styles.linkItem}><span style={{ color: '#6b7280' }}>PostgreSQL Relacional</span></li>
              <li className={styles.linkItem}><span style={{ color: '#6b7280' }}>Economia Circular</span></li>
              <li className={styles.linkItem}><span style={{ color: '#6b7280' }}>Sprint Web 2026</span></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div>© {new Date().getFullYear()} ReUse! — Todos os direitos reservados.</div>
          <div>Desenvolvido com Next.js, Prisma ORM e PostgreSQL.</div>
        </div>
      </div>
    </footer>
  );
}
