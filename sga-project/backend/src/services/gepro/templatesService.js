const templatesRepository = require('../../repositories/gepro/templatesRepository');
const { logAudit } = require('../../utils/logger');

const makeError = (message, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	return err;
};

const TIPOS_VALIDOS = ['etp', 'tr'];

exports.obter = async (tipo) => {
	if (!TIPOS_VALIDOS.includes(tipo)) throw makeError('Tipo de template inválido.', 400);
	const template = await templatesRepository.findAtivo(tipo);
	if (!template) throw makeError(`Nenhum template ${tipo.toUpperCase()} ativo encontrado.`, 404);
	return template;
};

exports.listar = async (tipo) => {
	if (!TIPOS_VALIDOS.includes(tipo)) throw makeError('Tipo de template inválido.', 400);
	return templatesRepository.findAll(tipo);
};

exports.publicar = async (tipo, payload, userId, ipAddress) => {
	if (!TIPOS_VALIDOS.includes(tipo)) throw makeError('Tipo de template inválido.', 400);

	const { versao, data_publicacao, json_schema } = payload;

	if (!versao || !versao.trim()) throw makeError('Versão é obrigatória.', 400);
	if (!data_publicacao) throw makeError('Data de publicação é obrigatória.', 400);
	if (!json_schema || typeof json_schema !== 'object') {
		throw makeError('json_schema deve ser um objeto JSON válido.', 400);
	}
	if (!Array.isArray(json_schema.campos) || json_schema.campos.length === 0) {
		throw makeError('json_schema deve conter um array "campos" não vazio.', 400);
	}

	const template = await templatesRepository.criar(tipo, {
		versao: versao.trim(),
		data_publicacao,
		json_schema,
		criado_por_id: userId,
	});

	await logAudit(userId, `gepro_template_${tipo}_publicado`, `gepro.template_${tipo}`, template.id, {
		versao: template.versao,
	}, ipAddress);

	return template;
};

exports.validarDadosContraTemplate = async (tipo, dados) => {
	const template = await templatesRepository.findAtivo(tipo);
	if (!template) {
		throw makeError(`Template ${tipo.toUpperCase()} não encontrado. Contate o administrador.`, 503);
	}

	const erros = [];
	for (const campo of template.json_schema.campos) {
		const valor = dados[campo.nome];

		if (campo.obrigatorio && (valor === undefined || valor === null || valor === '')) {
			erros.push(`Campo obrigatório ausente: ${campo.nome}`);
			continue;
		}

		if (valor !== undefined && valor !== null && valor !== '') {
			if (campo.tipo === 'number' && isNaN(Number(valor))) {
				erros.push(`Campo "${campo.nome}" deve ser numérico.`);
			}
			if (campo.tipo === 'text' && campo.min_length && String(valor).length < campo.min_length) {
				erros.push(`Campo "${campo.nome}" deve ter no mínimo ${campo.min_length} caracteres.`);
			}
		}
	}

	return { valido: erros.length === 0, erros, template_versao: template.versao };
};
