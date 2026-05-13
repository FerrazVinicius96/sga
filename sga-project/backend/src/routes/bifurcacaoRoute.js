const express = require('express');
const router = express.Router();
const bifurcacaoController = require('../controllers/bifurcacaoController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, bifurcacaoController.getSistemas);

module.exports = router;
