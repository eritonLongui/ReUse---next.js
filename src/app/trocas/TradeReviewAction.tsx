'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Check } from 'lucide-react';
import ReviewModal from '@/components/ReviewModal';
import styles from './TradeReviewAction.module.css';

interface TradeReviewActionProps {
  tradeId: number;
  evaluatedId: number;
  evaluatedName: string;
  hasBeenReviewed: boolean;
  existingRating?: number | null;
}

export default function TradeReviewAction({
  tradeId,
  evaluatedId,
  evaluatedName,
  hasBeenReviewed,
  existingRating,
}: TradeReviewActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  if (hasBeenReviewed) {
    return (
      <div className={styles.reviewedBadge}>
        <Check size={14} color="#10B981" />
        <span>Você avaliou ({existingRating || '★'} <Star size={12} fill="#FF9F1C" color="#FF9F1C" style={{ display: 'inline' }} />)</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={styles.reviewButton}
        onClick={() => setIsModalOpen(true)}
      >
        <Star size={16} fill="#FF9F1C" color="#FF9F1C" />
        <span>Avaliar Troca</span>
      </button>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tradeId={tradeId}
        evaluatedId={evaluatedId}
        evaluatedName={evaluatedName}
        onSuccess={handleSuccess}
      />
    </>
  );
}
