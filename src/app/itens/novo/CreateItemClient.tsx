'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Sparkles } from 'lucide-react';
import styles from '../../auth.module.css';

export default function CreateItemClient({
  categories,
}: {
  categories: Array<{ id_categoria: number; nome: string }>;
}) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState(categories[0]?.id_categoria || '');
  const [estadoConservacao, setEstadoConservacao] = useState('Como Novo');
  const [fotoItem, setFotoItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/itens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          descricao,
          id_categoria: Number(categoriaId),
          estado_conservacao: estadoConservacao,
          foto_item: fotoItem || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar item');
        setLoading(false);
        return;
      }

      router.push('/discover');
      router.refresh();
    } catch {
      setError('Falha de conexão com o servidor');
      setLoading(false);
    }
  }

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard} style={{ maxWidth: '640px' }}>
        <div className={styles.headerArea}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: '#FFF4E5', color: '#FF9F1C', borderRadius: '50%', marginBottom: '1rem' }}>
            <PlusCircle size={32} />
          </div>
          <h1 className={styles.title}>Anunciar Item para Troca</h1>
          <p className={styles.subtitle}>Cadastre o que você não usa mais e encontre novos interessados</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Título do Objeto</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: Livro Clean Architecture, Guitarra Acústica..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Categoria</label>
              <select
                className={styles.input}
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                required
              >
                {categories.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Estado de Conservação</label>
              <select
                className={styles.input}
                value={estadoConservacao}
                onChange={(e) => setEstadoConservacao(e.target.value)}
                required
              >
                <option value="Novo">Novo (na caixa/etiqueta)</option>
                <option value="Como Novo">Como Novo (pouquíssimo uso)</option>
                <option value="Bom">Bom (funciona perfeitamente)</option>
                <option value="Marcas de Uso">Marcas de Uso (pequenos detalhes)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descrição Detalhada</label>
            <textarea
              className={styles.input}
              rows={4}
              placeholder="Descreva as características, tempo de uso e possíveis preferências de troca..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>URL da Foto do Item</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://exemplo.com/foto-do-item.jpg (deixe em branco para imagem padrão)"
              value={fotoItem}
              onChange={(e) => setFotoItem(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <Sparkles size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            {loading ? 'Publicando...' : 'Publicar Anúncio de Troca'}
          </button>
        </form>
      </div>
    </div>
  );
}
