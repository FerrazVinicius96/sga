const express = require('express');
const router = express.Router();
const fornecedoresController = require('../../controllers/gepro/fornecedoresController');
const { authenticateToken, authorizePermission } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/bifurcacao');

router.get('/',    authenticateToken, requireSistema,                                    fornecedoresController.listar);
router.post('/',   authenticateToken, requireSistema, authorizePermission('GEPRO_ADMIN'), fornecedoresController.criar);
router.patch('/:id', authenticateToken, requireSistema, authorizePermission('GEPRO_ADMIN'), fornecedoresController.atualizar);

module.exports = router;
