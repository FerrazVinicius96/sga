import React, { useState, useEffect } from 'react';
import * as geproService from '../../services/geproService';

const S = {
  th: { padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.4px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '13px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151' },
  input: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: 'white', boxSizing: 'border-box' as const },
};

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    geproService.getFornecedores()
      .then((data: any) => setFornecedores(Array.isArray(data) ? data : []))
      .catch(() => setFornecedores([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = fornecedores.filter(f => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return f.nome?.toLowerCase().includes(q) || f.cnpj?.includes(q) || f.cidade?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Fornecedores</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{fornecedores.length} fornecedores cadastrados</p>
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <input style={{ ...S.input, width: 300 }} placeholder="Buscar por nome, CNPJ ou cidade…" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Razão Social</th>
              <th style={S.th}>CNPJ</th>
              <th style={S.th}>Contato</th>
              <th style={S.th}>Cidade</th>
              <th style={S.th}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#9ca3af' }}>Carregando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#9ca3af' }}>Nenhum fornecedor encontrado.</td></tr>
            ) : filtered.map((f: any) => (
              <tr key={f.id}>
                <td style={S.td}><div style={{ fontWeight: 600, color: '#111827' }}>{f.nome}</div></td>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{f.cnpj}</td>
                <td style={S.td}>
                  <div style={{ fontSize: 12 }}>{f.telefone ?? '—'}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.email ?? ''}</div>
                </td>
                <td style={{ ...S.td, fontSize: 12 }}>{f.cidade ?? '—'}</td>
                <td style={S.td}>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: f.ativo ? '#d1fae5' : '#fee2e2', color: f.ativo ? '#065f46' : '#991b1b' }}>
                    {f.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
