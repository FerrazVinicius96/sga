import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as geproService from '../../services/geproService';
import { useAuth } from '../../contexts/AuthContext';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR');
}

// Status order used to determine which sections are active/locked
const STATUS_ORDER = [
  'agendamento_pendente',
  'agendamento_confirmado',
  'recebimento_provisorio',
  'recebimento_testado_conforme',
  'recebimento_rejeitado',
  'encerramento_pagamento_realizado',
  'encerramento_finalizado',
];

function statusGte(current: string, target: string) {
  return STATUS_ORDER.indexOf(current) >= STATUS_ORDER.indexOf(target);
}

// ── styles ────────────────────────────────────────────────────────────────────

const S = {
  section: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 20, overflow: 'hidden' } as React.CSSProperties,
  sectionHeader: (active: boolean): React.CSSProperties => ({
    padding: '14px 20px', borderBottom: '1px solid #e5e7eb',
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    color: active ? '#1e3a8a' : '#9ca3af', letterSpacing: '0.5px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }),
  step: (active: boolean): React.CSSProperties => ({
    width: 20, height: 20, borderRadius: '50%', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
    background: active ? '#1e3a8a' : '#e5e7eb', color: active ? 'white' : '#9ca3af', marginRight: 8,
  }),
  badge: (done: boolean): React.CSSProperties => ({
    padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600,
    background: done ? '#d1fae5' : '#fef3c7', color: done ? '#065f46' : '#92400e',
  }),
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: 'white', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical' as const, minHeight: 80, boxSizing: 'border-box' as const },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase' as const },
  formGroup: { marginBottom: 14 } as React.CSSProperties,
  row: { display: 'grid', gap: 14 } as React.CSSProperties,
  btnPrimary: { padding: '9px 18px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btn: { padding: '9px 16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { padding: '9px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 20 } as React.CSSProperties,
  metaLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: '#9ca3af', marginBottom: 3 },
  metaValue: { fontSize: 13, color: '#111827', fontWeight: 500 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as React.CSSProperties,
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={S.metaLabel}>{label}</div>
      <div style={S.metaValue}>{value ?? '—'}</div>
    </div>
  );
}

function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 12px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3 }}>{msg}</p>;
}

// ── Section 1: Agendamento ────────────────────────────────────────────────────

