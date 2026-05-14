import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as geproService from '../../services/geproService';

type Tab = 'etp' | 'tr' | 'cotacoes' | 'validacao';

const S = {
  card: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  } as React.CSSProperties,
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    padding: '16px 20px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? '#1e3a8a' : '#6b7280',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #1e3a8a' : '2px solid transparent',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  }),
  tabContent: { padding: 20 } as React.CSSProperties,
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1e3a8a',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid #e5e7eb',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 13,
    color: '#374151',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 13,
    color: '#374151',
    resize: 'vertical' as const,
    minHeight: 90,
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 13,
    color: '#374151',
    background: 'white',
    boxSizing: 'border-box' as const,
  },
  formGroup: { marginBottom: 16 } as React.CSSProperties,
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 16,
  } as React.CSSProperties,
  formRow3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
    marginBottom: 16,
  } as React.CSSProperties,
  actionsRow: { display: 'flex', gap: 8, marginTop: 16 } as React.CSSProperties,
  btn: {
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    background: 'white',
    color: '#374151',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '10px 16px',
    background: '#1e3a8a',
    color: 'white',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnSuccess: {
    padding: '10px 16px',
    background: '#059669',
    color: 'white',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnDanger: {
    padding: '10px 16px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    cursor: 'pointer',
  } as React.CSSProperties,
  badge: (type: 'success' | 'pending' | 'info' | 'danger'): React.CSSProperties => {
    const map = {
      success: { background: '#d1fae5', color: '#065f46' },
      pending: { background: '#fef3c7', color: '#92400e' },
      info: { background: '#dbeafe', color: '#1e40af' },
      danger: { background: '#fee2e2', color: '#991b1b' },
    };
    return {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 3,
      fontSize: 11,
      fontWeight: 600,
      ...map[type],
    };
  },
  alert: (type: 'error' | 'success'): React.CSSProperties => ({
    padding: '12px 16px',
    borderRadius: 4,
    marginBottom: 16,
    fontSize: 13,
    background: type === 'error' ? '#fee2e2' : '#d1fae5',
    color: type === 'error' ? '#991b1b' : '#065f46',
    border: `1px solid ${type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
  }),
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 13,
    color: '#4b5563',
  },
  checkItem: {
    display: 'flex',
    gap: 12,
    padding: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    alignItems: 'center',
  } as React.CSSProperties,
};

// ── Helper ────────────────────────────────────────────────────────────────────

function fmtCurrency(v: string | number | null | undefined) {
  if (v == null || v === '') return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function metaItem(label: string, value: string | null | undefined) {
  return (
    <div style={{ fontSize: 12 }}>
      <div style={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#374151', fontWeight: 600 }}>{value || '—'}</div>
    </div>
  );
}

const MODALIDADE_LABELS: Record<string, string> = {
  pregao: 'Pregão',
  concorrencia: 'Concorrência',
  srp: 'SRP',
  convite: 'Convite',
  ata_registro_precos: 'Ata de Registro de Preços',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Fase2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fase2, setFase2] = useState<any>(null);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('etp');
  const [etpForm, setETPForm] = useState<Record<string, string>>({});
  const [trForm, setTRForm] = useState<Record<string, string>>({});
  const [cotacaoForm, setCotacaoForm] = useState({
    fornecedor_id: '',
    valor_unitario: '',
    prazo_entrega_dias: '',
    validade_cotacao: '',
    descricao_produto_cotado: '',
    observacoes: '',
  });
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCotacaoForm, setShowCotacaoForm] = useState(false);

  const showMsg = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setError(null); }
    else { setError(msg); setSuccess(null); }
    setTimeout(() => { setSuccess(null); setError(null); }, 4000);
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [f2, fns] = await Promise.all([
        geproService.getFase2(id),
        geproService.getFornecedores(),
      ]);
      setFase2(f2);
      setFornecedores(fns);
      if (f2.etp) {
        const e = f2.etp;
        setETPForm({
          justificativa_tecnica: e.justificativa_tecnica || '',
          categoria_equipamento: e.categoria_equipamento || '',
          criterios_rejeicao: e.criterios_rejeicao || '',
          garantia_periodo: e.garantia_periodo || '',
          suporte_tecnico: e.suporte_tecnico || '',
          processador_tipo: e.processador_tipo || '',
          processador_velocidade: e.processador_velocidade || '',
          processador_nucleos: e.processador_nucleos?.toString() || '',
          memoria_ram_minima: e.memoria_ram_minima || '',
          armazenamento_tipo: e.armazenamento_tipo || '',
          armazenamento_capacidade: e.armazenamento_capacidade || '',
          conectividade: e.conectividade || '',
          sistema_operacional: e.sistema_operacional || '',
          condicoes_entrega: e.condicoes_entrega || '',
          certificacoes_obrigatorias: e.certificacoes_obrigatorias || '',
        });
      }
      if (f2.tr) {
        const t = f2.tr;
        setTRForm({
          objeto: t.objeto || '',
          justificativa: t.justificativa || '',
          descricao_detalhada: t.descricao_detalhada || '',
          criterio_selecao: t.criterio_selecao || '',
          prazo_entrega_dias_max: t.prazo_entrega_dias_max?.toString() || '',
          condicoes_pagamento: t.condicoes_pagamento || '',
          valor_estimado_unitario: t.valor_estimado_unitario?.toString() || '',
          valor_estimado_total: t.valor_estimado_total?.toString() || '',
          prazo_garantia_meses: t.prazo_garantia_meses?.toString() || '',
          multa_atraso_percentual: t.multa_atraso_percentual?.toString() || '',
          clauses_rescisao: t.clauses_rescisao || '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados da Fase 2.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadChecklist = useCallback(async () => {
    if (!id) return;
    try {
      const c = await geproService.getChecklist(id);
      setChecklist(c);
    } catch {}
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (activeTab === 'validacao') loadChecklist();
  }, [activeTab, loadChecklist]);

  const handleSaveETP = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await geproService.submitETP(id, etpForm);
      showMsg('ETP salvo com sucesso.', 'success');
      await loadData();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Erro ao salvar ETP.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTR = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await geproService.submitTR(id, trForm);
      showMsg('Termo de Referência salvo com sucesso.', 'success');
      await loadData();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Erro ao salvar TR.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCotacao = async () => {
    if (!id) return;
    if (!cotacaoForm.fornecedor_id || !cotacaoForm.valor_unitario) {
      showMsg('Fornecedor e valor unitário são obrigatórios.', 'error');
      return;
    }
    setSaving(true);
    try {
      await geproService.addCotacao(id, {
        fornecedor_id: Number(cotacaoForm.fornecedor_id),
        valor_unitario: Number(cotacaoForm.valor_unitario),
        prazo_entrega_dias: cotacaoForm.prazo_entrega_dias ? Number(cotacaoForm.prazo_entrega_dias) : undefined,
        validade_cotacao: cotacaoForm.validade_cotacao || undefined,
        descricao_produto_cotado: cotacaoForm.descricao_produto_cotado || undefined,
        observacoes: cotacaoForm.observacoes || undefined,
      });
      showMsg('Cotação adicionada com sucesso.', 'success');
      setCotacaoForm({ fornecedor_id: '', valor_unitario: '', prazo_entrega_dias: '', validade_cotacao: '', descricao_produto_cotado: '', observacoes: '' });
      setShowCotacaoForm(false);
      await loadData();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Erro ao adicionar cotação.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelecionarVencedor = async (cotacaoId: number) => {
    if (!id) return;
    setSaving(true);
    try {
      await geproService.selecionarVencedor(id, cotacaoId);
      showMsg('Fornecedor vencedor selecionado.', 'success');
      await loadData();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Erro ao selecionar vencedor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEncaminhar = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await geproService.encaminhar(id);
      showMsg('Demanda encaminhada para análise jurídica!', 'success');
      await loadChecklist();
      setTimeout(() => navigate(`/gepro/demandas/${id}`), 1500);
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Erro ao encaminhar demanda.', 'error');
      await loadChecklist();
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 14 }}>
        Carregando Fase 2…
      </div>
    );
  }

  if (!fase2) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ color: '#dc2626', marginBottom: 12 }}>Demanda não encontrada.</p>
        <Link to="/gepro/dashboard" style={{ color: '#1e3a8a', fontSize: 13 }}>← Voltar ao Dashboard</Link>
      </div>
    );
  }

  const demanda = fase2.demanda;
  const trPermitido = fase2.tr_permitido;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'etp', label: 'ETP' },
    ...(trPermitido ? [{ key: 'tr' as Tab, label: 'Termo de Referência' }] : []),
    { key: 'cotacoes', label: 'Cotações' },
    { key: 'validacao', label: 'Validação' },
  ];

  return (
    <div>
      {/* breadcrumb */}
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24 }}>
        <Link to="/gepro/dashboard" style={{ color: '#9ca3af', textDecoration: 'none' }}>← Dashboard</Link>
        {' / '}
        <Link to={`/gepro/demandas/${id}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>{demanda.numero_demanda}</Link>
        {' / Fase 2'}
      </p>

      {/* Page header */}
      <div style={S.card}>
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>
            {demanda.numero_demanda}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>
            {demanda.objeto}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Fase 2: Instrução Técnica — ETP, Termo de Referência e Cotações
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            {metaItem('Modalidade', MODALIDADE_LABELS[demanda.modalidade_licitatoria] || demanda.modalidade_licitatoria)}
            {metaItem('Valor Estimado', fmtCurrency(demanda.valor_estimado))}
            {metaItem('Status', demanda.status?.replace(/_/g, ' '))}
            {metaItem('Solicitante', demanda.solicitante_nome || `ID ${demanda.solicitante_id}`)}
          </div>
        </div>
      </div>

      {/* Alert messages */}
      {error && <div style={S.alert('error')}>{error}</div>}
      {success && <div style={S.alert('success')}>{success}</div>}

      {/* Main tabs card */}
      <div style={S.card}>
        <div style={S.tabBar}>
          {tabs.map(({ key, label }) => (
            <button key={key} style={S.tab(activeTab === key)} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ETP Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'etp' && (
          <div style={S.tabContent}>
            <div style={S.sectionTitle}>Estudo Técnico Preliminar (ETP)</div>

            <div style={S.formGroup}>
              <label style={S.label}>Justificativa da Necessidade *</label>
              <textarea
                style={S.textarea}
                value={etpForm.justificativa_tecnica || ''}
                onChange={(e) => setETPForm({ ...etpForm, justificativa_tecnica: e.target.value })}
                placeholder="Descreva por que o item é necessário (mín. 50 caracteres)…"
              />
            </div>

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Categoria do Equipamento *</label>
                <input
                  style={S.input}
                  value={etpForm.categoria_equipamento || ''}
                  onChange={(e) => setETPForm({ ...etpForm, categoria_equipamento: e.target.value })}
                  placeholder="Ex: Computador, Monitor, Impressora…"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Sistema Operacional</label>
                <input
                  style={S.input}
                  value={etpForm.sistema_operacional || ''}
                  onChange={(e) => setETPForm({ ...etpForm, sistema_operacional: e.target.value })}
                  placeholder="Ex: Windows 11, Ubuntu 22.04…"
                />
              </div>
            </div>

            <div style={S.formRow3}>
              <div style={S.formGroup}>
                <label style={S.label}>Processador</label>
                <input
                  style={S.input}
                  value={etpForm.processador_tipo || ''}
                  onChange={(e) => setETPForm({ ...etpForm, processador_tipo: e.target.value })}
                  placeholder="Ex: Intel Core i5"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Velocidade (GHz)</label>
                <input
                  style={S.input}
                  value={etpForm.processador_velocidade || ''}
                  onChange={(e) => setETPForm({ ...etpForm, processador_velocidade: e.target.value })}
                  placeholder="Ex: 2.4 GHz"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Núcleos</label>
                <input
                  style={S.input}
                  type="number"
                  value={etpForm.processador_nucleos || ''}
                  onChange={(e) => setETPForm({ ...etpForm, processador_nucleos: e.target.value })}
                  placeholder="Ex: 8"
                />
              </div>
            </div>

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Memória RAM Mínima</label>
                <input
                  style={S.input}
                  value={etpForm.memoria_ram_minima || ''}
                  onChange={(e) => setETPForm({ ...etpForm, memoria_ram_minima: e.target.value })}
                  placeholder="Ex: 8 GB DDR4"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Armazenamento</label>
                <input
                  style={S.input}
                  value={etpForm.armazenamento_capacidade || ''}
                  onChange={(e) => setETPForm({ ...etpForm, armazenamento_capacidade: e.target.value })}
                  placeholder="Ex: 256 GB SSD"
                />
              </div>
            </div>

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Conectividade</label>
                <input
                  style={S.input}
                  value={etpForm.conectividade || ''}
                  onChange={(e) => setETPForm({ ...etpForm, conectividade: e.target.value })}
                  placeholder="Ex: Wi-Fi 6, USB-A, USB-C…"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Condições de Entrega</label>
                <input
                  style={S.input}
                  value={etpForm.condicoes_entrega || ''}
                  onChange={(e) => setETPForm({ ...etpForm, condicoes_entrega: e.target.value })}
                  placeholder="Ex: instalação incluída, embalagem lacrada…"
                />
              </div>
            </div>

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Período de Garantia</label>
                <input
                  style={S.input}
                  value={etpForm.garantia_periodo || ''}
                  onChange={(e) => setETPForm({ ...etpForm, garantia_periodo: e.target.value })}
                  placeholder="Ex: 12 meses on-site…"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Suporte Técnico</label>
                <input
                  style={S.input}
                  value={etpForm.suporte_tecnico || ''}
                  onChange={(e) => setETPForm({ ...etpForm, suporte_tecnico: e.target.value })}
                  placeholder="Ex: telefone + visita em até 24h…"
                />
              </div>
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Certificações Obrigatórias</label>
              <input
                style={S.input}
                value={etpForm.certificacoes_obrigatorias || ''}
                onChange={(e) => setETPForm({ ...etpForm, certificacoes_obrigatorias: e.target.value })}
                placeholder="Ex: INMETRO, ANATEL, Energy Star…"
              />
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Critérios de Rejeição *</label>
              <textarea
                style={S.textarea}
                value={etpForm.criterios_rejeicao || ''}
                onChange={(e) => setETPForm({ ...etpForm, criterios_rejeicao: e.target.value })}
                placeholder="Condições que implicam rejeição do item na entrega (mín. 20 caracteres)…"
              />
            </div>

            <div style={S.actionsRow}>
              <button style={S.btnPrimary} onClick={handleSaveETP} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar ETP'}
              </button>
            </div>
          </div>
        )}

        {/* ── TR Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'tr' && trPermitido && (
          <div style={S.tabContent}>
            <div style={S.sectionTitle}>Termo de Referência (TR)</div>

            <div style={S.formGroup}>
              <label style={S.label}>Objeto *</label>
              <textarea
                style={S.textarea}
                value={trForm.objeto || ''}
                onChange={(e) => setTRForm({ ...trForm, objeto: e.target.value })}
                placeholder="Descrição sucinta do objeto da contratação (mín. 30 caracteres)…"
              />
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Justificativa *</label>
              <textarea
                style={S.textarea}
                value={trForm.justificativa || ''}
                onChange={(e) => setTRForm({ ...trForm, justificativa: e.target.value })}
                placeholder="Justificativa da necessidade da contratação (mín. 50 caracteres)…"
              />
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Descrição Detalhada</label>
              <textarea
                style={{ ...S.textarea, minHeight: 120 }}
                value={trForm.descricao_detalhada || ''}
                onChange={(e) => setTRForm({ ...trForm, descricao_detalhada: e.target.value })}
                placeholder="Especificação completa do objeto, incluindo requisitos técnicos e funcionais…"
              />
            </div>

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Valor Estimado Unitário (R$)</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.01"
                  value={trForm.valor_estimado_unitario || ''}
                  onChange={(e) => setTRForm({ ...trForm, valor_estimado_unitario: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Valor Estimado Total (R$)</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.01"
                  value={trForm.valor_estimado_total || ''}
                  onChange={(e) => setTRForm({ ...trForm, valor_estimado_total: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div style={S.formRow3}>
              <div style={S.formGroup}>
                <label style={S.label}>Prazo de Entrega (dias) *</label>
                <input
                  style={S.input}
                  type="number"
                  value={trForm.prazo_entrega_dias_max || ''}
                  onChange={(e) => setTRForm({ ...trForm, prazo_entrega_dias_max: e.target.value })}
                  placeholder="Ex: 30"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Prazo de Garantia (meses)</label>
                <input
                  style={S.input}
                  type="number"
                  value={trForm.prazo_garantia_meses || ''}
                  onChange={(e) => setTRForm({ ...trForm, prazo_garantia_meses: e.target.value })}
                  placeholder="Ex: 12"
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Multa por Atraso (%)</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.01"
                  value={trForm.multa_atraso_percentual || ''}
                  onChange={(e) => setTRForm({ ...trForm, multa_atraso_percentual: e.target.value })}
                  placeholder="Ex: 0.5"
                />
              </div>
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Critério de Seleção *</label>
              <select
                style={S.select}
                value={trForm.criterio_selecao || ''}
                onChange={(e) => setTRForm({ ...trForm, criterio_selecao: e.target.value })}
              >
                <option value="">Selecione…</option>
                <option value="menor_preco">Menor Preço</option>
                <option value="melhor_tecnica_preco">Melhor Técnica e Preço</option>
                <option value="maior_desconto">Maior Desconto</option>
                <option value="melhor_tecnica">Melhor Técnica</option>
              </select>
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Condições de Pagamento *</label>
              <textarea
                style={S.textarea}
                value={trForm.condicoes_pagamento || ''}
                onChange={(e) => setTRForm({ ...trForm, condicoes_pagamento: e.target.value })}
                placeholder="Ex: 30 dias após entrega, mediante nota fiscal…"
              />
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Cláusulas de Rescisão</label>
              <textarea
                style={S.textarea}
                value={trForm.clauses_rescisao || ''}
                onChange={(e) => setTRForm({ ...trForm, clauses_rescisao: e.target.value })}
                placeholder="Condições para rescisão contratual…"
              />
            </div>

            <div style={S.actionsRow}>
              <button style={S.btnPrimary} onClick={handleSaveTR} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar Termo de Referência'}
              </button>
            </div>
          </div>
        )}

        {/* ── Cotações Tab ─────────────────────────────────────────────── */}
        {activeTab === 'cotacoes' && (
          <div style={S.tabContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={S.sectionTitle}>Cotações ({fase2.cotacoes?.length ?? 0} / 3 mínimo)</div>
              <button style={S.btnPrimary} onClick={() => setShowCotacaoForm(true)}>
                + Nova Cotação
              </button>
            </div>

            {/* Add cotação form */}
            {showCotacaoForm && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: 16, marginBottom: 20, background: '#f9fafb' }}>
                <div style={{ ...S.sectionTitle, marginBottom: 16 }}>Registrar Nova Cotação</div>
                <div style={S.formRow}>
                  <div style={S.formGroup}>
                    <label style={S.label}>Fornecedor *</label>
                    <select
                      style={S.select}
                      value={cotacaoForm.fornecedor_id}
                      onChange={(e) => setCotacaoForm({ ...cotacaoForm, fornecedor_id: e.target.value })}
                    >
                      <option value="">Selecione o fornecedor…</option>
                      {fornecedores.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome} — {f.cnpj || 'sem CNPJ'}</option>
                      ))}
                    </select>
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Valor Unitário (R$) *</label>
                    <input
                      style={S.input}
                      type="number"
                      step="0.01"
                      value={cotacaoForm.valor_unitario}
                      onChange={(e) => setCotacaoForm({ ...cotacaoForm, valor_unitario: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div style={S.formRow}>
                  <div style={S.formGroup}>
                    <label style={S.label}>Prazo de Entrega (dias)</label>
                    <input
                      style={S.input}
                      type="number"
                      value={cotacaoForm.prazo_entrega_dias}
                      onChange={(e) => setCotacaoForm({ ...cotacaoForm, prazo_entrega_dias: e.target.value })}
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Validade da Cotação</label>
                    <input
                      style={S.input}
                      type="date"
                      value={cotacaoForm.validade_cotacao}
                      onChange={(e) => setCotacaoForm({ ...cotacaoForm, validade_cotacao: e.target.value })}
                    />
                  </div>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Produto Cotado</label>
                  <input
                    style={S.input}
                    value={cotacaoForm.descricao_produto_cotado}
                    onChange={(e) => setCotacaoForm({ ...cotacaoForm, descricao_produto_cotado: e.target.value })}
                    placeholder="Descrição do produto ou serviço cotado…"
                  />
                </div>
                <div style={S.actionsRow}>
                  <button style={S.btnSuccess} onClick={handleAddCotacao} disabled={saving}>
                    {saving ? 'Salvando…' : 'Registrar Cotação'}
                  </button>
                  <button style={S.btn} onClick={() => setShowCotacaoForm(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Cotações table */}
            {fase2.cotacoes?.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>Nenhuma cotação registrada ainda.</p>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Fornecedor</th>
                    <th style={S.th}>Valor Unitário</th>
                    <th style={S.th}>Prazo Entrega</th>
                    <th style={S.th}>Validade</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {fase2.cotacoes.map((c: any) => (
                    <tr key={c.id}>
                      <td style={S.td}>{c.numero_sequencial}</td>
                      <td style={S.td}><strong>{c.fornecedor_nome || `ID ${c.fornecedor_id}`}</strong></td>
                      <td style={S.td}>{fmtCurrency(c.valor_unitario)}</td>
                      <td style={S.td}>{c.prazo_entrega_dias ? `${c.prazo_entrega_dias} dias` : '—'}</td>
                      <td style={S.td}>{c.validade_cotacao ? new Date(c.validade_cotacao).toLocaleDateString('pt-BR') : '—'}</td>
                      <td style={S.td}>
                        {c.vencedor
                          ? <span style={S.badge('success')}>Selecionada</span>
                          : <span style={S.badge('pending')}>Aguardando</span>}
                      </td>
                      <td style={S.td}>
                        {!c.vencedor && (
                          <button
                            style={{ ...S.btn, fontSize: 11, padding: '6px 12px' }}
                            onClick={() => handleSelecionarVencedor(c.id)}
                            disabled={saving}
                          >
                            Selecionar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {fase2.cotacoes?.length > 0 && fase2.cotacoes.length < 3 && (
              <p style={{ marginTop: 12, color: '#92400e', fontSize: 12, background: '#fef3c7', padding: '8px 12px', borderRadius: 4 }}>
                Mínimo de 3 cotações requerido pela Lei 14.133/2021. Adicione {3 - fase2.cotacoes.length} cotação(ões).
              </p>
            )}
          </div>
        )}

        {/* ── Validação Tab ──────────────────────────────────────────── */}
        {activeTab === 'validacao' && (
          <div style={S.tabContent}>
            <div style={S.sectionTitle}>Checklist de Validação — Lei 14.133/2021</div>

            {checklist ? (
              <>
                {checklist.itens.map((item: any, i: number) => (
                  <div key={i} style={{ ...S.checkItem, borderColor: item.ok === false ? '#fca5a5' : item.ok === null ? '#e5e7eb' : '#6ee7b7' }}>
                    <span style={{ fontSize: 16 }}>{item.ok === true ? '✅' : item.ok === false ? '❌' : '⬜'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.item}</div>
                      {item.detalhe && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{item.detalhe}</div>}
                      {item.observacao && <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginTop: 2 }}>{item.observacao}</div>}
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 24, padding: 16, background: checklist.pode_avancar ? '#d1fae5' : '#fee2e2', borderRadius: 4, border: `1px solid ${checklist.pode_avancar ? '#6ee7b7' : '#fca5a5'}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: checklist.pode_avancar ? '#065f46' : '#991b1b', marginBottom: 4 }}>
                    {checklist.pode_avancar ? '✅ Fase 2 completa — pronta para encaminhamento' : '❌ Fase 2 incompleta — itens pendentes acima'}
                  </div>
                  <div style={{ fontSize: 12, color: checklist.pode_avancar ? '#047857' : '#b91c1c' }}>
                    {checklist.pode_avancar
                      ? 'Todos os requisitos da Lei 14.133/2021 foram atendidos. Encaminhe para análise jurídica.'
                      : 'Resolva os itens marcados com ❌ antes de encaminhar.'}
                  </div>
                </div>

                {checklist.pode_avancar && demanda.status !== 'encaminhamento_aguardando_juridico' && (
                  <div style={S.actionsRow}>
                    <button style={S.btnSuccess} onClick={handleEncaminhar} disabled={saving}>
                      {saving ? 'Encaminhando…' : '→ Validar e Encaminhar à Fase 3 (Jurídico)'}
                    </button>
                  </div>
                )}

                {demanda.status === 'encaminhamento_aguardando_juridico' && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#dbeafe', borderRadius: 4, fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
                    Demanda já encaminhada para análise jurídica.
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Carregando checklist…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
