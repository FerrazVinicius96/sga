const demandasRepository = require('../../repositories/gepro/demandasRepository');
const pool = require('../../config/database');
const { logAudit } = require('../../utils/logger');
const { PERMISSIONS } = require('../../constants/permissions');

const makeError = (message, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	return err;
};

exports.criar = async (payload, usuarioCriadorId, ipAddress) => {
	if (!payload.titulo || !payload.titulo.trim()) {
		throw makeError('Título é obrigatório.', 400);
	}
	if (!payload.descricao || payload.descricao.trim().length < 20) {
		throw makeError('Descrição deve ter pelo menos 20 caracteres.', 400);
	}
	if (!payload.quantidade || Number(payload.quantidade) <= 0) {
		throw makeError('Quantidade deve ser maior que zero.', 400);
	}
	if (!payload.tipo_equipamento || !payload.tipo_equipamento.trim()) {
		throw makeError('Tipo de equipamento é obrigatório.', 400);
	}
	if (payload.aquisicao_emergencial && !payload.justificativa_emergencial?.trim()) {
		throw makeError('Justificativa de emergência é obrigatória para aquisições emergenciais.', 400);
	}

	const numeroDemanda = await demandasRepository.gerarNumeroDemanda();

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		const demanda = await demandasRepository.criar(client, {
			...payload,
			numero_demanda: numeroDemanda,
			usuario_criador_id: usuarioCriadorId,
		});

		await demandasRepository.criarNecessidade(client, demanda.id, {
			descricao_necessidade: payload.descricao_necessidade,
			justificativa_tecnica: payload.justificativa_tecnica,
			justificativa_negocio: payload.justificativa_negocio,
		});

		await demandasRepository.registrarAcompanhamento(
			client,
			demanda.id,
			usuarioCriadorId,
			'necessidade',
			`Demanda ${numeroDemanda} criada.`,
		);

		await client.query('COMMIT');

		await logAudit(
			usuarioCriadorId,
			'gepro_demanda_criada',
			'gepro.demanda',
			demanda.id,
			{ numero_demanda: numeroDemanda, titulo: demanda.titulo },
			ipAddress,
		);

		return demanda;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.listar = async (query, user) => {
	const { status, search, limit, offset } = query;

	// Apenas manager e admin veem todas as demandas; outros só veem as próprias
	const criador_id = PERMISSIONS.GEPRO_APROVAR_DEMANDA.includes(user.role) ? undefined : user.id;

	return demandasRepository.findAll({
		status: status || undefined,
		criador_id,
		search: search || undefined,
		limit: limit ? parseInt(limit, 10) : 50,
		offset: offset ? parseInt(offset, 10) : 0,
	});
};

exports.obter = async (id, user) => {
	const demanda = await demandasRepository.findById(id);
	if (!demanda) {
		throw makeError('Demanda não encontrada.', 404);
	}

	const podeVerTudo = PERMISSIONS.GEPRO_APROVAR_DEMANDA.includes(user.role);
	if (!podeVerTudo && demanda.usuario_criador_id !== user.id) {
		throw makeError('Acesso negado a esta demanda.', 403);
	}

	const acompanhamento = await demandasRepository.findAcompanhamento(id);
	return { ...demanda, acompanhamento };
};

exports.aprovar = async (id, gestorId, payload, ipAddress) => {
	const demanda = await demandasRepository.findById(id);
	if (!demanda) throw makeError('Demanda não encontrada.', 404);
	if (demanda.status !== 'necessidade_rascunho') {
		throw makeError(`Demanda não pode ser aprovada no status atual: ${demanda.status}.`, 422);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		const atualizada = await demandasRepository.atualizarStatus(
			client,
			id,
			'necessidade_aprovada',
			{ data_necessidade_aprovada: new Date() },
		);

		await demandasRepository.registrarAprovacao(
			client,
			id,
			gestorId,
			'gestor_necessidade',
			'aprovado',
			payload.observacoes || null,
		);

		await demandasRepository.registrarAcompanhamento(
			client,
			id,
			gestorId,
			'necessidade',
			`Necessidade aprovada pelo gestor.${payload.observacoes ? ' ' + payload.observacoes : ''}`,
		);

		await client.query('COMMIT');

		await logAudit(gestorId, 'gepro_demanda_aprovada', 'gepro.demanda', id, {
			numero_demanda: demanda.numero_demanda,
		}, ipAddress);

		return atualizada;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.rejeitar = async (id, gestorId, payload, ipAddress) => {
	if (!payload.observacoes || payload.observacoes.trim().length < 10) {
		throw makeError('Motivo de rejeição é obrigatório (mínimo 10 caracteres).', 400);
	}

	const demanda = await demandasRepository.findById(id);
	if (!demanda) throw makeError('Demanda não encontrada.', 404);
	if (demanda.status !== 'necessidade_rascunho') {
		throw makeError(`Demanda não pode ser rejeitada no status atual: ${demanda.status}.`, 422);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		await demandasRepository.registrarAprovacao(
			client,
			id,
			gestorId,
			'gestor_necessidade',
			'rejeitado',
			payload.observacoes,
		);

		await demandasRepository.registrarAcompanhamento(
			client,
			id,
			gestorId,
			'necessidade',
			`Necessidade rejeitada. Motivo: ${payload.observacoes}`,
		);

		// Status permanece em rascunho para o solicitante corrigir e resubmeter
		const atualizada = await demandasRepository.atualizarStatus(client, id, 'necessidade_rascunho');

		await client.query('COMMIT');

		await logAudit(gestorId, 'gepro_demanda_rejeitada', 'gepro.demanda', id, {
			numero_demanda: demanda.numero_demanda,
			motivo: payload.observacoes,
		}, ipAddress);

		return atualizada;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.filaAprovacoes = async () => {
	return demandasRepository.findFilaAprovacoes();
};
