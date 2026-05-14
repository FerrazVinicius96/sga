import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as geproService from '../../services/geproService';
import { useAuth } from '../../contexts/AuthContext';

// ── helpers ──────────────────────────────────────────────────────────────────

const MODALIDADES = [
  { value: 'pregao',             label: 'Pregão' },
  { value: 'concorrencia',       label: 'Concorrência' },
  { value: 'srp',                label: 'SRP' },
  { value: 'convite',            label: 'Convite' },
  { value: 'ata_registro_precos',label: 'Ata de Registro de Preços' },
];

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  necessidade_rascunho:               { label: 'Rascunho',          bg: '#f3f4f6', color: '#374151' },
  necessidade_aprovada:               { label: 'Aprovada',          bg: '#d1fae5', color: '#065f46' },
  instrucao_rascunho:                 { label: 'Instrução',         bg: '#dbeafe', color: '#1e40af' },
  instrucao_aprovada_gestor:          { label: 'Instr. Aprovada',   bg: '#d1fae5', color: '#065f46' },
  instrucao_rejeitada_gestor:         { label: 'Instr. Rejeitada',  bg: '#fee2e2', color: '#991b1b' },
  encaminhamento_aguardando_juridico: { label: 'Encaminhada',       bg: '#fef3c7', color: '#92400e' },
  encaminhamento_aprovado_juridico:   { label: 'Enc. Aprovada',     bg: '#d1fae5', color: '#065f46' },
  encaminhamento_rejeitado_juridico:  { label: 'Enc. Rejeitada',    bg: '#fee2e2', color: '#991b1b' },
  agendamento_pendente:               { label: 'Ag. Pendente',      bg: '#fef3c7', color: '#92400e' },
  agendamento_confirmado:             { label: 'Ag. Confirmado',    bg: '#d1fae5', color: '#065f46' },
  recebimento_provisorio:             { label: 'Recebimento',       bg: '#dbeafe', color: '#1e40af' },
  recebimento_testado_conforme:       { label: 'Testado OK',        bg: '#d1fae5', color: '#065f46' },
  recebimento_rejeitado:              { label: 'Rejeitado',         bg: '#fee2e2', color: '#991b1b' },
  encerramento_pagamento_realizado:   { label: 'Pago',              bg: '#d1fae5', color: '#065f46' },
  encerramento_finalizado:            { label: 'Finalizado',        bg: '#1e3a8a', color: 'white'   },
};

