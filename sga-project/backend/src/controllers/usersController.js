const usersService = require('../services/usersService');

const generateRandomPassword = () => {
	const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789';
	return Array.from(
		{ length: 12 },
		() => chars[Math.floor(Math.random() * chars.length)],
	).join('');
};

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

	if (!username || !email || !full_name || !role) {
		return res
			.status(400)
			.json({
				message: 'Campos obrigatórios: Username, Email, Nome e Função.',
			});
	}

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
		if (err.statusCode === 409) {
			return res.status(409).json({ message: err.message });
		}
		console.error('Erro ao registrar usuário:', err);
		res.status(500).json({ message: 'Erro interno.' });
	}
};
