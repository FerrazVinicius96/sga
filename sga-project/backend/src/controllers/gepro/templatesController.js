const templatesService = require('../../services/gepro/templatesService');

const handleError = (res, error, contexto) => {
	const status = error.statusCode || 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor.';
	if (!error.statusCode) console.error(`Erro em ${contexto}:`, error);
	return res.status(status).json({ message });
};

exports.obterAtivo = async (req, res) => {
	try {
		const template = await templatesService.obter(req.params.tipo);
		return res.status(200).json({ success: true, data: template });
	} catch (error) {
		return handleError(res, error, 'obter template');
	}
};

exports.listar = async (req, res) => {
	try {
		const templates = await templatesService.listar(req.params.tipo);
		return res.status(200).json({ success: true, data: templates });
	} catch (error) {
		return handleError(res, error, 'listar templates');
	}
};

exports.publicar = async (req, res) => {
	try {
		const template = await templatesService.publicar(req.params.tipo, req.body, req.user.id, req.ip);
		return res.status(201).json({ success: true, data: template });
	} catch (error) {
		return handleError(res, error, 'publicar template');
	}
};

exports.validar = async (req, res) => {
	try {
		const resultado = await templatesService.validarDadosContraTemplate(req.params.tipo, req.body);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'validar contra template');
	}
};
