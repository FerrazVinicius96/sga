const express = require('express');
const router = express.Router();
const demandasController = require('../../controllers/gepro/demandasController');
const fase2Controller = require('../../controllers/gepro/fase2Controller');
const agendamentoController = require('../../controllers/gepro/agendamentoController');
const recebimentoController = require('../../controllers/gepro/recebimentoController');
const encerramentoController = require('../../controllers/gepro/encerramentoController');
const { authenticateToken, authorizePermission } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/bifurcacao');

const gepro = [authenticateToken, requireSistema];

// ── Fase 1: Demandas ──────────────────────────────────────────
router.post('/', ...gepro, authorizePermission('GEPRO_CRIAR_DEMANDA'), demandasController.criar);
router.get('/', ...gepro, demandasController.listar);
router.get('/fila-aprovacoes', ...gepro, authorizePermission('GEPRO_APROVAR_DEMANDA'), demandasController.filaAprovacoes);
router.get('/:id', ...gepro, demandasController.obter);
router.patch('/:id/aprovar', ...gepro, authorizePermission('GEPRO_APROVAR_DEMANDA'), demandasController.aprovar);
router.patch('/:id/rejeitar', ...gepro, authorizePermission('GEPRO_APROVAR_DEMANDA'), demandasController.rejeitar);

// ── Fase 2: Cotações ──────────────────────────────────────────
router.post('/:id/cotacoes', ...gepro, authorizePermission('GEPRO_COTACOES'), demandasController.adicionarCotacao);
router.get('/:id/cotacoes', ...gepro, demandasController.listarCotacoes);
router.patch('/:id/cotacoes/:cotacaoId/selecionar-vencedor', ...gepro, authorizePermission('GEPRO_COTACOES'), demandasController.selecionarVencedor);

// ── Fase 2: Instrução Técnica ──────────────────────────────────
router.get('/:id/fase2', ...gepro, fase2Controller.obterFase2);
router.post('/:id/fase2/etp', ...gepro, authorizePermission('GEPRO_INSTRUCAO_TECNICA'), fase2Controller.submeterETP);
router.post('/:id/fase2/tr', ...gepro, authorizePermission('GEPRO_INSTRUCAO_TECNICA'), fase2Controller.submeterTR);
router.get('/:id/fase2/checklist', ...gepro, fase2Controller.checklist);
router.patch('/:id/fase2/encaminhar', ...gepro, authorizePermission('GEPRO_INSTRUCAO_TECNICA'), fase2Controller.encaminhar);

// ── Fase 3/GPOT: Nota de Empenho (invisível para gerência) ────
router.patch('/:id/notificar-agendamento', ...gepro, authorizePermission('GEPRO_EMITIR_NE'), fase2Controller.emitirNotaEmpenho);

// ── Fase 4A: Agendamento de Entrega ───────────────────────────
router.post('/:id/fase4/agendamento',  ...gepro, authorizePermission('GEPRO_AGENDAMENTO'),  agendamentoController.agendar);
router.get('/:id/fase4/agendamento',   ...gepro,                                            agendamentoController.obter);

// ── Fase 4B: Recebimento ───────────────────────────────────────
router.post('/:id/fase4/recebimento',  ...gepro, authorizePermission('GEPRO_RECEBIMENTO'),  recebimentoController.registrar);
router.post('/:id/fase4/testes',       ...gepro, authorizePermission('GEPRO_RECEBIMENTO'),  recebimentoController.registrarTestes);
router.get('/:id/fase4/recebimento',   ...gepro,                                            recebimentoController.obter);

// ── Fase 5: Encerramento ───────────────────────────────────────
router.post('/:id/fase5/encerramento', ...gepro, authorizePermission('GEPRO_RECEBIMENTO'),  encerramentoController.registrar);
router.patch('/:id/fase5/finalizar',   ...gepro, authorizePermission('GEPRO_EMITIR_NE'),    encerramentoController.finalizar);
router.get('/:id/fase5/encerramento',  ...gepro,                                            encerramentoController.obter);

// ── Observações ────────────────────────────────────────────────
router.post('/:id/observacoes',  ...gepro, demandasController.adicionarObservacao);
router.get('/:id/observacoes',   ...gepro, demandasController.listarObservacoes);

module.exports = router;
