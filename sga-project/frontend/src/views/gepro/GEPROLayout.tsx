import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',      path: '/gepro/dashboard' },
  { label: 'Demandas',       path: '/gepro/demandas' },
  { label: 'Meus Processos', path: '/gepro/meus-processos' },
  { label: 'Relatórios',     path: '/gepro/relatorios' },
];

const ADMIN_NAV_ITEMS = [
  { label: 'Usuários',      path: '/gepro/usuarios' },
  { label: 'Fornecedores',  path: '/gepro/fornecedores' },
  { label: 'Configurações', path: '/gepro/configuracoes' },
];

export default function GEPROLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 200,
        background: '#1e3a8a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 1000,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 24px', fontSize: 18, fontWeight: 700, letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          GEPRO
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, paddingTop: 16 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ padding: '8px 20px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.6px' }}>
              Menu Principal
            </li>
            {NAV_ITEMS.map(({ label, path }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  style={({ isActive }) => ({
                    display: 'block',
                    padding: '11px 20px',
                    fontSize: 13,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    borderLeft: isActive ? '3px solid #fbbf24' : '3px solid transparent',
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                  })}
                >
                  {label}
                </NavLink>
              </li>
            ))}

            {user?.role === 'admin' && (
              <>
                <li style={{ padding: '16px 20px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.6px' }}>
                  Administração
                </li>
                {ADMIN_NAV_ITEMS.map(({ label, path }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      style={({ isActive }) => ({
                        display: 'block',
                        padding: '11px 20px',
                        fontSize: 13,
                        color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
                        textDecoration: 'none',
                        borderLeft: isActive ? '3px solid #fbbf24' : '3px solid transparent',
                        background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                      })}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* User info + logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.full_name ?? user?.username ?? 'Usuário'}
          </p>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '8px 0', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div style={{ marginLeft: 200, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Banner de ambiente (apenas em desenvolvimento) */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={{
            background: '#fbbf24',
            padding: '8px 30px',
            fontSize: 11,
            fontWeight: 600,
            color: '#78350f',
            borderBottom: '1px solid #f59e0b',
            textAlign: 'center',
          }}>
            AMBIENTE DE HOMOLOGAÇÃO — DADOS FICTÍCIOS
          </div>
        )}

        <main style={{ flex: 1, background: '#f5f7fa', padding: 30, minHeight: '100vh' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
