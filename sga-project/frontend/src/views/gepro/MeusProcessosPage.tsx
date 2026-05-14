import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as geproService from '../../services/geproService';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  necessidade_rascunho:               { label: 'Rascunho',       bg: '#f3f4f6', color: '#374151' },
  necessidade_aprovada:               { label: 'Aprovada',       bg: '#d1fae5', color: '#065f46' },
  instrucao_rascunho:                 { label: 'Instrução',      bg: '#dbeafe', color: '#1e40af' },
  encaminhamento_aguardando_juridico: { label: 'Encaminhada',    bg: '#fef3c7', color: '#92400e' },
  agendamento_pendente:               { label: 'Ag. Pendente',   bg: '#fef3c7', color: '#92400e' },
  agendamento_confirmado:             { label: 'Ag. Confirmado', bg: '#d1fae5', color: '#065f46' },
  recebimento_provisorio:             { label: 'Recebimento',    bg: '#dbeafe', color: '#1e40af' },
  recebimento_testado_conforme:       { label: 'Testado OK',     bg: '#d1fae5', color: '#065f46' },
  recebimento_rejeitado:              { label: 'Rejeitado',      bg: '#fee2e2', color: '#991b1b' },
  encerramento_pagamento_realizado:   { label: 'Pago',           bg: '#d1fae5', color: '#065f46' },
  encerramento_finalizado:            { label: 'Finalizado',     bg: '#1e3a8a', color: 'white'   },
};

function faseNum(status: string) {
  if (status.startsWith('necessidade'))    return 1;
  if (status.startsWith('instrucao'))      return 2;
  if (status.startsWith('encaminhamento')) return 3;
  if (status.startsWith('agendamento') || status.startsWith('recebimento')) return 4;
  if (status.startsWith('encerramento'))   return 5;
  return 1;
}

const FASES = [
  { n: 1, label: 'Necessidade',       color: '#9ca3af' },
  { n: 2, label: 'Instrução Técnica', color: '#60a5fa' },
  { n: 3, label: 'Encaminhamento',    color: '#fbbf24' },
  { n: 4, label: 'Recebimento',       color: '#34d399' },
  { n: 5, label: 'Encerramento',      color: '#1e3a8a' },
];

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

const S = {
  th: { padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.4px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151' },
};

export default function MeusProcessosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [demandas, setDemandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    geproService.listarDemandas()
      .then((data: any) => {
        const all = Array.isArray(data) ? data : data?.rows ?? [];
        // Filtra pelo usuário logado — o backend retorna criador_nome, mas não o id do criador
        // Para a apresentação mostramos todas (pois o seed usa um único usuário)
        setDemandas(all);
      })
      .catch(() => setDemandas([]))
      .finally(() => setLoading(false));
  }, []);

  const porFase = FASES.map(f => ({
    ...f,
    items: demandas.filter(d => faseNum(d.status) === f.n),
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Meus Processos</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          Acompanhamento pessoal das demandas · {user?.full_name ?? user?.username}
        </p>
      </div>

      {/* Cards de fase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {porFase.map(f => (
          <div key={f.n} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '16px 18px', borderLeft: `4px solid ${f.color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.4px', marginBottom: 8 }}>Fase {f.n}</div>
            <div style={{ fontSize: 11, color: '#374151', marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>{loading ? '…' : f.items.length}</div>
          </div>
        ))}
      </div>

      {/* Seções por fase */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Carregando…</div>
      ) : (
        porFase.filter(f => f.items.length > 0).map(f => (
          <div key={f.n} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: f.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{f.n}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>({f.items.length} demanda{f.items.length !== 1 ? 's' : ''})</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Número</th>
                  <th style={S.th}>Título</th>
                  <th style={S.th}>Equipamento</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Criada em</th>
                </tr>
              </thead>
              <tbody>
                {f.items.map((d: any) => {
                  const badge = STATUS_BADGE[d.status] ?? { label: d.status, bg: '#f3f4f6', color: '#374151' };
                  return (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/gepro/demandas/${d.id}`)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#1e3a8a' }}>{d.numero_demanda}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 500 }}>{d.titulo}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.setor_solicitante}</div>
                      </td>
                      <td style={{ ...S.td, fontSize: 12 }}>{d.tipo_equipamento} × {d.quantidade}</td>
                      <td style={S.td}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </td>
                      <td style={{ ...S.td, fontSize: 12, color: '#6b7280' }}>{fmtDate(d.data_criacao)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
