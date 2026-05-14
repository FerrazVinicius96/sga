import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function EmConstrucao() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>Página em construção</h2>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280' }}>Esta funcionalidade ainda não foi implementada.</p>
      <p style={{ margin: '0 0 28px', fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{pathname}</p>
      <button
        onClick={() => navigate(-1)}
        style={{ padding: '9px 20px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        ← Voltar
      </button>
    </div>
  );
}
