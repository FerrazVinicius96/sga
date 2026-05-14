const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../../repositories/sga/userRepository');
const { logAudit } = require('../../utils/logger');

exports.login = async (email, password, ipAddress) => {
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

	const token = jwt.sign(
		{ id: user.id, role: user.role },
		process.env.JWT_SECRET,
		{ expiresIn: '1d' },
	);

	const { password_hash, ...userWithoutPassword } = user;

	return {
		user: userWithoutPassword,
		token,
	};
};

exports.logout = async (userId, ipAddress) => {
	await logAudit(userId, 'logout', 'user', userId, {}, ipAddress);
};

exports.verifyToken = async (userId) => {
	const user = await userRepository.findById(userId);

	if (!user) {
		const error = new Error('Usuário não encontrado.');
		error.statusCode = 401;
		throw error;
	}

	if (!user.is_active) {
		const error = new Error(
			'Sua conta está desativada. Entre em contato com o administrador.',
		);
		error.statusCode = 403;
		throw error;
	}

	const { password_hash, ...userWithoutPassword } = user;
	return { user: userWithoutPassword };
};
