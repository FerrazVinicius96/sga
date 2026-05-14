import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as geproService from '../../services/geproService';
import { useAuth } from '../../contexts/AuthContext';

// ── helpers ───────────────────────────────────────────────────────────────────

const MODALIDADE_LABELS: Record<string, string> = {
  pregao:              'Pregão',
  concorrencia:        'Concorrência',
  ata_registro_precos: 'Ata de Registro de Preços (ARP)',
  srp:                 'SRP',
  convite:             'Convite',
};

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  necessidade_rascunho:               { label: 'Rascunho',         bg: '#f3f4f6', color: '#374151' },
  necessidade_aprovada:               { label: 'Aprovada',         bg: '#d1fae5', color: '#065f46' },
  instrucao_rascunho:                 { label: 'Instrução',        bg: '#dbeafe', color: '#1e40af' },
  instrucao_aprovada_gestor:          { label: 'Instr. Aprovada',  bg: '#d1fae5', color: '#065f46' },
  instrucao_rejeitada_gestor:         { label: 'Instr. Rejeitada', bg: '#fee2e2', color: '#991b1b' },
  encaminhamento_aguardando_juridico: { label: 'Encaminhada',      bg: '#fef3c7', color: '#92400e' },
  encaminhamento_aprovado_juridico:   { label: 'Enc. Aprovada',    bg: '#d1fae5', color: '#065f46' },
  encaminhamento_rejeitado_juridico:  { label: 'Enc. Rejeitada',   bg: '#fee2e2', color: '#991b1b' },
  agendamento_pendente:               { label: 'Ag. Pendente',     bg: '#fef3c7', color: '#92400e' },
  agendamento_confirmado:             { label: 'Ag. Confirmado',   bg: '#d1fae5', color: '#065f46' },
  recebimento_provisorio:             { label: 'Recebimento',      bg: '#dbeafe', color: '#1e40af' },
  recebimento_testado_conforme:       { label: 'Testado OK',       bg: '#d1fae5', color: '#065f46' },
  recebimento_rejeitado:              { label: 'Rejeitado',        bg: '#fee2e2', color: '#991b1b' },
  encerramento_pagamento_realizado:   { label: 'Pago',             bg: '#d1fae5', color: '#065f46' },
  encerramento_finalizado:            { label: 'Finalizado',       bg: '#1e3a8a', color: 'white'   },
};

function fmtCurrency(v: unknown) {
  if (v == null) return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR');
}

function statusFase(status: string): number {
  if (status.startsWith('necessidade')) return 1;
  if (status.startsWith('instrucao'))   return 2;
  if (status.startsWith('encaminhamento')) return 3;
  if (status.startsWith('agendamento') || status.startsWith('recebimento')) return 4;
  if (status.startsWith('encerramento')) return 5;
  return 1;
}

// ── styles ────────────────────────────────────────────────────────────────────

