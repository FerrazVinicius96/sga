import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as geproService from '../../services/geproService';
import { useAuth } from '../../contexts/AuthContext';

const MODALIDADES = [
  { value: 'pregao',              label: 'Pregão' },
  { value: 'concorrencia',        label: 'Concorrência' },
  { value: 'srp',                 label: 'SRP' },
  { value: 'convite',             label: 'Convite' },
  { value: 'ata_registro_precos', label: 'Ata de Registro de Preços' },
];

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

function fmtCurrency(v: unknown) {
  if (v == null) return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

const S = {
  th: { padding: '11px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.4px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '13px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151' },
  input: { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: 'white', boxSizing: 'border-box' as const },
  select: { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: 'white', boxSizing: 'border-box' as const },
  btn: { padding: '9px 14px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnPrimary: { padding: '9px 16px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
};

const PAGE_SIZE = 10;

// ── Nova Demanda Modal (inline, sem dependência externa) ──────

const FORM_EMPTY = { titulo: '', descricao: '', tipo_equipamento: '', quantidade: '', valor_estimado: '', modalidade_licitatoria: '', setor_solicitante: '', data_necessidade_prevista: '', aquisicao_emergencial: false, justificativa_emergencial: '' };

const formStyle = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' as const };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

function NovaDemandaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(FORM_EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.titulo.trim()) { setError('Título é obrigatório.'); return; }
    if (form.descricao.trim().length < 50) { setError(`Descrição muito curta (${form.descricao.trim().length}/50 caracteres).`); return; }
    if (!form.tipo_equipamento.trim()) { setError('Tipo de equipamento é obrigatório.'); return; }
    if (!form.quantidade || Number(form.quantidade) <= 0) { setError('Quantidade deve ser maior que zero.'); return; }
    if (!form.valor_estimado || Number(form.valor_estimado) <= 0) { setError('Valor estimado deve ser maior que zero.'); return; }
    if (!form.modalidade_licitatoria) { setError('Selecione a modalidade.'); return; }
    if (form.aquisicao_emergencial && !form.justificativa_emergencial.trim()) { setError('Justificativa de emergência obrigatória.'); return; }
    setSaving(true); setError(null);
    try {
      await geproService.criarDemanda({ ...form, quantidade: Number(form.quantidade), valor_estimado: Number(form.valor_estimado), aquisicao_emergencial: Boolean(form.aquisicao_emergencial) });
      onSaved(); onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao criar demanda.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 6, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>Nova Demanda</span>
          <button onClick={onClose} style={{ ...S.btn, padding: '4px 10px' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Título *</label><input style={formStyle} value={form.titulo} onChange={e => set('titulo', e.target.value)} /></div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
              <span>Descrição * (mín. 50 caracteres)</span>
              <span style={{ color: form.descricao.trim().length >= 50 ? '#059669' : '#9ca3af', fontWeight: 400 }}>{form.descricao.trim().length}/50</span>
            </label>
            <textarea style={{ ...formStyle, resize: 'vertical', minHeight: 80 }} value={form.descricao} onChange={e => set('descricao', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={labelStyle}>Tipo de Equipamento *</label><input style={formStyle} value={form.tipo_equipamento} onChange={e => set('tipo_equipamento', e.target.value)} /></div>
            <div><label style={labelStyle}>Quantidade *</label><input style={formStyle} type="number" min="1" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={labelStyle}>Valor Estimado (R$) *</label><input style={formStyle} type="number" step="0.01" value={form.valor_estimado} onChange={e => set('valor_estimado', e.target.value)} /></div>
            <div>
              <label style={labelStyle}>Modalidade *</label>
              <select style={formStyle} value={form.modalidade_licitatoria} onChange={e => set('modalidade_licitatoria', e.target.value)}>
                <option value="">Selecione…</option>
                {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={labelStyle}>Setor Solicitante</label><input style={formStyle} value={form.setor_solicitante} onChange={e => set('setor_solicitante', e.target.value)} /></div>
            <div><label style={labelStyle}>Data Prevista</label><input style={formStyle} type="date" value={form.data_necessidade_prevista} onChange={e => set('data_necessidade_prevista', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input type="checkbox" id="emerg" checked={form.aquisicao_emergencial} onChange={e => set('aquisicao_emergencial', e.target.checked)} />
            <label htmlFor="emerg" style={{ fontSize: 13, cursor: 'pointer' }}>Aquisição emergencial</label>
          </div>
          {form.aquisicao_emergencial && (
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Justificativa de Emergência *</label><textarea style={{ ...formStyle, resize: 'vertical', minHeight: 70 }} value={form.justificativa_emergencial} onChange={e => set('justificativa_emergencial', e.target.value)} /></div>
          )}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={S.btn} onClick={onClose}>Cancelar</button>
          <button style={S.btnPrimary} onClick={submit} disabled={saving}>{saving ? 'Salvando…' : 'Criar Demanda'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function DemandasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGestor = ['admin', 'manager'].includes(user?.role ?? '');

  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await geproService.listarDemandas();
      setAll(Array.isArray(data) ? data : data?.rows ?? []);
    } catch { setAll([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // filtro client-side
  const filtered = all.filter(d => {
    if (filtroStatus && d.status !== filtroStatus) return false;
    if (filtroModalidade && d.modalidade_licitatoria !== filtroModalidade) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (!d.titulo?.toLowerCase().includes(q) && !d.numero_demanda?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => setPage(1);

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Demandas</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{all.length} demandas cadastradas</p>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowModal(true)}>+ Nova Demanda</button>
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
        {/* Barra de filtros */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            style={{ ...S.input, width: 280 }}
            placeholder="Buscar por título ou número…"
            value={busca}
            onChange={e => { setBusca(e.target.value); reset(); }}
          />
          <select style={{ ...S.select, width: 180 }} value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); reset(); }}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select style={{ ...S.select, width: 200 }} value={filtroModalidade} onChange={e => { setFiltroModalidade(e.target.value); reset(); }}>
            <option value="">Todas as modalidades</option>
            {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <button style={S.btn} onClick={load}>↻</button>
          {(busca || filtroStatus || filtroModalidade) && (
            <button style={{ ...S.btn, color: '#6b7280', fontSize: 11 }} onClick={() => { setBusca(''); setFiltroStatus(''); setFiltroModalidade(''); reset(); }}>Limpar filtros</button>
          )}
        </div>

        {/* Tabela */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Número</th>
              <th style={S.th}>Título</th>
              <th style={S.th}>Equip. / Qtd.</th>
              <th style={S.th}>Modalidade</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Valor Estimado</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Criada em</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#9ca3af' }}>Carregando…</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#9ca3af' }}>Nenhuma demanda encontrada.</td></tr>
            ) : paged.map((d: any) => {
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
                    <div style={{ fontWeight: 500, color: '#111827' }}>{d.titulo}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{d.setor_solicitante}</div>
                  </td>
                  <td style={{ ...S.td, fontSize: 12 }}>{d.tipo_equipamento}<br /><span style={{ color: '#6b7280' }}>× {d.quantidade}</span></td>
                  <td style={{ ...S.td, fontSize: 12 }}>{MODALIDADES.find(m => m.value === d.modalidade_licitatoria)?.label ?? d.modalidade_licitatoria}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(d.valor_estimado)}</td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </td>
                  <td style={{ ...S.td, fontSize: 12, color: '#6b7280' }}>{fmtDate(d.data_criacao)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} · página {page} de {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ ...S.btn, padding: '6px 12px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
              <button style={{ ...S.btn, padding: '6px 12px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <NovaDemandaModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}
