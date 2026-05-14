const express = require('express');
const router = express.Router();
const templatesController = require('../../controllers/gepro/templatesController');
const { authenticateToken, authorizePermission } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/bifurcacao');

const gepro = [authenticateToken, requireSistema];

// GET /api/gepro/templates/:tipo/ativo — retorna template ativo (etp ou tr)
router.get('/:tipo/ativo', ...gepro, templatesController.obterAtivo);

// GET /api/gepro/templates/:tipo — lista histórico de versões
router.get('/:tipo', ...gepro, authorizePermission('GEPRO_ADMIN'), templatesController.listar);

// POST /api/gepro/templates/:tipo — publica nova versão (admin)
router.post('/:tipo', ...gepro, authorizePermission('GEPRO_ADMIN'), templatesController.publicar);

// POST /api/gepro/templates/:tipo/validar — valida dados contra template ativo
router.post('/:tipo/validar', ...gepro, templatesController.validar);

module.exports = router;
