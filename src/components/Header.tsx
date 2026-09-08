import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { ArrowRightLeft, PlusCircle, LogOut, Sparkles } from 'lucide-react';
import styles from './Header.module.css';

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logoArea}>
          <Image
            src="/images/sombreado.png"
            alt="ReUse!"
            width={140}
            height={45}
            className={styles.logoImage}
            priority
          />
        </Link>

        <nav className={styles.nav}>
          <Link href="/discover" className={styles.navLink}>
            <ArrowRightLeft size={18} /> Explorar Trocas
          </Link>
          <Link href="/itens/novo" className={styles.navLink}>
            <PlusCircle size={18} /> Anunciar Item
          </Link>
          <Link href="/trocas" className={styles.navLink}>
            Minhas Trocas
          </Link>
        </nav>

        <div className={styles.actions}>
          {!user ? (
            <>
              <Link href="/login" className={styles.btnSecondary}>
                Entrar
              </Link>
              <Link href="/cadastro" className={styles.btnPrimary}>
                <Sparkles size={16} /> Criar Conta
              </Link>
            </>
          ) : (
            <>
              <Link href="/itens/novo" className={styles.btnPrimary}>
                <PlusCircle size={16} /> Anunciar
              </Link>
              <Link href="/perfil" className={styles.userBadge}>
                <div className={styles.userAvatar}>
                  {user.nome.slice(0, 1).toUpperCase()}
                </div>
                <span className={styles.userName}>{user.nome.split(' ')[0]}</span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className={styles.btnSecondary} title="Sair da Conta">
                  <LogOut size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
