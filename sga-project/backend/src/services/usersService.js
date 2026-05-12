const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { logAudit } = require('../utils/logger');

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