const S = {
  section: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 20, overflow: 'hidden' } as React.CSSProperties,
  sectionHeader: { padding: '14px 20px', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: '#1e3a8a', letterSpacing: '0.5px' },
  metaLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: '#9ca3af', letterSpacing: '0.4px', marginBottom: 3 },
  metaValue: { fontSize: 13, color: '#111827', fontWeight: 500 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical' as const, minHeight: 80, boxSizing: 'border-box' as const },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase' as const },
  btnPrimary: { padding: '8px 16px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btn: { padding: '8px 16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnWarning: { padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
};

// ── PhaseBar ──────────────────────────────────────────────────────────────────

const PHASES = ['Necessidade', 'Instrução Técnica', 'Encaminhamento', 'Recebimento', 'Encerramento'];

function PhaseBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px' }}>
      {PHASES.map((label, i) => {
        const fase = i + 1;
        const done    = fase < current;
        const active  = fase === current;
        const pending = fase > current;
        const circleColor = done ? '#059669' : active ? '#1e3a8a' : '#d1d5db';
        const textColor   = pending ? '#9ca3af' : '#374151';
        return (
          <React.Fragment key={fase}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: circleColor,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, marginBottom: 6,
              }}>
                {done ? '✓' : fase}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: textColor, textAlign: 'center', maxWidth: 72 }}>
                {label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#059669' : '#e5e7eb', marginBottom: 20 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── EmitirNEModal ─────────────────────────────────────────────────────────────

function EmitirNEModal({ demandaId, onClose, onDone }: { demandaId: string; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await geproService.emitirNE(demandaId);
      onDone();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao emitir NE.');
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 6, padding: 28, width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>Emitir Nota de Empenho</h3>
        <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 20 }}>
          Confirma a emissão da Nota de Empenho para esta demanda?
          O status será movido para <strong>Agendamento Pendente</strong>.
        </p>
        {error && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={S.btn} onClick={onClose} disabled={loading}>Cancelar</button>
          <button style={S.btnPrimary} onClick={confirm} disabled={loading}>
            {loading ? 'Emitindo...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DemandaDetail ─────────────────────────────────────────────────────────────

export default function DemandaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [demanda, setDemanda] = useState<any>(null);
  const [observacoes, setObservacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obsText, setObsText] = useState('');
  const [savingObs, setSavingObs] = useState(false);
  const [showNEModal, setShowNEModal] = useState(false);

  const canEmitirNE = user?.role === 'admin' || user?.role === 'operator';

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [dem, obs] = await Promise.all([
        geproService.getDemanda(id),
        geproService.listarObservacoes(id),
      ]);
      setDemanda(dem);
      setObservacoes(obs ?? []);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao carregar demanda.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submitObs = async () => {
    if (!obsText.trim() || obsText.trim().length < 3) return;
    setSavingObs(true);
    try {
      await geproService.addObservacao(id!, obsText.trim());
      setObsText('');
      const obs = await geproService.listarObservacoes(id!);
      setObservacoes(obs ?? []);
    } catch {
    } finally {
      setSavingObs(false);
    }
  };

  if (loading) return <p style={{ color: '#6b7280', fontSize: 13, padding: 24 }}>Carregando...</p>;
  if (error)   return <p style={{ color: '#dc2626', fontSize: 13, padding: 24 }}>{error}</p>;
  if (!demanda) return null;

  const fase    = statusFase(demanda.status);
  const badge   = STATUS_BADGE[demanda.status] ?? { label: demanda.status, bg: '#f3f4f6', color: '#374151' };
  const acomp: any[] = demanda.acompanhamento ?? [];

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
        <Link to="/gepro/dashboard" style={{ color: '#9ca3af', textDecoration: 'none' }}>← Dashboard</Link>
        {' / '}
        <span style={{ color: '#374151' }}>{demanda.numero_demanda}</span>
      </p>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{demanda.titulo}</h1>
            <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            {demanda.numero_demanda} · Criado por {demanda.criador_nome ?? '—'} em {fmtDate(demanda.data_criacao)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {demanda.status === 'necessidade_aprovada' && (
            <button style={S.btnPrimary} onClick={() => navigate(`/gepro/demandas/${id}/fase2`)}>
              Instruções Técnicas →
            </button>
          )}
          {(demanda.status === 'instrucao_rascunho' || demanda.status === 'instrucao_aprovada_gestor') && (
            <button style={S.btnPrimary} onClick={() => navigate(`/gepro/demandas/${id}/fase2`)}>
              Fase 2 →
            </button>
          )}
          {demanda.status === 'encaminhamento_aguardando_juridico' && canEmitirNE && (
            <button style={S.btnWarning} onClick={() => setShowNEModal(true)}>
              Emitir NE
            </button>
          )}
          {['agendamento_pendente','agendamento_confirmado','recebimento_provisorio',
             'recebimento_testado_conforme','encerramento_pagamento_realizado'].includes(demanda.status) && (
            <button style={S.btnPrimary} onClick={() => navigate(`/gepro/demandas/${id}/fase4`)}>
              Fase 4/5 →
            </button>
          )}
        </div>
      </div>

      {/* Phase bar */}
      <div style={S.section}>
        <PhaseBar current={fase} />
      </div>

      {/* Meta grid */}
      <div style={S.section}>
        <div style={S.sectionHeader}>Informações da Demanda</div>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          <div>
            <div style={S.metaLabel}>Modalidade</div>
            <div style={S.metaValue}>{MODALIDADE_LABELS[demanda.modalidade_licitatoria] ?? demanda.modalidade_licitatoria ?? '—'}</div>
          </div>
          <div>
            <div style={S.metaLabel}>Valor Estimado</div>
            <div style={S.metaValue}>{fmtCurrency(demanda.valor_estimado)}</div>
          </div>
          <div>
            <div style={S.metaLabel}>Equipamento / Qtd.</div>
            <div style={S.metaValue}>{demanda.tipo_equipamento ?? '—'} × {demanda.quantidade ?? '—'}</div>
          </div>
          <div>
            <div style={S.metaLabel}>Data Necessidade</div>
            <div style={S.metaValue}>{fmtDate(demanda.data_necessidade_prevista)}</div>
          </div>
          <div>
            <div style={S.metaLabel}>Setor Solicitante</div>
            <div style={S.metaValue}>{demanda.setor_solicitante ?? '—'}</div>
          </div>
          <div>
            <div style={S.metaLabel}>Gestor</div>
            <div style={S.metaValue}>{demanda.gestor_nome ?? '—'}</div>
          </div>
          <div>
            <div style={S.metaLabel}>Localidade Entrega</div>
            <div style={S.metaValue}>{demanda.localidade_entrega ?? '—'}</div>
          </div>
          <div>
            <div style={S.metaLabel}>Emergencial</div>
            <div style={S.metaValue}>{demanda.aquisicao_emergencial ? 'Sim' : 'Não'}</div>
          </div>
        </div>
        {demanda.descricao && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={S.metaLabel}>Descrição</div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>{demanda.descricao}</div>
          </div>
        )}
      </div>

      {/* Timeline + Observações side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Timeline */}
        <div style={S.section}>
          <div style={S.sectionHeader}>Histórico de Acompanhamento</div>
          <div style={{ padding: 20 }}>
            {acomp.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Nenhum registro.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {acomp.map((a: any, i: number) => (
                  <div key={a.id ?? i} style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e3a8a', marginTop: 4, flexShrink: 0 }} />
                      {i < acomp.length - 1 && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 12, color: '#111827' }}>{a.observacao}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{fmtDateTime(a.data_criacao)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        <div style={S.section}>
          <div style={S.sectionHeader}>Observações Internas</div>
          <div style={{ padding: 20 }}>
            {observacoes.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Nenhuma observação.</p>
            ) : (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {observacoes.map((o: any) => (
                  <div key={o.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: 12 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#111827' }}>{o.conteudo}</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>
                      {o.autor_nome ?? o.autor_username ?? 'Usuário'} · {fmtDateTime(o.data_criacao)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div>
              <label style={S.label}>Nova observação</label>
              <textarea
                style={{ ...S.textarea, minHeight: 70 }}
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
                placeholder="Digite uma observação interna..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  style={S.btnPrimary}
                  onClick={submitObs}
                  disabled={savingObs || obsText.trim().length < 3}
                >
                  {savingObs ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNEModal && (
        <EmitirNEModal
          demandaId={id!}
          onClose={() => setShowNEModal(false)}
          onDone={() => { setShowNEModal(false); load(); }}
        />
      )}
    </div>
  );
}
