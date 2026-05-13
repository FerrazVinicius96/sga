const express = require('express');
const router = express.Router();
const demandasController = require('../../controllers/gepro/demandasController');
const { authenticateToken, authorizePermission } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/bifurcacao');

const gepro = [authenticateToken, requireSistema];

router.post(
	'/',
	...gepro,
	authorizePermission('GEPRO_CRIAR_DEMANDA'),
	demandasController.criar,
);

router.get(
	'/',
	...gepro,
	demandasController.listar,
);

router.get(
	'/fila-aprovacoes',
	...gepro,
	authorizePermission('GEPRO_APROVAR_DEMANDA'),
	demandasController.filaAprovacoes,
);

router.get(
	'/:id',
	...gepro,
	demandasController.obter,
);

router.patch(
	'/:id/aprovar',
	...gepro,
	authorizePermission('GEPRO_APROVAR_DEMANDA'),
	demandasController.aprovar,
);

router.patch(
	'/:id/rejeitar',
	...gepro,
	authorizePermission('GEPRO_APROVAR_DEMANDA'),
	demandasController.rejeitar,
);

module.exports = router;
