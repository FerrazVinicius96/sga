const contratosRepository = require('../../repositories/gepro/contratosRepository');
const pool = require('../../config/database');
const { logAudit } = require('../../utils/logger');

const makeError = (message, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	return err;
};

exports.criar = async (payload, usuarioId, ipAddress) => {
	const { numero_contrato, demanda_id, fornecedor_id, objeto, valor_total, data_inicio, data_fim, itens } = payload;

	if (!numero_contrato?.trim()) throw makeError('Número do contrato é obrigatório.', 400);
	if (!fornecedor_id) throw makeError('Fornecedor é obrigatório.', 400);
	if (!objeto?.trim()) throw makeError('Objeto do contrato é obrigatório.', 400);
	if (!valor_total || Number(valor_total) <= 0) throw makeError('Valor total deve ser maior que zero.', 400);
	if (!data_inicio) throw makeError('Data de início é obrigatória.', 400);
	if (!data_fim) throw makeError('Data de fim é obrigatória.', 400);
	if (new Date(data_fim) <= new Date(data_inicio)) {
		throw makeError('Data de fim deve ser posterior à data de início.', 400);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		const contrato = await contratosRepository.criar(client, {
			numero_contrato: numero_contrato.trim(),
			demanda_id: demanda_id || null,
			fornecedor_id,
			objeto: objeto.trim(),
			valor_total,
			data_inicio,
			data_fim,
			criado_por_id: usuarioId,
		});

		let itensInseridos = [];
		if (Array.isArray(itens) && itens.length > 0) {
			for (const item of itens) {
				if (!item.descricao?.trim()) throw makeError('Todos os itens devem ter descrição.', 400);
				if (!item.valor_unitario || Number(item.valor_unitario) <= 0) {
					throw makeError('Valor unitário de todos os itens deve ser maior que zero.', 400);
				}
				if (!item.quantidade_estimada || Number(item.quantidade_estimada) <= 0) {
					throw makeError('Quantidade estimada de todos os itens deve ser maior que zero.', 400);
				}
			}
			itensInseridos = await contratosRepository.criarItens(client, contrato.id, itens);
		}

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_contrato_criado', 'gepro.contrato', contrato.id, {
			numero_contrato: contrato.numero_contrato,
		}, ipAddress);

		return { ...contrato, itens: itensInseridos };
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.listar = async (query) => {
	const { status, fornecedor_id, limit, offset } = query;
	return contratosRepository.findAll({
		status: status || undefined,
		fornecedor_id: fornecedor_id || undefined,
		limit: limit ? parseInt(limit, 10) : 50,
		offset: offset ? parseInt(offset, 10) : 0,
	});
};

exports.obter = async (id) => {
	const contrato = await contratosRepository.findById(id);
	if (!contrato) throw makeError('Contrato não encontrado.', 404);
	return contrato;
};

// RN - Inserir ou atualizar métrica mensal (upsert por contrato+mes+ano)
exports.inserirMetrica = async (contratoId, payload, usuarioId, ipAddress) => {
	const { mes, ano, metrica_descricao, meta_quantidade, quantidade_realizada, observacao } = payload;

	if (!mes || mes < 1 || mes > 12) throw makeError('Mês deve ser entre 1 e 12.', 400);
	if (!ano || ano < 2000) throw makeError('Ano inválido.', 400);
	if (!metrica_descricao?.trim()) throw makeError('Descrição da métrica é obrigatória.', 400);
	if (!meta_quantidade || Number(meta_quantidade) <= 0) {
		throw makeError('Meta deve ser maior que zero.', 400);
	}

	const contrato = await contratosRepository.findById(contratoId);
	if (!contrato) throw makeError('Contrato não encontrado.', 404);

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		const metrica = await contratosRepository.inserirMetrica(client, {
			contrato_id: contratoId,
			mes: Number(mes),
			ano: Number(ano),
			metrica_descricao: metrica_descricao.trim(),
			meta_quantidade: Number(meta_quantidade),
			quantidade_realizada: Number(quantidade_realizada || 0),
			observacao: observacao || null,
			registrado_por_id: usuarioId,
		});

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_metrica_inserida', 'gepro.contrato_metrica', metrica.id, {
			contrato_id: contratoId,
			mes,
			ano,
		}, ipAddress);

		return metrica;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.listarMetricas = async (contratoId) => {
	const contrato = await contratosRepository.findById(contratoId);
	if (!contrato) throw makeError('Contrato não encontrado.', 404);
	return contratosRepository.findMetricas(contratoId);
};
