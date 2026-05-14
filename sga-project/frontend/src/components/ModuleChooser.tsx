import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ModuleChooser() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{
        width: 200,
        background: '#1e3a8a',
        color: 'white',
        position: 'fixed',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>SGA</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>SISTEMA DE GESTÃO</div>
        </div>
        <div style={{ position: 'absolute', bottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            {user?.full_name ?? user?.username}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 11,
              padding: '6px 14px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Header */}
      {process.env.NODE_ENV !== 'production' && (
        <header style={{
          position: 'fixed',
          top: 0,
          left: 200,
          right: 0,
          height: 60,
          background: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          padding: '0 30px',
          zIndex: 100,
          fontSize: 12,
          fontWeight: 500,
          color: '#78350f',
          borderBottom: '1px solid #f59e0b',
          gap: 8,
        }}>
          ⚠️ ATENÇÃO: AMBIENTE DE HOMOLOGAÇÃO — DADOS FICTÍCIOS. NÃO AFETA A PRODUÇÃO.
        </header>
      )}

      {/* Main */}
      <main style={{
        marginLeft: 200,
        marginTop: process.env.NODE_ENV !== 'production' ? 60 : 0,
        flex: 1,
        padding: '60px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f7fa',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 860, width: '100%' }}>

          <h1 style={{ fontSize: 40, fontWeight: 700, color: '#1e3a8a', marginBottom: 10 }}>
            Bem-vindo ao Sistema de Gestão
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 50 }}>
            Escolha qual sistema você deseja acessar
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 40 }}>

            {/* SGA */}
            <div
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                padding: 40,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#1e3a8a';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(30,58,138,0.15)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 20 }}>📦</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>SGA</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Sistema de Gestão de Ativos</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
                Rastreie patrimônio, movimentações e histórico de ativos
              </div>
              <button
                style={{
                  padding: '10px 24px',
                  background: '#1e3a8a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Entrar no SGA
              </button>
            </div>

            {/* GEPRO */}
            <div
              onClick={() => navigate('/gepro/dashboard')}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                padding: 40,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#1e3a8a';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(30,58,138,0.15)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>GEPRO</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Gestão de Aquisições</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
                Acompanhe licitações desde a necessidade até a entrega — Lei 14.133/2021
              </div>
              <button
                style={{
                  padding: '10px 24px',
                  background: '#1e3a8a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Entrar no GEPRO
              </button>
            </div>

          </div>

          <div style={{ fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
            Lei 14.133/2021 • Sistema de Gestão Governamental • v2.0
          </div>

        </div>
      </main>
    </div>
  );
}
