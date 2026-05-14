const demandasService = require('../../services/gepro/demandasService');

const handleError = (res, error, contexto) => {
	const status = error.statusCode || 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor.';
	if (!error.statusCode) console.error(`Erro em ${contexto}:`, error);
	return res.status(status).json({ message });
};

exports.criar = async (req, res) => {
	try {
		const demanda = await demandasService.criar(req.body, req.user.id, req.ip);
		return res.status(201).json({ success: true, data: demanda });
	} catch (error) {
		return handleError(res, error, 'criar demanda');
	}
};

exports.listar = async (req, res) => {
	try {
		const demandas = await demandasService.listar(req.query, req.user);
		return res.status(200).json({ success: true, data: demandas });
	} catch (error) {
		return handleError(res, error, 'listar demandas');
	}
};

exports.obter = async (req, res) => {
	try {
		const demanda = await demandasService.obter(req.params.id, req.user);
		return res.status(200).json({ success: true, data: demanda });
	} catch (error) {
		return handleError(res, error, 'obter demanda');
	}
};

exports.aprovar = async (req, res) => {
	try {
		const demanda = await demandasService.aprovar(req.params.id, req.user.id, req.body, req.ip);
		return res.status(200).json({ success: true, data: demanda });
	} catch (error) {
		return handleError(res, error, 'aprovar demanda');
	}
};

exports.rejeitar = async (req, res) => {
	try {
		const demanda = await demandasService.rejeitar(req.params.id, req.user.id, req.body, req.ip);
		return res.status(200).json({ success: true, data: demanda });
	} catch (error) {
		return handleError(res, error, 'rejeitar demanda');
	}
};

exports.filaAprovacoes = async (req, res) => {
	try {
		const demandas = await demandasService.filaAprovacoes();
		return res.status(200).json({ success: true, data: demandas });
	} catch (error) {
		return handleError(res, error, 'fila de aprovações');
	}
};

exports.adicionarCotacao = async (req, res) => {
	try {
		const cotacao = await demandasService.adicionarCotacao(req.params.id, req.body, req.user.id, req.ip);
		return res.status(201).json({ success: true, data: cotacao });
	} catch (error) {
		return handleError(res, error, 'adicionar cotação');
	}
};

exports.listarCotacoes = async (req, res) => {
	try {
		const cotacoes = await demandasService.listarCotacoes(req.params.id);
		return res.status(200).json({ success: true, data: cotacoes });
	} catch (error) {
		return handleError(res, error, 'listar cotações');
	}
};

exports.adicionarObservacao = async (req, res) => {
	try {
		const resultado = await demandasService.adicionarObservacao(req.params.id, req.body.conteudo, req.user.id);
		return res.status(201).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'adicionar observação');
	}
};

exports.listarObservacoes = async (req, res) => {
	try {
		const resultado = await demandasService.listarObservacoes(req.params.id);
		return res.status(200).json({ success: true, data: resultado });
	} catch (error) {
		return handleError(res, error, 'listar observações');
	}
};

exports.selecionarVencedor = async (req, res) => {
	try {
		const cotacao = await demandasService.selecionarVencedor(req.params.id, req.params.cotacaoId, req.user.id, req.ip);
		return res.status(200).json({ success: true, data: cotacao });
	} catch (error) {
		return handleError(res, error, 'selecionar vencedor');
	}
};
