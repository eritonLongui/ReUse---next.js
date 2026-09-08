'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import styles from './trocas.module.css';

export default function TradeActions({ tradeId }: { tradeId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(status: 'ACEITA' | 'RECUSADA') {
    setLoading(true);
    try {
      await fetch(`/api/trocas/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch {
      alert('Falha ao atualizar troca');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.actions}>
      <button
        onClick={() => handleAction('RECUSADA')}
        className={styles.btnReject}
        disabled={loading}
      >
        <X size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Recusar
      </button>
      <button
        onClick={() => handleAction('ACEITA')}
        className={styles.btnAccept}
        disabled={loading}
      >
        <Check size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Aceitar Troca
      </button>
    </div>
  );
}
