const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post(
	'/register',
	authenticateToken,
	authorizeRole(['admin', 'super_admin']),
	usersController.register,
);

module.exports = router;
