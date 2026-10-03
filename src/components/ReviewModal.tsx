import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './ReviewModal.module.css';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: number;
  evaluatedId: number;
  evaluatedName: string;
  onSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  tradeId,
  evaluatedId,
  evaluatedName,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_troca: tradeId,
          id_avaliado: evaluatedId,
          nota: rating,
          comentario: comment || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao enviar a avaliação.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Avaliar Troca</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.intro}>
            Como foi sua experiência de troca com <strong>{evaluatedName}</strong>? Sua avaliação ajuda a manter a comunidade ReUse! segura e confiável.
          </p>

          <div className={styles.ratingSection}>
            <span className={styles.label}>Sua Nota:</span>
            <div className={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={styles.starButton}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    size={32}
                    className={
                      star <= (hoveredRating || rating)
                        ? styles.starActive
                        : styles.starInactive
                    }
                    fill={star <= (hoveredRating || rating) ? '#FF9F1C' : 'transparent'}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className={styles.ratingValue}>
                {rating} {rating === 1 ? 'estrela' : 'estrelas'}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="comment" className={styles.label}>Comentário / Depoimento (opcional):</label>
            <textarea
              id="comment"
              className={styles.textarea}
              placeholder="Escreva como foi negociar, a qualidade do objeto recebido, a pontualidade..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
