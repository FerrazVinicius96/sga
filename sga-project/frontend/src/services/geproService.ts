import api from './api';

const geproHeaders = { 'X-Sistema': 'gepro' };
const cfg = (extra?: Record<string, unknown>) => ({ headers: geproHeaders, ...extra });

export const getDemanda = (id: string | number) =>
  api.get(`/gepro/demandas/${id}`, cfg()).then((r) => r.data.data ?? r.data);

export const listarDemandas = (params?: Record<string, string>) =>
  api.get('/gepro/demandas', cfg({ params })).then((r) => r.data.data ?? r.data);

export const getFase2 = (id: string | number) =>
  api.get(`/gepro/demandas/${id}/fase2`, cfg()).then((r) => r.data.data);

export const submitETP = (id: string | number, dados: Record<string, unknown>) =>
  api.post(`/gepro/demandas/${id}/fase2/etp`, dados, cfg()).then((r) => r.data.data);

export const submitTR = (id: string | number, dados: Record<string, unknown>) =>
  api.post(`/gepro/demandas/${id}/fase2/tr`, dados, cfg()).then((r) => r.data.data);

export const getChecklist = (id: string | number) =>
  api.get(`/gepro/demandas/${id}/fase2/checklist`, cfg()).then((r) => r.data.data);

export const encaminhar = (id: string | number) =>
  api.patch(`/gepro/demandas/${id}/fase2/encaminhar`, {}, cfg()).then((r) => r.data.data);

export const getFornecedores = () =>
  api.get('/gepro/fornecedores', cfg()).then((r) => r.data.data);

export const addCotacao = (id: string | number, dados: Record<string, unknown>) =>
  api.post(`/gepro/demandas/${id}/cotacoes`, dados, cfg()).then((r) => r.data.data ?? r.data);

export const selecionarVencedor = (id: string | number, cotacaoId: number) =>
  api
    .patch(`/gepro/demandas/${id}/cotacoes/${cotacaoId}/selecionar-vencedor`, {}, cfg())
    .then((r) => r.data.data ?? r.data);

// ── Fase 1 ────────────────────────────────────────────────────
export const criarDemanda = (dados: Record<string, unknown>) =>
  api.post('/gepro/demandas', dados, cfg()).then((r) => r.data.data);

export const aprovar = (id: string | number, observacoes?: string) =>
  api.patch(`/gepro/demandas/${id}/aprovar`, { observacoes }, cfg()).then((r) => r.data.data);

export const rejeitar = (id: string | number, observacoes: string) =>
  api.patch(`/gepro/demandas/${id}/rejeitar`, { observacoes }, cfg()).then((r) => r.data.data);

export const filaAprovacoes = () =>
  api.get('/gepro/demandas/fila-aprovacoes', cfg()).then((r) => r.data.data);

// ── Stats ─────────────────────────────────────────────────────
export const getStats = () =>
  api.get('/gepro/stats', cfg()).then((r) => r.data.data);

// ── Observações ───────────────────────────────────────────────
export const addObservacao = (id: string | number, conteudo: string) =>
  api.post(`/gepro/demandas/${id}/observacoes`, { conteudo }, cfg()).then((r) => r.data.data);

export const listarObservacoes = (id: string | number) =>
  api.get(`/gepro/demandas/${id}/observacoes`, cfg()).then((r) => r.data.data);

// ── Fase 4B: Recebimento ──────────────────────────────────────
export const registrarRecebimento = (id: string | number, dados: Record<string, unknown>) =>
  api.post(`/gepro/demandas/${id}/fase4/recebimento`, dados, cfg()).then((r) => r.data.data);

export const registrarTestes = (id: string | number, dados: Record<string, unknown>) =>
  api.post(`/gepro/demandas/${id}/fase4/testes`, dados, cfg()).then((r) => r.data.data);

export const getRecebimento = (id: string | number) =>
  api.get(`/gepro/demandas/${id}/fase4/recebimento`, cfg()).then((r) => r.data.data);

// ── Fase 5: Encerramento ──────────────────────────────────────
export const registrarEncerramento = (id: string | number, dados: Record<string, unknown>) =>
  api.post(`/gepro/demandas/${id}/fase5/encerramento`, dados, cfg()).then((r) => r.data.data);

export const finalizarDemanda = (id: string | number, dados: Record<string, unknown>) =>
  api.patch(`/gepro/demandas/${id}/fase5/finalizar`, dados, cfg()).then((r) => r.data.data);

export const getEncerramento = (id: string | number) =>
  api.get(`/gepro/demandas/${id}/fase5/encerramento`, cfg()).then((r) => r.data.data);

// ── Fase 4A: Agendamento ──────────────────────────────────────
export const agendar = (id: string | number, dados: Record<string, unknown>) =>
  api.post(`/gepro/demandas/${id}/fase4/agendamento`, dados, cfg()).then((r) => r.data.data ?? r.data);

export const getAgendamento = (id: string | number) =>
  api.get(`/gepro/demandas/${id}/fase4/agendamento`, cfg()).then((r) => r.data.data);

// ── GPOT: Emissão de Nota de Empenho ──────────────────────────
export const emitirNE = (id: string | number) =>
  api.patch(`/gepro/demandas/${id}/notificar-agendamento`, {}, cfg()).then((r) => r.data.data);

// ── Fornecedores ──────────────────────────────────────────────
export const criarFornecedor = (dados: Record<string, unknown>) =>
  api.post('/gepro/fornecedores', dados, cfg()).then((r) => r.data.data);

export const atualizarFornecedor = (id: number, dados: Record<string, unknown>) =>
  api.patch(`/gepro/fornecedores/${id}`, dados, cfg()).then((r) => r.data.data);
