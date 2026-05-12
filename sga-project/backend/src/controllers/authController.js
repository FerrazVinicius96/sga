const authService = require('../services/authService');

exports.login = async (req, res) => {
	try {
		// Repassa a execução para o Service
		const { user, token } = await authService.login(
			email,
			password,
			ipAddress,
		);

		// Retorna a resposta de sucesso para o cliente
		return res.status(200).json({
			message: 'Login realizado com sucesso.',
			user, // Dados do usuário sanitizados (sem o hash da senha)
			token,
		});
	} catch (error) {
		// Captura os erros lançados pelo Service. Se não tiver statusCode, assume erro 500 (interno)
		const statusCode = error.statusCode || 500;

		// Evita expor mensagens de erro nativas do servidor (500) para o cliente em produção
		const message =
			error.statusCode ?
				error.message
			:	'Ocorreu um erro interno no servidor.';

		// Log extra para erros internos (opcional, útil para debugar)
		if (!error.statusCode) {
			console.error('Erro interno no Login:', error);
		}

		return res.status(statusCode).json({ message });
	}
};
