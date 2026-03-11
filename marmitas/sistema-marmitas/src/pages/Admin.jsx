import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export default function Admin() {
  const [abaAtiva, setAbaAtiva] = useState('funcionarios');
  const [funcionarios, setFuncionarios] = useState([]);
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [reservas, setReservas] = useState([]);
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (abaAtiva === 'funcionarios') {
      carregarFuncionarios();
    } else {
      carregarRelatorio();
    }
  }, [abaAtiva, dataFiltro]);

  const carregarFuncionarios = async () => {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome', { ascending: true });
    
    if (!error) {
      setFuncionarios(data);
    }
  };

  const cadastrarFuncionario = async (e) => {
    e.preventDefault();
    if (!nome || !pin) {
      toast.error("Preencha nome e PIN!");
      return;
    }

    const { error } = await supabase
      .from('funcionarios')
      .insert([{ nome, pin }]);

    if (error) {
      toast.error("Erro ao cadastrar funcionário.");
    } else {
      setNome('');
      setPin('');
      carregarFuncionarios();
      toast.success("Funcionário cadastrado com sucesso!");
    }
  };

  const alternarStatus = async (id, statusAtual) => {
    await supabase
      .from('funcionarios')
      .update({ ativo: !statusAtual })
      .eq('id', id);
    
    carregarFuncionarios();
    toast.success(statusAtual ? "Funcionário desativado!" : "Funcionário reativado!");
  };

  // 1. Função que realmente vai no banco apagar o funcionário
  const confirmarExclusao = async (id) => {
    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir funcionário.");
    } else {
      carregarFuncionarios();
      toast.success("Funcionário excluído permanentemente.");
    }
  };

  // 2. Nova função de Excluir que chama o Popup Customizado (sem window.confirm)
  const excluirFuncionario = (id, nomeFuncionario) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--danger-text)' }}>
          ⚠️ Atenção!
        </span>
        <span style={{ color: 'var(--text-main)' }}>
          Deseja EXCLUIR definitivamente <b>{nomeFuncionario}</b>?<br/>Isso apagará o histórico de marmitas.
        </span>
        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center', marginTop: '5px' }}>
          <button 
            onClick={() => {
              confirmarExclusao(id);
              toast.dismiss(t.id); // Fecha o popup
            }}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: 'var(--danger-bg)', 
              color: 'var(--danger-text)', 
              border: '1px solid var(--danger-text)', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold' 
            }}
          >
            Sim, Excluir
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} // Só fecha o popup sem fazer nada
            style={{ 
              padding: '8px 16px', 
              backgroundColor: 'var(--bg-body)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold' 
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity, // Faz o popup ficar na tela até a pessoa clicar em algum botão
      style: { minWidth: '320px', backgroundColor: 'var(--bg-card)' } 
    });
  };

  const carregarRelatorio = async () => {
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        id,
        data_reserva,
        retirou,
        funcionarios ( nome )
      `)
      .eq('data_reserva', dataFiltro);

    if (error) {
      console.error("Erro ao buscar relatório:", error);
    } else {
      setReservas(data);
    }
  };

  const totalMarmitas = reservas.length;

  const enviarWhatsApp = () => {
    if (totalMarmitas === 0) {
      toast.error("Não há reservas para enviar nesta data.");
      return;
    }
    const dataFormatada = dataFiltro.split('-').reverse().join('/');
    const texto = `Olá! Segue o fechamento de marmitas para hoje (${dataFormatada}):\n\n*Total a preparar/entregar:* ${totalMarmitas} marmitas.\n\nObrigado!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const imprimirRelatorio = () => { 
    window.print(); 
  };

  const TabBtn = ({ label, icon, value }) => (
    <button 
      onClick={() => setAbaAtiva(value)}
      style={{
        padding: '12px 24px', 
        border: 'none', 
        borderRadius: '12px', 
        cursor: 'pointer',
        fontSize: '1rem', 
        fontWeight: abaAtiva === value ? 'bold' : 'normal',
        backgroundColor: abaAtiva === value ? 'var(--accent-main)' : 'var(--bg-card)',
        color: abaAtiva === value ? 'white' : 'var(--text-main)',
        transition: 'all 0.2s',
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .sidebar { display: none !important; }
          .main-content { padding: 0 !important; background-color: white !important; }
          .print-card { box-shadow: none !important; padding: 0 !important; border: none !important; }
          body { color: black !important; }
        }
      `}</style>

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <div className="no-print" style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <TabBtn label="Gerenciar Funcionários" icon="👥" value="funcionarios" />
        <TabBtn label="Relatório de Reservas" icon="📊" value="relatorios" />
      </div>

      {/* ABA 1: FUNCIONÁRIOS */}
      {abaAtiva === 'funcionarios' && (
        <div className="print-card" style={{ 
          backgroundColor: 'var(--bg-card)', 
          padding: '30px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)' 
        }}>
          <h2 style={{ 
            borderBottom: '2px solid var(--border-color)', 
            paddingBottom: '15px', 
            color: 'var(--text-main)', 
            fontSize: '1.5rem', 
            marginBottom: '25px' 
          }}>
            Cadastrar Novo Funcionário
          </h2>
          
          <form onSubmit={cadastrarFuncionario} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px', 
            marginBottom: '40px' 
          }}>
            <input 
              type="text" 
              placeholder="Nome do Funcionário" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              style={{ 
                padding: '15px 20px', 
                borderRadius: '12px', 
                border: '2px solid var(--border-color)', 
                backgroundColor: 'var(--input-bg)', 
                color: 'var(--text-main)', 
                outline: 'none', 
                fontSize: '1.1rem' 
              }} 
            />
            <input 
              type="text" 
              placeholder="Senha (PIN) - máx 6" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              style={{ 
                padding: '15px 20px', 
                borderRadius: '12px', 
                border: '2px solid var(--border-color)', 
                backgroundColor: 'var(--input-bg)', 
                color: 'var(--text-main)', 
                outline: 'none', 
                fontSize: '1.1rem' 
              }} 
              maxLength={6} 
            />
            <button type="submit" style={{ 
              padding: '15px 20px', 
              backgroundColor: 'var(--accent-main)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '1.1rem', 
              transition: 'background-color 0.2s' 
            }}>
              Salvar
            </button>
          </form>

          <h3 style={{ color: 'var(--text-main)', marginBottom: '15px' }}>
            Lista de Funcionários
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header)', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-main)', fontSize: '1rem' }}>Nome</th>
                  <th style={{ padding: '16px', color: 'var(--text-main)', fontSize: '1rem' }}>PIN</th>
                  <th style={{ padding: '16px', color: 'var(--text-main)', fontSize: '1rem' }}>Status</th>
                  <th style={{ padding: '16px', color: 'var(--text-main)', fontSize: '1rem' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                      {f.nome}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                      {f.pin}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        backgroundColor: f.ativo ? 'var(--success-bg)' : 'var(--danger-bg)', 
                        color: f.ativo ? 'var(--success-text)' : 'var(--danger-text)', 
                        padding: '6px 12px', 
                        borderRadius: '24px', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem' 
                      }}>
                        {f.ativo ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => alternarStatus(f.id, f.ativo)} 
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: 'var(--bg-body)', 
                          color: 'var(--text-main)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '24px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold' 
                        }}
                      >
                        {f.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                      
                      {/* BOTÃO DE EXCLUIR */}
                      <button 
                        onClick={() => excluirFuncionario(f.id, f.nome)} 
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: 'var(--danger-bg)', 
                          color: 'var(--danger-text)', 
                          border: `1px solid var(--danger-text)`, 
                          borderRadius: '24px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold' 
                        }}
                        title="Excluir permanentemente"
                      >
                        🗑️ Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: RELATÓRIOS */}
      {abaAtiva === 'relatorios' && (
        <div className="print-card" style={{ 
          backgroundColor: 'var(--bg-card)', 
          padding: '30px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '2px solid var(--border-color)', 
            paddingBottom: '15px', 
            marginBottom: '25px' 
          }}>
            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>Histórico</h2>
            
            <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={imprimirRelatorio} 
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: 'var(--bg-body)', 
                  color: 'var(--text-main)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px' 
                }}
              >
                🖨️ PDF
              </button>
              
              <button 
                onClick={enviarWhatsApp} 
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: '#25D366', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px' 
                }}
              >
                🟢 WhatsApp
              </button>
            </div>
          </div>
          
          <div className="no-print" style={{ marginTop: '20px', marginBottom: '30px' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px', color: 'var(--accent-main)' }}>Filtrar Data:</label>
            <input 
              type="date" 
              value={dataFiltro} 
              onChange={(e) => setDataFiltro(e.target.value)} 
              style={{ 
                padding: '12px 18px', 
                borderRadius: '12px', 
                border: '2px solid var(--border-color)', 
                backgroundColor: 'var(--input-bg)', 
                color: 'var(--text-main)', 
                outline: 'none', 
                fontSize: '1rem' 
              }} 
            />
          </div>

          <div style={{ 
            backgroundColor: 'var(--table-header)', 
            padding: '25px', 
            borderRadius: '12px', 
            marginBottom: '30px', 
            border: '1px solid var(--border-color)', 
            textAlign: 'center' 
          }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              Período: <strong>{dataFiltro.split('-').reverse().join('/')}</strong>
            </p>
            <h3 style={{ margin: '10px 0 0 0', color: 'var(--text-main)', fontSize: '2rem' }}>
              Total: <strong style={{color: 'var(--accent-main)'}}>{totalMarmitas}</strong> marmitas
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header)', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-main)', fontSize: '1rem' }}>Funcionário</th>
                  <th style={{ padding: '16px', color: 'var(--text-main)', fontSize: '1rem' }}>Status</th>
                  <th className="no-print" style={{ padding: '16px', color: 'var(--text-main)', fontSize: '1rem' }}>Cobrança?</th>
                </tr>
              </thead>
              <tbody>
                {reservas.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma reserva nesta data.
                    </td>
                  </tr>
                ) : (
                  reservas.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                        {r.funcionarios?.nome}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {r.retirou 
                          ? <span style={{ 
                              backgroundColor: 'var(--success-bg)', 
                              color: 'var(--success-text)', 
                              padding: '6px 12px', 
                              borderRadius: '24px', 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem' 
                            }}>
                              ✅ Entregue
                            </span> 
                          : <span style={{ 
                              backgroundColor: 'var(--warning-bg)', 
                              color: 'var(--warning-text)', 
                              padding: '6px 12px', 
                              borderRadius: '24px', 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem' 
                            }}>
                              ⏳ Pendente
                            </span>
                        }
                      </td>
                      <td className="no-print" style={{ padding: '16px' }}>
                        {(!r.retirou && dataFiltro < new Date().toISOString().split('T')[0]) 
                          ? <span style={{ color: 'var(--danger-text)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              Sim (Descontar)
                            </span> 
                          : '-'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}