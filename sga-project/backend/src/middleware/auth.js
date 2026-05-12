const jwt = require('jsonwebtoken');
const path = require('path');
const { PERMISSIONS } = require('../constants/permissions');

// CORREÇÃO 1: Importação do logAudit adicionada (ajuste o caminho conforme sua estrutura)
const { logAudit } = require('../utils/logger');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

exports.authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

	if (token == null) {
		return res
			.status(401)
			.json({ message: 'Token não fornecido. Acesso negado.' });
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) {
			// Se o token for inválido ou expirado
			return res
				.status(403)
				.json({ message: 'Token inválido ou expirado.' });
		}
		req.user = user; // Anexa o payload do JWT ao objeto request
		next(); // Procede para a próxima função middleware/rota
	});
};

exports.authorizeRole = (roles) => {
	// Adicionado 'async' para suportar o await no logAudit
	return async (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			await logAudit(
				req.user.id,
				'unauthorized_access',
				'role_check',
				null,
				{
					attempted_role: req.user.role,
					required_roles: roles,
					path: req.path,
				},
				req.ip,
			);
			return res.status(403).json({
				message:
					'Acesso negado. Você não tem permissão para realizar esta ação.',
			});
		}
		next();
	};
};

exports.authorizePermission = (permission) => {
	// Adicionado 'async' para suportar o await no logAudit
	return async (req, res, next) => {
		// ETAPA 1: VERIFICAÇÃO DE SEGURANÇA ADICIONADA
		// Garante que o middleware de autenticação foi executado corretamente
		// e que o objeto req.user e sua propriedade 'role' existem.
		if (!req.user || typeof req.user.role === 'undefined') {
			await logAudit(
				null,
				'authorization_error',
				'permission_check',
				null,
				{ reason: 'User object not found in request', path: req.path },
				req.ip,
			);
			// Retorna um erro 500 porque esta é uma falha interna inesperada, não um erro de permissão do usuário.
			return res.status(500).json({
				message:
					'Erro de autenticação interna. O usuário não pôde ser verificado.',
			});
		}

		const userRole = req.user.role;
		const allowedRoles = PERMISSIONS[permission];

		// ETAPA 2: A LÓGICA DE PERMISSÃO PERMANECE A MESMA
		if (allowedRoles && allowedRoles.includes(userRole)) {
			next(); // Permissão concedida
		} else {
			// Permissão negada
			await logAudit(
				req.user.id,
				'unauthorized_access',
				'permission_check',
				null,
				{
					// CORREÇÃO 2: Alterado de 'permissionKey' para 'permission' (o parâmetro recebido)
					required_permission: permission,
					user_role: userRole,
					path: req.path,
				},
				req.ip,
			);
			return res.status(403).json({
				message:
					'Acesso negado. Você não tem permissão para realizar esta ação.',
			});
		}
	};
};
