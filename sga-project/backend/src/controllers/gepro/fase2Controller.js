const fase2Service = require('../../services/gepro/fase2Service');
const notificacaoService = require('../../services/gepro/notificacaoService');

const handleError = (res, error, contexto) => {
	const status = error.statusCode || 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor.';
	if (!error.statusCode) console.error(`Erro em ${contexto}:`, error);

	const body = { message };
	if (error.campos) body.campos = error.campos;

	return res.status(status).json(body);
};

exports.submeterETP = async (req, res) => {
	try {
		const resultado = await fase2Service.submeterETP(req.params.id, req.body, req.user.id, req.ip);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'submeter ETP');
	}
};

exports.submeterTR = async (req, res) => {
	try {
		const resultado = await fase2Service.submeterTR(req.params.id, req.body, req.user.id, req.ip);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'submeter TR');
	}
};

exports.obterFase2 = async (req, res) => {
	try {
		const resultado = await fase2Service.obterFase2(req.params.id);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'obter fase 2');
	}
};

exports.encaminhar = async (req, res) => {
	try {
		const resultado = await fase2Service.encaminhar(req.params.id, req.user.id, req.ip);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'encaminhar fase 2');
	}
};

exports.checklist = async (req, res) => {
	try {
		const resultado = await fase2Service.checklist(req.params.id);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'checklist fase 2');
	}
};

exports.emitirNotaEmpenho = async (req, res) => {
	try {
		const resultado = await notificacaoService.emitirNotaEmpenho(
			req.params.id,
			req.body,
			req.user.id,
			req.ip,
		);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'emitir nota de empenho');
	}
};
