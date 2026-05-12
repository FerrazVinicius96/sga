const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { logAudit } = require('../utils/logger');

exports.login = async (email, password, ipAddress) => {
	// 1. Validação de presença de dados
	if (!email || !password) {
		await logAudit(
			null,
			'login_failed',
			'user',
			null,
			{ reason: 'Missing credentials', email },
			ipAddress,
		);
		const error = new Error('Email e senha são obrigatórios.');
		error.statusCode = 400;
		throw error;
	}

	// 2. Busca o usuário no banco de dados
	const user = await userRepository.findByEmail(email);
	if (!user) {
		await logAudit(
			null,
			'login_failed',
			'user',
			null,
			{ reason: 'User not found', email },
			ipAddress,
		);
		const error = new Error('Credenciais inválidas.');
		error.statusCode = 401;
		throw error;
	}

	// 3. Verifica a senha com bcrypt
	const isPasswordValid = await bcrypt.compare(password, user.password_hash);
	if (!isPasswordValid) {
		await logAudit(
			user.id,
			'login_failed',
			'user',
			user.id,
			{ reason: 'Incorrect password', email },
			ipAddress,
		);
		const error = new Error('Credenciais inválidas.');
		error.statusCode = 401;
		throw error;
	}

	// 4. Verifica se a conta está ativa
	if (!user.is_active) {
		await logAudit(
			user.id,
			'login_failed',
			'user',
			user.id,
			{ reason: 'Account is deactivated', email },
			ipAddress,
		);
		const error = new Error(
			'Sua conta está desativada. Entre em contato com o administrador.',
		);
		error.statusCode = 403;
		throw error;
	}

	// 5. Gera o Token JWT
	const token = jwt.sign(
		{ id: user.id, role: user.role },
		process.env.JWT_SECRET,
		{ expiresIn: '1d' }, // Você pode mover esse '1d' para o .env futuramente
	);

	// 6. Segurança: Remove o hash da senha antes de retornar os dados
	const { password_hash, ...userWithoutPassword } = user;

	return {
		user: userWithoutPassword,
		token,
	};
};