function statusBadge(status: string) {
  const s = STATUS_BADGE[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function fmtCurrency(v: unknown) {
  if (v == null) return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

// ── style constants ───────────────────────────────────────────────────────────
const S = {
  card: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, padding: 20, textAlign: 'center' as const },
  section: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 24, overflow: 'hidden' },
  sectionHeader: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, color: '#1e3a8a', letterSpacing: '0.5px' },
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.5px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' },
  td: { padding: '13px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#4b5563' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: 'white', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical' as const, minHeight: 80, boxSizing: 'border-box' as const },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase' as const },
  formGroup: { marginBottom: 14 } as React.CSSProperties,
  btnPrimary: { padding: '9px 16px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btn: { padding: '9px 16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnSuccess: { padding: '9px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { padding: '9px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
};

// ── Modal Nova Demanda ────────────────────────────────────────────────────────

const FORM_EMPTY = { titulo: '', descricao: '', tipo_equipamento: '', quantidade: '', valor_estimado: '', modalidade_licitatoria: '', setor_solicitante: '', data_necessidade_prevista: '', aquisicao_emergencial: false, justificativa_emergencial: '' };

function NovaDemandaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(FORM_EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.titulo.trim()) { setError('Título é obrigatório.'); return; }
    if (form.descricao.trim().length < 50) { setError(`Descrição muito curta: ${form.descricao.trim().length}/50 caracteres.`); return; }
    if (!form.tipo_equipamento.trim()) { setError('Tipo de equipamento é obrigatório.'); return; }
    if (!form.quantidade || Number(form.quantidade) <= 0) { setError('Quantidade deve ser maior que zero.'); return; }
    if (!form.valor_estimado || Number(form.valor_estimado) <= 0) { setError('Valor estimado deve ser maior que zero.'); return; }
    if (!form.modalidade_licitatoria) { setError('Selecione a modalidade de licitação.'); return; }
    if (form.aquisicao_emergencial && !form.justificativa_emergencial.trim()) { setError('Justificativa de emergência é obrigatória.'); return; }

    setSaving(true);
    setError(null);
    try {
      await geproService.criarDemanda({
        ...form,
        quantidade: Number(form.quantidade),
        valor_estimado: Number(form.valor_estimado),
        aquisicao_emergencial: Boolean(form.aquisicao_emergencial),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar demanda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 4, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>Nova Demanda</span>
          <button onClick={onClose} style={{ ...S.btn, padding: '4px 10px' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13, marginBottom: 14 }}>{error}</div>}

          <div style={S.formGroup}>
            <label style={S.label}>Título *</label>
            <input style={S.input} value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Título da demanda" />
          </div>

          <div style={S.formGroup}>
            <label style={{ ...S.label, display: 'flex', justifyContent: 'space-between' }}>
              <span>Descrição * (mín. 50 caracteres)</span>
              <span style={{ color: form.descricao.trim().length >= 50 ? '#059669' : '#9ca3af', fontWeight: 400 }}>
                {form.descricao.trim().length}/50
              </span>
            </label>
            <textarea style={S.textarea} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Descreva a necessidade…" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Tipo de Equipamento *</label>
              <input style={S.input} value={form.tipo_equipamento} onChange={(e) => set('tipo_equipamento', e.target.value)} placeholder="Ex: Notebook, Monitor…" />
            </div>
            <div>
              <label style={S.label}>Quantidade *</label>
              <input style={S.input} type="number" min="1" value={form.quantidade} onChange={(e) => set('quantidade', e.target.value)} placeholder="0" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Valor Estimado (R$) *</label>
              <input style={S.input} type="number" step="0.01" value={form.valor_estimado} onChange={(e) => set('valor_estimado', e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label style={S.label}>Modalidade *</label>
              <select style={S.select} value={form.modalidade_licitatoria} onChange={(e) => set('modalidade_licitatoria', e.target.value)}>
                <option value="">Selecione…</option>
                {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Setor Solicitante</label>
              <input style={S.input} value={form.setor_solicitante} onChange={(e) => set('setor_solicitante', e.target.value)} placeholder="Ex: TI, Administrativo…" />
            </div>
            <div>
              <label style={S.label}>Data Prevista</label>
              <input style={S.input} type="date" value={form.data_necessidade_prevista} onChange={(e) => set('data_necessidade_prevista', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <input type="checkbox" id="emergencial" checked={form.aquisicao_emergencial} onChange={(e) => set('aquisicao_emergencial', e.target.checked)} />
            <label htmlFor="emergencial" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Aquisição emergencial</label>
          </div>

          {form.aquisicao_emergencial && (
            <div style={S.formGroup}>
              <label style={S.label}>Justificativa de Emergência *</label>
              <textarea style={S.textarea} value={form.justificativa_emergencial} onChange={(e) => set('justificativa_emergencial', e.target.value)} placeholder="Motivo da urgência…" />
            </div>
          )}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={S.btn} onClick={onClose}>Cancelar</button>
          <button style={S.btnPrimary} onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando…' : 'Criar Demanda'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Aprovar / Rejeitar ──────────────────────────────────────────────────

function AprovarModal({ demanda, onClose, onSaved }: { demanda: any; onClose: () => void; onSaved: () => void }) {
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (acao: 'aprovar' | 'rejeitar') => {
    if (acao === 'rejeitar' && obs.trim().length < 10) { setError('Motivo de rejeição obrigatório (mín. 10 caracteres).'); return; }
    setSaving(true);
    try {
      if (acao === 'aprovar') await geproService.aprovar(demanda.id, obs || undefined);
      else await geproService.rejeitar(demanda.id, obs);
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 4, width: 480 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>Avaliar Demanda — {demanda.numero_demanda}</span>
        </div>
        <div style={{ padding: 20 }}>
          {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 14 }}><strong>{demanda.titulo}</strong></p>
          <div style={S.formGroup}>
            <label style={S.label}>Observações (obrigatório para rejeição)</label>
            <textarea style={S.textarea} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Comentários sobre a decisão…" />
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={S.btn} onClick={onClose}>Cancelar</button>
          <button style={S.btnDanger} onClick={() => handle('rejeitar')} disabled={saving}>Rejeitar</button>
          <button style={S.btnSuccess} onClick={() => handle('aprovar')} disabled={saving}>{saving ? 'Processando…' : 'Aprovar'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GEPRODashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGestor = ['admin', 'manager'].includes(user?.role ?? '');

  const [stats, setStats] = useState<any>(null);
  const [demandas, setDemandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aprovando, setAprovando] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filtroStatus) params.status = filtroStatus;
      if (busca) params.search = busca;
      const [s, d] = await Promise.all([geproService.getStats(), geproService.listarDemandas(params)]);
      setStats(s);
      setDemandas(Array.isArray(d) ? d : d?.rows ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, busca]);

  useEffect(() => { loadData(); }, [loadData]);

  const phaseCards = [
    { icon: '1️⃣', label: 'Necessidade',     sub: 'Aguardando aprovação', value: (stats?.totais?.rascunho ?? 0) + (stats?.totais?.aguardando_instrucao ?? 0) },
    { icon: '2️⃣', label: 'Instrução Técnica', sub: 'Em desenvolvimento',  value: stats?.totais?.em_instrucao ?? 0 },
    { icon: '3️⃣', label: 'Encaminhamento',  sub: 'Aguardando NE',        value: stats?.totais?.em_encaminhamento ?? 0 },
    { icon: '4️⃣', label: 'Recebimento',     sub: 'Testes técnicos',      value: stats?.totais?.em_recebimento ?? 0 },
    { icon: '5️⃣', label: 'Encerramento',    sub: 'Finalizadas',          value: stats?.totais?.finalizadas ?? 0 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>Gestão de Aquisições</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Acompanhamento de demandas • Lei 14.133/2021</p>
      </div>

      {/* Cards de fase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15, marginBottom: 24 }}>
        {phaseCards.map((c) => (
          <div key={c.label} style={S.card}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a8a', marginBottom: 2 }}>{loading ? '…' : c.value}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabela de demandas */}
      <div style={S.section}>
        <div style={{ ...S.sectionHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Demandas</span>
          <button style={S.btnPrimary} onClick={() => setShowModal(true)}>+ Nova Demanda</button>
        </div>

        {/* Filtros */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          <input
            style={{ ...S.input, maxWidth: 260 }}
            placeholder="Buscar por título ou número…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select style={{ ...S.select, maxWidth: 200 }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button style={S.btn} onClick={loadData}>Atualizar</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Número</th>
              <th style={S.th}>Título</th>
              <th style={S.th}>Modalidade</th>
              <th style={S.th}>Valor Estimado</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Criada em</th>
              <th style={S.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#9ca3af', padding: 32 }}>Carregando…</td></tr>
            ) : demandas.length === 0 ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#9ca3af', padding: 32 }}>Nenhuma demanda encontrada.</td></tr>
            ) : demandas.map((d: any) => (
              <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/gepro/demandas/${d.id}`)}>
                <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{d.numero_demanda}</td>
                <td style={S.td}>{d.titulo}</td>
                <td style={{ ...S.td, fontSize: 12 }}>{MODALIDADES.find((m) => m.value === d.modalidade_licitatoria)?.label ?? d.modalidade_licitatoria}</td>
                <td style={S.td}>{fmtCurrency(d.valor_estimado)}</td>
                <td style={S.td}>{statusBadge(d.status)}</td>
                <td style={{ ...S.td, fontSize: 12 }}>{fmtDate(d.data_criacao)}</td>
                <td style={S.td} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...S.btn, padding: '5px 10px', fontSize: 11 }} onClick={() => navigate(`/gepro/demandas/${d.id}`)}>Ver</button>
                    {isGestor && d.status === 'necessidade_rascunho' && (
                      <button style={{ ...S.btnSuccess, padding: '5px 10px', fontSize: 11 }} onClick={() => setAprovando(d)}>Avaliar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <NovaDemandaModal onClose={() => setShowModal(false)} onSaved={loadData} />}
      {aprovando && <AprovarModal demanda={aprovando} onClose={() => setAprovando(null)} onSaved={loadData} />}
    </div>
  );
}
