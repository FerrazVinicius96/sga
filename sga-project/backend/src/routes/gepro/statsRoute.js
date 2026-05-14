const express = require('express');
const router = express.Router();
const statsController = require('../../controllers/gepro/statsController');
const { authenticateToken } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/bifurcacao');

router.get('/', authenticateToken, requireSistema, statsController.obter);

module.exports = router;
