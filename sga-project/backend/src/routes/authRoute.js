const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Importando os middlewares que você forneceu
const {
	authenticateToken,
	authorizeRole,
	authorizePermission,
} = require('../middleware/auth');

// --------------------------------------------------------
// 1. ROTA PÚBLICA (Sem Middleware)
// --------------------------------------------------------
router.post('/login', authController.login);

// // --------------------------------------------------------
// // 2. ROTA PROTEGIDA SIMPLES (Qualquer usuário logado)
// // --------------------------------------------------------
// // O authenticateToken garante que o req.user seja preenchido
// router.get('/me', authenticateToken, authController.getCurrentUser);

// // --------------------------------------------------------
// // 3. ROTA PROTEGIDA POR ROLE (Ex: Apenas Administradores)
// // --------------------------------------------------------
// // Note a ordem: PRIMEIRO autentica, DEPOIS autoriza
// router.get(
// 	'/admin/dashboard',
// 	authenticateToken,
// 	authorizeRole(['admin', 'super_admin']),
// 	authController.getAdminDashboard,
// );

// // --------------------------------------------------------
// // 4. ROTA PROTEGIDA POR PERMISSÃO ESPECÍFICA
// // --------------------------------------------------------
// router.post(
// 	'/users',
// 	authenticateToken,
// 	authorizePermission('CREATE_USER'), // Usa a chave do seu PERMISSIONS
// 	authController.createUser,
// );

module.exports = router;
