import React, { useState, useEffect, useMemo } from 'react';
import * as geproService from '../../services/geproService';

// ── helpers ───────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  necessidade_rascunho:               'Rascunho',
  necessidade_aprovada:               'Nec. Aprovada',
  instrucao_rascunho:                 'Instrução Técnica',
  encaminhamento_aguardando_juridico: 'Em Análise (GPOT)',
  agendamento_pendente:               'Ag. Pendente',
  agendamento_confirmado:             'Ag. Confirmado',
  recebimento_provisorio:             'Recebimento',
  recebimento_testado_conforme:       'Testado OK',
  recebimento_rejeitado:              'Rejeitado',
  encerramento_pagamento_realizado:   'Pago',
  encerramento_finalizado:            'Finalizado',
};

const STATUS_COLOR: Record<string, string> = {
  necessidade_rascunho:               '#9ca3af',
  necessidade_aprovada:               '#34d399',
  instrucao_rascunho:                 '#60a5fa',
  encaminhamento_aguardando_juridico: '#fbbf24',
  agendamento_pendente:               '#f97316',
  agendamento_confirmado:             '#10b981',
  recebimento_provisorio:             '#6366f1',
  recebimento_testado_conforme:       '#059669',
  recebimento_rejeitado:              '#ef4444',
  encerramento_pagamento_realizado:   '#0ea5e9',
  encerramento_finalizado:            '#1e3a8a',
};

const MODALIDADE_LABEL: Record<string, string> = {
  pregao:             'Pregão',
  concorrencia:       'Concorrência',
  ata_registro_precos:'Ata Reg. Preços',
  srp:                'SRP',
  convite:            'Convite',
};

const MODALIDADE_COLOR: Record<string, string> = {
  pregao:             '#1e3a8a',
  concorrencia:       '#7c3aed',
  ata_registro_precos:'#0891b2',
  srp:                '#d97706',
  convite:            '#be185d',
};

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

// ── styles ────────────────────────────────────────────────────

const S = {
  card: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: '20px 24px',
  } as React.CSSProperties,
  section: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    color: '#6b7280',
    padding: '14px 20px',
    borderBottom: '1px solid #f3f4f6',
  },
  th: {
    padding: '10px 16px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px 16px',
    fontSize: 13,
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
  },
};

// ── SVG Bar Chart ─────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 520, H = 160, PB = 30, PT = 10, PL = 10, PR = 10;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor(chartW / data.length) - 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {/* grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PT + chartH * (1 - t);
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f3f4f6" strokeWidth={1} />
            <text x={PL - 2} y={y + 3} fontSize={8} fill="#9ca3af" textAnchor="end">
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {/* bars */}
      {data.map((d, i) => {
        const barH = (d.value / max) * chartH;
        const x = PL + i * (chartW / data.length) + 3;
        const y = PT + chartH - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={2} fill="#1e3a8a" opacity={0.85} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 3} fontSize={9} fill="#374151" textAnchor="middle">
                {d.value}
              </text>
            )}
            <text x={x + barW / 2} y={H - 4} fontSize={9} fill="#6b7280" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Horizontal Bar Row ────────────────────────────────────────

