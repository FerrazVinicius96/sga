const usersService = require('../../services/sga/usersService');
const { generateRandomPassword } = require('../../utils/generatePassword');
const {
	validateRequiredFields,
	isValidEmail,
	isValidRole,
	isValidUsername,
	isValidCPF,
} = require('../../utils/validators');

exports.register = async (req, res) => {
	const {
		username,
		email,
		full_name,
		role,
		job_title,
		registration_number,
		cpf,
		unit_id,
	} = req.body;
	let { password } = req.body;

	const missingMsg = validateRequiredFields(['username', 'email', 'full_name', 'role'], req.body);
	if (missingMsg) return res.status(400).json({ message: missingMsg });

	if (!isValidUsername(username))
		return res.status(400).json({ message: 'Username inválido. Use 3–50 caracteres: letras, números, ponto ou underscore.' });

	if (!isValidEmail(email))
		return res.status(400).json({ message: 'Formato de e-mail inválido.' });

	if (!isValidRole(role))
		return res.status(400).json({ message: 'Perfil (role) inválido.' });

	if (cpf && !isValidCPF(cpf))
		return res.status(400).json({ message: 'CPF inválido.' });

	let generatedPassword = null;
	if (!password) {
		generatedPassword = generateRandomPassword();
		password = generatedPassword;
	}

	try {
		const newUser = await usersService.register(
			username,
			email,
			password,
			full_name,
			role,
			job_title,
			registration_number,
			cpf,
			unit_id,
			req.user.id,
			req.ip,
		);

		const response = {
			message: 'Usuário registrado com sucesso',
			user: newUser,
		};
		if (generatedPassword) response.generatedPassword = generatedPassword;

		res.status(201).json(response);
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao registrar usuário:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};

exports.list = async (req, res) => {
	try {
		const users = await usersService.list(req.query);
		res.status(200).json({ users });
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao listar usuários:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};

exports.getById = async (req, res) => {
	try {
		const user = await usersService.getById(req.params.id);
		res.status(200).json({ user });
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao buscar usuário:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};

exports.update = async (req, res) => {
	const { email, role, cpf } = req.body;

	if (email !== undefined && !isValidEmail(email))
		return res.status(400).json({ message: 'Formato de e-mail inválido.' });

	if (role !== undefined && !isValidRole(role))
		return res.status(400).json({ message: 'Perfil (role) inválido.' });

	if (cpf !== undefined && cpf !== null && !isValidCPF(cpf))
		return res.status(400).json({ message: 'CPF inválido.' });

	try {
		const user = await usersService.update(req.params.id, req.body, req.user.id, req.ip);
		res.status(200).json({ message: 'Usuário atualizado com sucesso.', user });
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao atualizar usuário:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const generatedPassword = await usersService.resetPassword(req.params.id, req.user.id, req.ip);
		res.status(200).json({ message: 'Senha redefinida com sucesso.', generatedPassword });
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao redefinir senha:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};

exports.activate = async (req, res) => {
	try {
		await usersService.activate(req.params.id, req.user.id, req.ip);
		res.status(200).json({ message: 'Usuário ativado com sucesso.' });
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao ativar usuário:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};

exports.deactivate = async (req, res) => {
	try {
		await usersService.deactivate(req.params.id, req.user.id, req.ip);
		res.status(200).json({ message: 'Usuário desativado com sucesso.' });
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao desativar usuário:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};

exports.remove = async (req, res) => {
	try {
		await usersService.remove(req.params.id, req.user.id, req.ip);
		res.status(200).json({ message: 'Usuário removido com sucesso.' });
	} catch (err) {
		if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		console.error('Erro ao remover usuário:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};
