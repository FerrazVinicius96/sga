const agendamentoService = require('../../services/gepro/agendamentoService');

const handleError = (res, error, contexto) => {
	const status = error.statusCode || 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor.';
	if (!error.statusCode) console.error(`Erro em ${contexto}:`, error);
	return res.status(status).json({ message });
};

exports.agendar = async (req, res) => {
	try {
		const resultado = await agendamentoService.agendar(
			req.params.id,
			req.body,
			req.user.id,
			req.ip,
		);
		return res.status(201).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'agendar entrega');
	}
};

exports.obter = async (req, res) => {
	try {
		const agendamento = await agendamentoService.obter(req.params.id);
		return res.status(200).json({ success: true, data: agendamento });
	} catch (error) {
		return handleError(res, error, 'obter agendamento');
	}
};
