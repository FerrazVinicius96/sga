const recebimentoService = require('../../services/gepro/recebimentoService');

const handleError = (res, error, contexto) => {
	const status = error.statusCode || 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor.';
	if (!error.statusCode) console.error(`Erro em ${contexto}:`, error);
	return res.status(status).json({ message });
};

exports.registrar = async (req, res) => {
	try {
		const resultado = await recebimentoService.registrar(req.params.id, req.body, req.user.id, req.ip);
		return res.status(201).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'registrar recebimento');
	}
};

exports.registrarTestes = async (req, res) => {
	try {
		const resultado = await recebimentoService.registrarTestes(req.params.id, req.body, req.user.id, req.ip);
		return res.status(201).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'registrar testes técnicos');
	}
};

exports.obter = async (req, res) => {
	try {
		const resultado = await recebimentoService.obter(req.params.id);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'obter recebimento');
	}
};
