const authService = require('../../services/sga/authService');

exports.login = async (req, res) => {
	try {
		console.log('1. Content-Type recebido:', req.headers['content-type']);
		console.log('2. Corpo da requisição (req.body):', req.body);

		const { email, password } = req.body;
		const ipAddress = req.ip;

		const { user, token } = await authService.login(
			email,
			password,
			ipAddress,
		);

		return res.status(200).json({
			message: 'Login realizado com sucesso.',
			user,
			token,
		});
	} catch (error) {
		const statusCode = error.statusCode || 500;
		const message =
			error.statusCode ?
				error.message
			:	'Ocorreu um erro interno no servidor.';

		if (!error.statusCode) {
			console.error('Erro interno no Login:', error);
		}

		return res.status(statusCode).json({ message });
	}
};

exports.logout = async (req, res) => {
	try {
		await authService.logout(req.user.id, req.ip);

		return res.status(200).json({ message: 'Logout realizado com sucesso.' });
	} catch (error) {
		const statusCode = error.statusCode || 500;
		const message =
			error.statusCode ?
				error.message
			:	'Ocorreu um erro interno no servidor.';

		if (!error.statusCode) {
			console.error('Erro interno no Logout:', error);
		}

		return res.status(statusCode).json({ message });
	}
};

exports.verifyToken = async (req, res) => {
	try {
		const { user } = await authService.verifyToken(req.user.id);

		return res.status(200).json({ user });
	} catch (error) {
		const statusCode = error.statusCode || 500;
		const message =
			error.statusCode ?
				error.message
			:	'Ocorreu um erro interno no servidor.';

		if (!error.statusCode) {
			console.error('Erro interno no VerifyToken:', error);
		}

		return res.status(statusCode).json({ message });
	}
};
