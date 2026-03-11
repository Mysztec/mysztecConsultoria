import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast'; // IMPORTAÇÃO AQUI

export default function Login() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('usuarioLogado');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('username', username)
      .eq('senha', senha)
      .single(); 

    if (error || !data) {
      toast.error('Usuário ou senha incorretos!'); // TROCADO AQUI
      return;
    }

    localStorage.setItem('usuarioLogado', JSON.stringify(data));

    if (data.perfil === 'admin') {
      navigate('/admin');
    } else if (data.perfil === 'conferencia') {
      navigate('/retirada');
    } else if (data.perfil === 'reserva') {
      navigate('/');
    } else {
      toast.error('Erro: Perfil desconhecido.'); // TROCADO AQUI
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', backgroundColor: 'var(--bg-body)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '50px 40px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '10px' }}>🥗 Marmita Control</h1>
        <p style={{ color: 'var(--accent-main)', marginBottom: '40px', fontSize: '1.1rem' }}>Faça login para continuar</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input 
            type="text" 
            placeholder="Nome de Usuário" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '15px 20px', borderRadius: '12px', border: '2px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontSize: '1.1rem' }}
            required
          />
          <input 
            type="password" 
            placeholder="Sua Senha" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ padding: '15px 20px', borderRadius: '12px', border: '2px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontSize: '1.1rem' }}
            required
          />
          <button type="submit" style={{ padding: '15px', backgroundColor: 'var(--accent-main)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>
            Entrar no Sistema
          </button>
        </form>
        
        <p style={{ color: 'var(--text-muted)', marginTop: '30px', fontSize: '0.9rem' }}>
          Dúvidas? Entre em contato com o Admin.
        </p>
      </div>
    </div>
  );
}