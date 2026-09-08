'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCepBlur() {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setLogradouro(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setUf(data.uf || '');
        } else {
          setError('CEP não encontrado na base do ViaCEP.');
        }
      } catch {
        setError('Não foi possível consultar o CEP automaticamente.');
      } finally {
        setLoadingCep(false);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senha,
          cep,
          logradouro,
          bairro,
          cidade,
          uf,
          foto_perfil: fotoPerfil,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao realizar cadastro');
        setLoading(false);
        return;
      }

      router.push('/discover');
      router.refresh();
    } catch {
      setError('Falha de comunicação com o servidor.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <div className={styles.headerArea}>
          <Image
            src="/images/logotipo.png"
            alt="ReUse!"
            width={140}
            height={45}
            className={styles.logo}
            priority
          />
          <h1 className={styles.title}>Crie sua conta</h1>
          <p className={styles.subtitle}>Junte-se à comunidade sustentável de trocas</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome Completo</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: João da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>E-mail</label>
              <input
                type="email"
                className={styles.input}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Senha (mín. 6 chars)</label>
              <input
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                CEP {loadingCep && <span style={{ color: '#FF9F1C' }}>(buscando...)</span>}
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="00000-000"
                maxLength={9}
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={handleCepBlur}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Bairro</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Logradouro</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Rua, Avenida, etc."
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Cidade</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>UF</label>
              <input
                type="text"
                className={styles.input}
                placeholder="SP"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>URL da Foto de Perfil (Opcional)</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://exemplo.com/minha-foto.jpg"
              value={fotoPerfil}
              onChange={(e) => setFotoPerfil(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <div className={styles.switchLink}>
          Já possui conta? <Link href="/login">Faça Login</Link>
        </div>
      </div>
    </div>
  );
}
