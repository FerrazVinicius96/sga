const demandasRepository = require('../../repositories/gepro/demandasRepository');
const pool = require('../../config/database');
const { logAudit } = require('../../utils/logger');
const { PERMISSIONS } = require('../../constants/permissions');
const modalidadeService = require('./modalidadeService');

const makeError = (message, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	return err;
};

exports.criar = async (payload, usuarioCriadorId, ipAddress) => {
	if (!payload.titulo || !payload.titulo.trim()) {
		throw makeError('Título é obrigatório.', 400);
	}
	// RN001 V001: descrição ≥ 50 caracteres
	if (!payload.descricao || payload.descricao.trim().length < 50) {
		throw makeError('Descrição deve ter pelo menos 50 caracteres. (RN001/V001)', 400);
	}
	// RN001 V003: quantidade > 0
	if (!payload.quantidade || Number(payload.quantidade) <= 0) {
		throw makeError('Quantidade deve ser maior que zero. (RN001/V003)', 400);
	}
	if (!payload.tipo_equipamento || !payload.tipo_equipamento.trim()) {
		throw makeError('Tipo de equipamento é obrigatório.', 400);
	}
	// RN001 V004: valor_estimado > 0
	if (!payload.valor_estimado || Number(payload.valor_estimado) <= 0) {
		throw makeError('Valor estimado é obrigatório e deve ser maior que zero. (RN001/V004)', 400);
	}
	// Valida modalidade (inclui ata_registro_precos)
	modalidadeService.validar(payload.modalidade_licitatoria);

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

// ── Cotações ─────────────────────────────────────────────────

// RN005: Registrar cotação (mínimo 3, V011-V014)
exports.adicionarCotacao = async (demandaId, payload, usuarioId, ipAddress) => {
	const { fornecedor_id, valor_unitario, prazo_entrega_dias } = payload;

	if (!fornecedor_id) throw makeError('Fornecedor é obrigatório.', 400);
	if (!valor_unitario || Number(valor_unitario) <= 0) {
		throw makeError('Valor unitário deve ser maior que zero. (V012)', 400);
	}
	if (!prazo_entrega_dias || Number(prazo_entrega_dias) <= 0) {
		throw makeError('Prazo de entrega deve ser maior que zero. (V013)', 400);
	}

	const demanda = await demandasRepository.findById(demandaId);
	if (!demanda) throw makeError('Demanda não encontrada.', 404);

	// V014: não duplicar fornecedor
	const cotacoesExistentes = await demandasRepository.findCotacoes(demandaId);
	if (cotacoesExistentes.some((c) => c.fornecedor_id === Number(fornecedor_id))) {
		throw makeError('Este fornecedor já possui cotação registrada para esta demanda. (V014)', 409);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');
		const cotacao = await demandasRepository.criarCotacao(client, demandaId, payload);
		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_cotacao_adicionada', 'gepro.cotacao', cotacao.id, {
			demanda_id: demandaId,
			fornecedor_id,
			valor_unitario,
		}, ipAddress);

		return cotacao;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.listarCotacoes = async (demandaId) => {
	const demanda = await demandasRepository.findById(demandaId);
	if (!demanda) throw makeError('Demanda não encontrada.', 404);
	return demandasRepository.findCotacoes(demandaId);
};

// ── Observações ───────────────────────────────────────────────

exports.adicionarObservacao = async (demandaId, conteudo, usuarioId) => {
	if (!conteudo || conteudo.trim().length < 3) {
		throw makeError('Conteúdo da observação deve ter pelo menos 3 caracteres.', 400);
	}
	const demanda = await demandasRepository.findById(demandaId);
	if (!demanda) throw makeError('Demanda não encontrada.', 404);

	const { rows } = await pool.query(
		`INSERT INTO gepro.observacao (demanda_id, usuario_id, conteudo) VALUES ($1, $2, $3) RETURNING *`,
		[demandaId, usuarioId, conteudo.trim()],
	);
	return rows[0];
};

exports.listarObservacoes = async (demandaId) => {
	const demanda = await demandasRepository.findById(demandaId);
	if (!demanda) throw makeError('Demanda não encontrada.', 404);

	const { rows } = await pool.query(
		`SELECT o.*, u.full_name AS autor_nome, u.username AS autor_username
		 FROM gepro.observacao o
		 LEFT JOIN users u ON u.id = o.usuario_id
		 WHERE o.demanda_id = $1
		 ORDER BY o.data_criacao DESC`,
		[demandaId],
	);
	return rows;
};

// RN006: Selecionar fornecedor vencedor (V015-V016)
exports.selecionarVencedor = async (demandaId, cotacaoId, usuarioId, ipAddress) => {
	const cotacoes = await demandasRepository.findCotacoes(demandaId);
	if (cotacoes.length < 3) {
		throw makeError(`Mínimo de 3 cotações requerido. Atual: ${cotacoes.length}. (V011)`, 422);
	}

	const cotacao = cotacoes.find((c) => c.id === Number(cotacaoId));
	if (!cotacao) throw makeError('Cotação não encontrada nesta demanda. (V016)', 404);

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');
		const atualizada = await demandasRepository.selecionarVencedor(client, demandaId, cotacaoId);

		await demandasRepository.registrarAcompanhamento(
			client,
			demandaId,
			usuarioId,
			'instrucao_tecnica',
			`Fornecedor vencedor selecionado: cotação #${cotacao.numero_sequencial} (${cotacao.fornecedor_nome}).`,
		);

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_vencedor_selecionado', 'gepro.cotacao', cotacaoId, {
			demanda_id: demandaId,
		}, ipAddress);

		return atualizada;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};
