'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Ban } from 'lucide-react';
import styles from './trocas.module.css';

interface TradeActionsProps {
  tradeId: number;
  isProposer?: boolean;
}

export default function TradeActions({ tradeId, isProposer = false }: TradeActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(status: 'ACEITA' | 'RECUSADA' | 'CANCELADA') {
    setLoading(true);
    try {
      const res = await fetch(`/api/trocas/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Falha ao atualizar troca');
      } else {
        router.refresh();
      }
    } catch {
      alert('Falha ao comunicar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  if (isProposer) {
    return (
      <div className={styles.actions}>
        <button
          onClick={() => handleAction('CANCELADA')}
          className={styles.btnCancel}
          disabled={loading}
          title="Cancelar proposta enviada"
        >
          <Ban size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Cancelar Proposta
        </button>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      <button
        onClick={() => handleAction('RECUSADA')}
        className={styles.btnReject}
        disabled={loading}
      >
        <X size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
        Recusar
      </button>
      <button
        onClick={() => handleAction('ACEITA')}
        className={styles.btnAccept}
        disabled={loading}
      >
        <Check size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
        Aceitar Troca
      </button>
    </div>
  );
}
