const contratosService = require('../../services/gepro/contratosService');

const handleError = (res, error, contexto) => {
	const status = error.statusCode || 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor.';
	if (!error.statusCode) console.error(`Erro em ${contexto}:`, error);
	return res.status(status).json({ message });
};

exports.criar = async (req, res) => {
	try {
		const contrato = await contratosService.criar(req.body, req.user.id, req.ip);
		return res.status(201).json({ success: true, data: contrato });
	} catch (error) {
		return handleError(res, error, 'criar contrato');
	}
};

exports.listar = async (req, res) => {
	try {
		const contratos = await contratosService.listar(req.query);
		return res.status(200).json({ success: true, data: contratos });
	} catch (error) {
		return handleError(res, error, 'listar contratos');
	}
};

exports.obter = async (req, res) => {
	try {
		const contrato = await contratosService.obter(req.params.id);
		return res.status(200).json({ success: true, data: contrato });
	} catch (error) {
		return handleError(res, error, 'obter contrato');
	}
};

exports.inserirMetrica = async (req, res) => {
	try {
		const metrica = await contratosService.inserirMetrica(req.params.id, req.body, req.user.id, req.ip);
		return res.status(201).json({ success: true, data: metrica });
	} catch (error) {
		return handleError(res, error, 'inserir métrica');
	}
};

exports.listarMetricas = async (req, res) => {
	try {
		const metricas = await contratosService.listarMetricas(req.params.id);
		return res.status(200).json({ success: true, data: metricas });
	} catch (error) {
		return handleError(res, error, 'listar métricas');
	}
};
