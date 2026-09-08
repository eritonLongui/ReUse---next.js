'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft } from 'lucide-react';
import styles from './itemDetail.module.css';

export default function ProposalForm({
  itemDesejadoId,
  myItems,
}: {
  itemDesejadoId: number;
  myItems: Array<{ id_item: number; nome: string }>;
}) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(myItems[0]?.id_item || '');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/trocas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_item_desejado: itemDesejadoId,
          id_item_ofertado: Number(selectedItem),
          mensagem,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar proposta');
        setLoading(false);
        return;
      }

      router.push('/trocas');
      router.refresh();
    } catch {
      setError('Falha de conexão com o servidor');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePropose} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <h3 className={styles.proposalTitle}>Propor uma Troca</h3>

      {error && <div style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>}

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
          Qual dos seus itens você oferece?
        </label>
        <select
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
          required
          style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
        >
          {myItems.map((it) => (
            <option key={it.id_item} value={it.id_item}>
              {it.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
          Mensagem para o dono (opcional)
        </label>
        <input
          type="text"
          placeholder="Ex: Olá! Meu item está em ótimo estado e moro perto..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
      </div>

      <button type="submit" className={styles.btnProposta} disabled={loading}>
        <ArrowRightLeft size={18} /> {loading ? 'Enviando...' : 'Confirmar Proposta de Troca'}
      </button>
    </form>
  );
}
