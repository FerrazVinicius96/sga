import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  admin:    { label: 'Administrador', bg: '#1e3a8a', color: 'white'   },
  manager:  { label: 'Gestor',        bg: '#7c3aed', color: 'white'   },
  advisor:  { label: 'Analista TI',   bg: '#0891b2', color: 'white'   },
  basic:    { label: 'Solicitante',   bg: '#d1fae5', color: '#065f46' },
  operator: { label: 'Operador',      bg: '#fef3c7', color: '#92400e' },
};

const S = {
  th: { padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.4px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '13px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151' },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: 'white' },
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroRole, setFiltroRole] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users ?? [])).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    if (filtroRole && u.role !== filtroRole) return false;
    if (filtroAtivo === 'ativo' && !u.is_active) return false;
    if (filtroAtivo === 'inativo' && u.is_active) return false;
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Usuários</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{users.length} usuários cadastrados no sistema</p>
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          <select style={S.select} value={filtroRole} onChange={e => setFiltroRole(e.target.value)}>
            <option value="">Todos os perfis</option>
            {Object.entries(ROLE_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select style={S.select} value={filtroAtivo} onChange={e => setFiltroAtivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Nome</th>
              <th style={S.th}>Username / Email</th>
              <th style={S.th}>Perfil</th>
              <th style={S.th}>Cargo</th>
              <th style={S.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#9ca3af' }}>Carregando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#9ca3af' }}>Nenhum usuário encontrado.</td></tr>
            ) : filtered.map((u: any) => {
              const badge = ROLE_BADGE[u.role] ?? { label: u.role, bg: '#f3f4f6', color: '#374151' };
              return (
                <tr key={u.id}>
                  <td style={S.td}><div style={{ fontWeight: 600, color: '#111827' }}>{u.full_name}</div></td>
                  <td style={S.td}>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>{u.username}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                  </td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </td>
                  <td style={{ ...S.td, fontSize: 12, color: '#6b7280' }}>{u.job_title ?? '—'}</td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: u.is_active ? '#d1fae5' : '#fee2e2', color: u.is_active ? '#065f46' : '#991b1b' }}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
