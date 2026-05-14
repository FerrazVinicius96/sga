const bcrypt = require('bcryptjs');
const userRepository = require('../../repositories/sga/userRepository');
const { logAudit } = require('../../utils/logger');
const { generateRandomPassword } = require('../../utils/generatePassword');

exports.register = async (
	username,
	email,
	password,
	full_name,
	role,
	job_title,
	registration_number,
	cpf,
	unit_id,
	requestingUserId,
	ipAddress,
) => {
	const existingUser = await userRepository.findByEmail(email);
	if (existingUser) {
		const err = new Error('Email já cadastrado');
		err.statusCode = 409;
		throw err;
	}

	const salt = await bcrypt.genSalt(10);
	const passwordHash = await bcrypt.hash(password, salt);

	const newUser = await userRepository.register(
		username,
		email,
		passwordHash,
		full_name,
		role,
		job_title,
		registration_number,
		cpf,
		unit_id,
	);

	await logAudit(
		requestingUserId,
		'user_created',
		'user',
		newUser.id,
		{ email, role },
		ipAddress,
	);

	return newUser;
};

exports.list = async (filters) => {
	const { role, is_active, search } = filters;

	const normalizedFilters = {
		role: role || undefined,
		is_active: is_active !== undefined ? is_active === 'true' || is_active === true : undefined,
		search: search || undefined,
	};

	return userRepository.findAll(normalizedFilters);
};

exports.getById = async (id) => {
	const user = await userRepository.findById(id);
	if (!user) {
		const err = new Error('Usuário não encontrado.');
		err.statusCode = 404;
		throw err;
	}

	const { password_hash, ...sanitized } = user;
	return sanitized;
};

exports.update = async (id, data, requestingUserId, ipAddress) => {
	const target = await userRepository.findById(id);
	if (!target) {
		const err = new Error('Usuário não encontrado.');
		err.statusCode = 404;
		throw err;
	}

	if (data.email && data.email !== target.email) {
		const existing = await userRepository.findByEmail(data.email);
		if (existing) {
			const err = new Error('Email já cadastrado.');
			err.statusCode = 409;
			throw err;
		}
	}

	const updated = await userRepository.update(id, {
		email: data.email ?? target.email,
		full_name: data.full_name ?? target.full_name,
		role: data.role ?? target.role,
		job_title: data.job_title ?? target.job_title,
		registration_number: data.registration_number ?? target.registration_number,
		cpf: data.cpf ?? target.cpf,
		unit_id: data.unit_id ?? target.unit_id,
	});

	await logAudit(
		requestingUserId,
		'user_updated',
		'user',
		id,
		{ fields: Object.keys(data) },
		ipAddress,
	);

	return updated;
};

exports.resetPassword = async (id, requestingUserId, ipAddress) => {
	const target = await userRepository.findById(id);
	if (!target) {
		const err = new Error('Usuário não encontrado.');
		err.statusCode = 404;
		throw err;
	}

	const newPassword = generateRandomPassword();
	const salt = await bcrypt.genSalt(10);
	const passwordHash = await bcrypt.hash(newPassword, salt);

	await userRepository.updatePassword(id, passwordHash);

	await logAudit(
		requestingUserId,
		'user_password_reset',
		'user',
		id,
		{ target_email: target.email },
		ipAddress,
	);

	return newPassword;
};

exports.activate = async (id, requestingUserId, ipAddress) => {
	const target = await userRepository.findById(id);
	if (!target) {
		const err = new Error('Usuário não encontrado.');
		err.statusCode = 404;
		throw err;
	}

	await userRepository.setActiveStatus(id, true);

	await logAudit(
		requestingUserId,
		'user_activated',
		'user',
		id,
		{ target_email: target.email },
		ipAddress,
	);
};

exports.deactivate = async (id, requestingUserId, ipAddress) => {
	const target = await userRepository.findById(id);
	if (!target) {
		const err = new Error('Usuário não encontrado.');
		err.statusCode = 404;
		throw err;
	}

	await userRepository.setActiveStatus(id, false);

	await logAudit(
		requestingUserId,
		'user_deactivated',
		'user',
		id,
		{ target_email: target.email },
		ipAddress,
	);
};

exports.remove = async (id, requestingUserId, ipAddress) => {
	const target = await userRepository.findById(id);
	if (!target) {
		const err = new Error('Usuário não encontrado.');
		err.statusCode = 404;
		throw err;
	}

	await userRepository.deleteById(id);

	await logAudit(
		requestingUserId,
		'user_deleted',
		'user',
		id,
		{ target_email: target.email, target_role: target.role },
		ipAddress,
	);
};
