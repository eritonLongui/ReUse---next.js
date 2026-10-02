'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
  itemId: number;
  initialIsFavorite?: boolean;
  isAuthenticated: boolean;
  className?: string;
  size?: number;
}

export default function FavoriteButton({
  itemId,
  initialIsFavorite = false,
  isAuthenticated,
  className = '',
  size = 18,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (loading) return;

    const previousState = isFavorite;
    // Otimistic update
    setIsFavorite(!previousState);
    setLoading(true);

    try {
      const res = await fetch('/api/favoritos', {
        method: previousState ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_item: itemId }),
      });

      if (!res.ok) {
        // Reverte se falhar
        setIsFavorite(previousState);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Erro ao alternar favorito:', err);
      setIsFavorite(previousState);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${styles.favoriteBtn} ${className}`}
      title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      disabled={loading}
    >
      <Heart
        size={size}
        className={isFavorite ? styles.iconFavorited : styles.iconDefault}
      />
    </button>
  );
}