function HBarRow({ label, value, total, color, sublabel }: {
  label: string; value: number; total: number; color: string; sublabel?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
          {sublabel ?? value} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 7, background: '#f3f4f6', borderRadius: 4 }}>
        <div style={{ height: 7, width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────

function KPICard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${accent ?? '#1e3a8a'}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const BADGES: Record<string, { label: string; bg: string; color: string }> = {
    necessidade_rascunho:               { label: 'Rascunho',      bg: '#f3f4f6', color: '#374151' },
    necessidade_aprovada:               { label: 'Aprovada',      bg: '#d1fae5', color: '#065f46' },
    instrucao_rascunho:                 { label: 'Instrução',     bg: '#dbeafe', color: '#1e40af' },
    encaminhamento_aguardando_juridico: { label: 'Encaminhada',   bg: '#fef3c7', color: '#92400e' },
    agendamento_pendente:               { label: 'Ag. Pendente',  bg: '#fef3c7', color: '#92400e' },
    agendamento_confirmado:             { label: 'Ag. Confirmado',bg: '#d1fae5', color: '#065f46' },
    recebimento_provisorio:             { label: 'Recebimento',   bg: '#dbeafe', color: '#1e40af' },
    recebimento_testado_conforme:       { label: 'Testado OK',    bg: '#d1fae5', color: '#065f46' },
    recebimento_rejeitado:              { label: 'Rejeitado',     bg: '#fee2e2', color: '#991b1b' },
    encerramento_pagamento_realizado:   { label: 'Pago',          bg: '#d1fae5', color: '#065f46' },
    encerramento_finalizado:            { label: 'Finalizado',    bg: '#1e3a8a', color: 'white'   },
  };
  const b = BADGES[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: b.bg, color: b.color }}>
      {b.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function RelatoriosPage() {
  const [demandas, setDemandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    geproService.listarDemandas()
      .then((data: any) => setDemandas(Array.isArray(data) ? data : data?.rows ?? []))
      .catch(() => setDemandas([]))
      .finally(() => setLoading(false));
  }, []);

  // ── computações ──────────────────────────────────────────────

  const total = demandas.length;

  const emAndamento = useMemo(() =>
    demandas.filter(d => !['necessidade_rascunho', 'encerramento_finalizado'].includes(d.status)).length,
    [demandas]);

  const concluidas = useMemo(() =>
    demandas.filter(d => d.status === 'encerramento_finalizado').length,
    [demandas]);

  const valorTotal = useMemo(() =>
    demandas.reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0),
    [demandas]);

  // Demandas por mês (últimos 6 meses)
  const monthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = MONTH_LABELS[d.getMonth()];
      const count = demandas.filter(dem => {
        if (!dem.data_criacao) return false;
        const dt = new Date(dem.data_criacao);
        return dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth();
      }).length;
      months.push({ label, value: count });
    }
    return months;
  }, [demandas]);

  // Por modalidade
  const modalidadeData = useMemo(() => {
    const counts: Record<string, number> = {};
    demandas.forEach(d => { counts[d.modalidade_licitatoria] = (counts[d.modalidade_licitatoria] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [demandas]);

  // Por status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    demandas.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [demandas]);

  // Top equipamentos (por quantidade total de itens)
  const equipData = useMemo(() => {
    const counts: Record<string, number> = {};
    demandas.forEach(d => {
      if (d.tipo_equipamento) counts[d.tipo_equipamento] = (counts[d.tipo_equipamento] || 0) + (Number(d.quantidade) || 1);
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [demandas]);

  const maxEquip = equipData[0]?.[1] ?? 1;

  // Últimas 10 demandas (por data de criação desc)
  const ultimas = useMemo(() =>
    [...demandas].sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()).slice(0, 10),
    [demandas]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Carregando relatório…</div>;
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>Relatório Geral de Aquisições</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Lei 14.133/2021 · Atualizado em {now.toLocaleDateString('pt-BR')} às {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: '#374151' }}>{total} demandas</div>
          <div>no período</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <KPICard label="Total de Demandas" value={String(total)} sub="desde o início do sistema" accent="#1e3a8a" />
        <KPICard label="Em Andamento" value={String(emAndamento)} sub="demandas ativas" accent="#f59e0b" />
        <KPICard label="Concluídas" value={String(concluidas)} sub="encerradas definitivamente" accent="#10b981" />
        <KPICard label="Valor Total Estimado" value={fmtCurrency(valorTotal)} sub="soma dos valores estimados" accent="#6366f1" />
      </div>

      {/* Linha 2: Evolução mensal + Modalidade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        <div style={S.section}>
          <div style={S.sectionTitle}>Demandas por Mês (últimos 6 meses)</div>
          <div style={{ padding: '16px 20px 8px' }}>
            <BarChart data={monthlyData} />
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Distribuição por Modalidade Licitatória</div>
          <div style={{ padding: '20px 24px' }}>
            {modalidadeData.map(([mod, count]) => (
              <HBarRow
                key={mod}
                label={MODALIDADE_LABEL[mod] ?? mod}
                value={count}
                total={total}
                color={MODALIDADE_COLOR[mod] ?? '#6b7280'}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Linha 3: Status + Equipamentos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        <div style={S.section}>
          <div style={S.sectionTitle}>Status das Demandas</div>
          <div style={{ padding: '20px 24px' }}>
            {statusData.map(([status, count]) => (
              <HBarRow
                key={status}
                label={STATUS_LABEL[status] ?? status}
                value={count}
                total={total}
                color={STATUS_COLOR[status] ?? '#9ca3af'}
              />
            ))}
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Equipamentos mais Demandados (por unidades)</div>
          <div style={{ padding: '20px 24px' }}>
            {equipData.map(([tipo, qtd]) => (
              <HBarRow
                key={tipo}
                label={tipo}
                value={qtd}
                total={maxEquip}
                color="#0891b2"
                sublabel={`${qtd} un.`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Linha 4: Resumo por fase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { fase: 'Fase 1 — Necessidade', statuses: ['necessidade_rascunho','necessidade_aprovada'], color: '#9ca3af' },
          { fase: 'Fase 2 — Instrução',   statuses: ['instrucao_rascunho'],                          color: '#60a5fa' },
          { fase: 'Fase 3 — GPOT/NE',     statuses: ['encaminhamento_aguardando_juridico'],           color: '#fbbf24' },
          { fase: 'Fase 4 — Recebimento', statuses: ['agendamento_pendente','agendamento_confirmado','recebimento_provisorio','recebimento_testado_conforme'], color: '#34d399' },
          { fase: 'Fase 5 — Encerramento',statuses: ['encerramento_pagamento_realizado','encerramento_finalizado'], color: '#1e3a8a' },
        ].map(({ fase, statuses, color }) => {
          const count = demandas.filter(d => statuses.includes(d.status)).length;
          return (
            <div key={fase} style={{ ...S.card, borderLeft: `4px solid ${color}`, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8, letterSpacing: '0.4px' }}>{fase}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>{count}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>demandas</div>
            </div>
          );
        })}
      </div>

      {/* Linha 5: Últimas demandas */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Últimas 10 Demandas</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Número</th>
              <th style={S.th}>Título</th>
              <th style={S.th}>Equipamento</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Valor Estimado</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Data</th>
            </tr>
          </thead>
          <tbody>
            {ultimas.map((d: any) => (
              <tr key={d.id}>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#1e3a8a' }}>{d.numero_demanda}</td>
                <td style={{ ...S.td, maxWidth: 260 }}>
                  <div style={{ fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{d.titulo}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.setor_solicitante}</div>
                </td>
                <td style={{ ...S.td, fontSize: 12 }}>{d.tipo_equipamento} × {d.quantidade}</td>
                <td style={{ ...S.td, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{fmtCurrency(Number(d.valor_estimado) || 0)}</td>
                <td style={S.td}><StatusBadge status={d.status} /></td>
                <td style={{ ...S.td, fontSize: 12, color: '#6b7280' }}>{fmtDate(d.data_criacao)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