function AgendamentoSection({ id, status, onRefresh }: { id: string; status: string; onRefresh: () => void }) {
  const isActive = status === 'agendamento_pendente';
  const isDone   = statusGte(status, 'agendamento_confirmado');
  const [agendamento, setAgendamento] = useState<any>(null);
  const [form, setForm] = useState({ data_proposta: '', localidade: '', observacoes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDone) {
      geproService.getAgendamento(id).then(setAgendamento).catch(() => {});
    }
  }, [id, isDone]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.data_proposta || !form.localidade) { setError('Data e localidade são obrigatórios.'); return; }
    setSaving(true); setError(null);
    try {
      await geproService.agendar(id, form as any);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao agendar entrega.');
      setSaving(false);
    }
  };

  return (
    <div style={S.section}>
      <div style={S.sectionHeader(isActive || isDone)}>
        <div>
          <span style={S.step(isActive || isDone)}>{isDone ? '✓' : '1'}</span>
          Agendamento de Entrega
        </div>
        {isDone && <span style={S.badge(true)}>Concluído</span>}
        {isActive && <span style={S.badge(false)}>Aguardando</span>}
      </div>

      {isDone && agendamento && (
        <div style={S.metaGrid}>
          <InfoRow label="Data Proposta"  value={fmtDate(agendamento.data_proposta)} />
          <InfoRow label="Localidade"     value={agendamento.localidade} />
          <InfoRow label="Agendado por"   value={agendamento.agendado_por_nome} />
          {agendamento.observacoes && <InfoRow label="Observações" value={agendamento.observacoes} />}
        </div>
      )}

      {isActive && (
        <div style={{ padding: 20 }}>
          <FormError msg={error} />
          <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Data Proposta *</label>
              <input type="date" style={S.input} value={form.data_proposta} onChange={e => set('data_proposta', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Localidade *</label>
              <select style={S.select} value={form.localidade} onChange={e => set('localidade', e.target.value)}>
                <option value="">Selecione...</option>
                <option value="CETEC">CETEC</option>
                <option value="ALMOXARIFADO">Almoxarifado</option>
              </select>
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Observações</label>
            <textarea style={S.textarea} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Instruções para a entrega..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={S.btnPrimary} onClick={submit} disabled={saving}>
              {saving ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      )}

      {!isActive && !isDone && (
        <p style={{ padding: 20, color: '#9ca3af', fontSize: 13, margin: 0 }}>Aguardando emissão da Nota de Empenho.</p>
      )}
    </div>
  );
}

// ── Section 2: Recebimento Provisório ─────────────────────────────────────────

function RecebimentoSection({ id, status, onRefresh }: { id: string; status: string; onRefresh: () => void }) {
  const isActive = status === 'agendamento_confirmado';
  const isDone   = statusGte(status, 'recebimento_provisorio');
  const [recebimento, setRecebimento] = useState<any>(null);
  const [form, setForm] = useState({
    responsavel_recebimento: '', numero_nf: '', quantidade_recebida: '',
    data_recebimento_provisorio: '', observacoes_gerais: '', observacoes_embalagem: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDone) {
      geproService.getRecebimento(id).then(setRecebimento).catch(() => {});
    }
  }, [id, isDone]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.responsavel_recebimento || !form.numero_nf || !form.quantidade_recebida) {
      setError('Responsável, NF e quantidade são obrigatórios.');
      return;
    }
    setSaving(true); setError(null);
    try {
      await geproService.registrarRecebimento(id, { ...form, quantidade_recebida: Number(form.quantidade_recebida) } as any);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao registrar recebimento.');
      setSaving(false);
    }
  };

  return (
    <div style={S.section}>
      <div style={S.sectionHeader(isActive || isDone)}>
        <div>
          <span style={S.step(isActive || isDone)}>{isDone ? '✓' : '2'}</span>
          Recebimento Provisório
        </div>
        {isDone && <span style={S.badge(true)}>Concluído</span>}
        {isActive && <span style={S.badge(false)}>Aguardando</span>}
      </div>

      {isDone && recebimento && (
        <div style={S.metaGrid}>
          <InfoRow label="Responsável"    value={recebimento.responsavel_recebimento} />
          <InfoRow label="Nota Fiscal"    value={recebimento.numero_nf} />
          <InfoRow label="Qtd. Recebida"  value={recebimento.quantidade_recebida} />
          <InfoRow label="Data Recebimento" value={fmtDate(recebimento.data_recebimento_provisorio)} />
          {recebimento.observacoes_gerais && <InfoRow label="Observações" value={recebimento.observacoes_gerais} />}
        </div>
      )}

      {isActive && (
        <div style={{ padding: 20 }}>
          <FormError msg={error} />
          <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Responsável pelo Recebimento *</label>
              <input style={S.input} value={form.responsavel_recebimento} onChange={e => set('responsavel_recebimento', e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div>
              <label style={S.label}>Número da Nota Fiscal *</label>
              <input style={S.input} value={form.numero_nf} onChange={e => set('numero_nf', e.target.value)} placeholder="Ex: NF-001234" />
            </div>
          </div>
          <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Quantidade Recebida *</label>
              <input type="number" min="1" style={S.input} value={form.quantidade_recebida} onChange={e => set('quantidade_recebida', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Data do Recebimento</label>
              <input type="date" style={S.input} value={form.data_recebimento_provisorio} onChange={e => set('data_recebimento_provisorio', e.target.value)} />
            </div>
          </div>
          <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Observações Embalagem</label>
              <textarea style={{ ...S.textarea, minHeight: 60 }} value={form.observacoes_embalagem} onChange={e => set('observacoes_embalagem', e.target.value)} placeholder="Estado da embalagem..." />
            </div>
            <div>
              <label style={S.label}>Observações Gerais</label>
              <textarea style={{ ...S.textarea, minHeight: 60 }} value={form.observacoes_gerais} onChange={e => set('observacoes_gerais', e.target.value)} placeholder="Observações adicionais..." />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={S.btnPrimary} onClick={submit} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar Recebimento'}
            </button>
          </div>
        </div>
      )}

      {!isActive && !isDone && (
        <p style={{ padding: 20, color: '#9ca3af', fontSize: 13, margin: 0 }}>Aguardando confirmação de agendamento.</p>
      )}
    </div>
  );
}

// ── Section 3: Testes Técnicos ────────────────────────────────────────────────

const RESULTADO_OPTIONS = [
  { value: 'conforme',    label: 'Conforme — todos os itens aprovados' },
  { value: 'com_desvios', label: 'Com Desvios — aprovado com ressalvas' },
  { value: 'nao_conforme',label: 'Não Conforme — reprovado' },
];

function TestesSection({ id, status, recebimento, onRefresh }: { id: string; status: string; recebimento: any; onRefresh: () => void }) {
  const isActive = status === 'recebimento_provisorio';
  const isDone   = statusGte(status, 'recebimento_testado_conforme') || status === 'recebimento_rejeitado';
  const [form, setForm] = useState({
    resultado_geral: '', responsavel_teste: '', descricao_desvios: '', acao_desvios: '',
    teste_funcionamento_basico: false, processador_validado: false,
    memoria_ram_validada: false, armazenamento_validado: false,
    conectividade_validada: false, software_licencas_validados: false,
    documentacao_validada: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.resultado_geral) { setError('Resultado geral é obrigatório.'); return; }
    if ((form.resultado_geral === 'com_desvios' || form.resultado_geral === 'nao_conforme') && !form.descricao_desvios) {
      setError('Descrição dos desvios é obrigatória para resultados com desvios ou não conformes.');
      return;
    }
    setSaving(true); setError(null);
    try {
      await geproService.registrarTestes(id, form as any);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao registrar testes.');
      setSaving(false);
    }
  };

  const checks = [
    { key: 'teste_funcionamento_basico',  label: 'Funcionamento Básico' },
    { key: 'processador_validado',        label: 'Processador' },
    { key: 'memoria_ram_validada',        label: 'Memória RAM' },
    { key: 'armazenamento_validado',      label: 'Armazenamento' },
    { key: 'conectividade_validada',      label: 'Conectividade (rede/USB)' },
    { key: 'software_licencas_validados', label: 'Software / Licenças' },
    { key: 'documentacao_validada',       label: 'Documentação inclusa' },
  ];

  return (
    <div style={S.section}>
      <div style={S.sectionHeader(isActive || isDone)}>
        <div>
          <span style={S.step(isActive || isDone)}>{isDone ? '✓' : '3'}</span>
          Testes Técnicos
        </div>
        {isDone && status !== 'recebimento_rejeitado' && <span style={S.badge(true)}>Concluído</span>}
        {status === 'recebimento_rejeitado' && <span style={{ ...S.badge(false), background: '#fee2e2', color: '#991b1b' }}>Reprovado</span>}
        {isActive && <span style={S.badge(false)}>Aguardando</span>}
      </div>

      {isDone && recebimento?.teste_tecnico && (
        <div style={S.metaGrid}>
          <InfoRow label="Resultado"    value={recebimento.teste_tecnico.resultado_geral} />
          <InfoRow label="Responsável"  value={recebimento.teste_tecnico.responsavel_teste} />
          <InfoRow label="Concluído em" value={fmtDate(recebimento.teste_tecnico.data_conclusao_testes)} />
          {recebimento.teste_tecnico.descricao_desvios && (
            <InfoRow label="Desvios" value={recebimento.teste_tecnico.descricao_desvios} />
          )}
        </div>
      )}

      {isActive && (
        <div style={{ padding: 20 }}>
          <FormError msg={error} />
          <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Resultado Geral *</label>
              <select style={S.select} value={form.resultado_geral} onChange={e => set('resultado_geral', e.target.value)}>
                <option value="">Selecione...</option>
                {RESULTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Responsável pelo Teste</label>
              <input style={S.input} value={form.responsavel_teste} onChange={e => set('responsavel_teste', e.target.value)} placeholder="Nome do técnico" />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Itens Verificados</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 0' }}>
              {checks.map(c => (
                <div key={c.key} style={S.checkRow}>
                  <input
                    type="checkbox"
                    id={c.key}
                    checked={(form as any)[c.key]}
                    onChange={e => set(c.key, e.target.checked)}
                    style={{ width: 14, height: 14, cursor: 'pointer' }}
                  />
                  <label htmlFor={c.key} style={{ fontSize: 12, color: '#374151', cursor: 'pointer' }}>{c.label}</label>
                </div>
              ))}
            </div>
          </div>

          {(form.resultado_geral === 'com_desvios' || form.resultado_geral === 'nao_conforme') && (
            <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
              <div>
                <label style={S.label}>Descrição dos Desvios *</label>
                <textarea style={{ ...S.textarea, minHeight: 70 }} value={form.descricao_desvios} onChange={e => set('descricao_desvios', e.target.value)} placeholder="Descreva os desvios encontrados..." />
              </div>
              <div>
                <label style={S.label}>Ação sobre os Desvios</label>
                <textarea style={{ ...S.textarea, minHeight: 70 }} value={form.acao_desvios} onChange={e => set('acao_desvios', e.target.value)} placeholder="Ação tomada ou proposta..." />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={S.btnPrimary} onClick={submit} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar Testes'}
            </button>
          </div>
        </div>
      )}

      {!isActive && !isDone && (
        <p style={{ padding: 20, color: '#9ca3af', fontSize: 13, margin: 0 }}>Aguardando recebimento provisório.</p>
      )}
    </div>
  );
}

// ── Section 4: Encerramento ───────────────────────────────────────────────────

function EncerramentoSection({ id, status, onRefresh }: { id: string; status: string; onRefresh: () => void }) {
  const canRegister  = status === 'recebimento_testado_conforme';
  const canFinalizar = status === 'encerramento_pagamento_realizado';
  const isDone       = status === 'encerramento_finalizado';
  const isActive     = canRegister || canFinalizar || isDone;
  const [encerramento, setEncerramento] = useState<any>(null);

  const [regForm, setRegForm] = useState({ data_confirmacao_pagamento: '', numero_patrimonio_sga: '', observacoes_encerramento: '' });
  const [finForm, setFinForm] = useState({ relatorio_conclusao: '', licoes_aprendidas: '', recomendacoes_futuras: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      geproService.getEncerramento(id).then(setEncerramento).catch(() => {});
    }
  }, [id, isActive]);

  const setReg = (k: string, v: string) => setRegForm(f => ({ ...f, [k]: v }));
  const setFin = (k: string, v: string) => setFinForm(f => ({ ...f, [k]: v }));

  const submitReg = async () => {
    setSaving(true); setError(null);
    try {
      await geproService.registrarEncerramento(id, regForm as any);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao registrar encerramento.');
      setSaving(false);
    }
  };

  const submitFin = async () => {
    setSaving(true); setError(null);
    try {
      await geproService.finalizarDemanda(id, finForm as any);
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao finalizar demanda.');
      setSaving(false);
    }
  };

  return (
    <div style={S.section}>
      <div style={S.sectionHeader(isActive)}>
        <div>
          <span style={S.step(isActive)}>{isDone ? '✓' : '4'}</span>
          Encerramento
        </div>
        {isDone && <span style={S.badge(true)}>Finalizado</span>}
        {canRegister && <span style={S.badge(false)}>Aguardando confirmação de pagamento</span>}
        {canFinalizar && <span style={S.badge(false)}>Aguardando finalização</span>}
      </div>

      {(canFinalizar || isDone) && encerramento && (
        <div style={S.metaGrid}>
          <InfoRow label="Confirmação de Pagamento" value={fmtDate(encerramento.data_confirmacao_pagamento)} />
          <InfoRow label="Patrimônio SGA"           value={encerramento.numero_patrimonio_sga} />
          <InfoRow label="Status Pagamento"         value={encerramento.status_pagamento} />
          {encerramento.observacoes_encerramento && <InfoRow label="Observações" value={encerramento.observacoes_encerramento} />}
          {isDone && encerramento.relatorio_conclusao && <InfoRow label="Relatório" value={encerramento.relatorio_conclusao} />}
          {isDone && encerramento.licoes_aprendidas   && <InfoRow label="Lições Aprendidas" value={encerramento.licoes_aprendidas} />}
          {isDone && encerramento.recomendacoes_futuras && <InfoRow label="Recomendações" value={encerramento.recomendacoes_futuras} />}
          {isDone && encerramento.data_finalizacao && <InfoRow label="Finalizado em" value={fmtDateTime(encerramento.data_finalizacao)} />}
        </div>
      )}

      {canRegister && (
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 16 }}>Confirme o pagamento para iniciar o encerramento da demanda.</p>
          <FormError msg={error} />
          <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Data Confirmação de Pagamento</label>
              <input type="date" style={S.input} value={regForm.data_confirmacao_pagamento} onChange={e => setReg('data_confirmacao_pagamento', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Nº Patrimônio SGA</label>
              <input style={S.input} value={regForm.numero_patrimonio_sga} onChange={e => setReg('numero_patrimonio_sga', e.target.value)} placeholder="Número do patrimônio no SGA" />
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Observações</label>
            <textarea style={S.textarea} value={regForm.observacoes_encerramento} onChange={e => setReg('observacoes_encerramento', e.target.value)} placeholder="Observações sobre o encerramento..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={S.btnPrimary} onClick={submitReg} disabled={saving}>
              {saving ? 'Registrando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </div>
      )}

      {canFinalizar && (
        <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 16 }}>Finalize a demanda registrando o relatório de conclusão.</p>
          <FormError msg={error} />
          <div style={S.formGroup}>
            <label style={S.label}>Relatório de Conclusão</label>
            <textarea style={S.textarea} value={finForm.relatorio_conclusao} onChange={e => setFin('relatorio_conclusao', e.target.value)} placeholder="Descreva os resultados alcançados..." />
          </div>
          <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Lições Aprendidas</label>
              <textarea style={S.textarea} value={finForm.licoes_aprendidas} onChange={e => setFin('licoes_aprendidas', e.target.value)} placeholder="O que pode ser melhorado..." />
            </div>
            <div>
              <label style={S.label}>Recomendações Futuras</label>
              <textarea style={S.textarea} value={finForm.recomendacoes_futuras} onChange={e => setFin('recomendacoes_futuras', e.target.value)} placeholder="Sugestões para próximas aquisições..." />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={S.btnPrimary} onClick={submitFin} disabled={saving}>
              {saving ? 'Finalizando...' : 'Finalizar Demanda'}
            </button>
          </div>
        </div>
      )}

      {!isActive && (
        <p style={{ padding: 20, color: '#9ca3af', fontSize: 13, margin: 0 }}>Aguardando conclusão dos testes técnicos.</p>
      )}
    </div>
  );
}

// ── Fase4Page ─────────────────────────────────────────────────────────────────

export default function Fase4Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [demanda, setDemanda] = useState<any>(null);
  const [recebimento, setRecebimento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const dem = await geproService.getDemanda(id);
      setDemanda(dem);
      const rec = await geproService.getRecebimento(id).catch(() => null);
      setRecebimento(rec);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao carregar demanda.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p style={{ color: '#6b7280', fontSize: 13, padding: 24 }}>Carregando...</p>;
  if (error)   return <p style={{ color: '#dc2626', fontSize: 13, padding: 24 }}>{error}</p>;
  if (!demanda) return null;

  const status: string = demanda.status;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Breadcrumb */}
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
        <Link to="/gepro/dashboard" style={{ color: '#9ca3af', textDecoration: 'none' }}>← Dashboard</Link>
        {' / '}
        <Link to={`/gepro/demandas/${id}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>{demanda.numero_demanda}</Link>
        {' / Fase 4 — Entrega e Recebimento'}
      </p>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
          {demanda.titulo}
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
          {demanda.numero_demanda} · {demanda.tipo_equipamento} × {demanda.quantidade}
        </p>
      </div>

      <AgendamentoSection  id={id!} status={status} onRefresh={load} />
      <RecebimentoSection  id={id!} status={status} onRefresh={load} />
      <TestesSection       id={id!} status={status} recebimento={recebimento} onRefresh={load} />
      <EncerramentoSection id={id!} status={status} onRefresh={load} />

      {status === 'encerramento_finalizado' && (
        <div style={{ textAlign: 'center', padding: 24, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 4, marginTop: 8 }}>
          <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#15803d' }}>Demanda encerrada com sucesso!</p>
          <button style={S.btnPrimary} onClick={() => navigate('/gepro/dashboard')}>
            Voltar ao Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
