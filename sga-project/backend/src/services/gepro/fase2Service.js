const pool = require('../../config/database');
const { logAudit } = require('../../utils/logger');
const templatesService = require('./templatesService');
const modalidadeService = require('./modalidadeService');

const makeError = (message, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	return err;
};

const getDemanda = async (id) => {
	const { rows } = await pool.query('SELECT * FROM gepro.demanda WHERE id = $1', [id]);
	if (!rows[0]) throw makeError('Demanda não encontrada.', 404);
	return rows[0];
};

// RN003: Preencher/atualizar ETP validando contra template ativo
exports.submeterETP = async (demandaId, dados, usuarioId, ipAddress) => {
	const demanda = await getDemanda(demandaId);

	if (!['instrucao_rascunho', 'instrucao_rejeitada_gestor', 'necessidade_aprovada'].includes(demanda.status)) {
		throw makeError(`ETP não pode ser preenchido no status atual: ${demanda.status}.`, 422);
	}

	const validacao = await templatesService.validarDadosContraTemplate('etp', dados);
	if (!validacao.valido) {
		const err = makeError('ETP inválido — campos obrigatórios faltando ou incorretos.', 400);
		err.campos = validacao.erros;
		throw err;
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		// Upsert ETP via instrucao_tecnica
		let instrucaoId;
		const { rows: instrucaoRows } = await client.query(
			'SELECT id FROM gepro.instrucao_tecnica WHERE demanda_id = $1 ORDER BY versao DESC LIMIT 1',
			[demandaId],
		);

		if (instrucaoRows.length === 0) {
			const instrRes = await client.query(
				`INSERT INTO gepro.instrucao_tecnica (demanda_id, versao)
				 VALUES ($1, 1) RETURNING id`,
				[demandaId],
			);
			instrucaoId = instrRes.rows[0].id;
		} else {
			instrucaoId = instrucaoRows[0].id;
		}

		const { rows: etpRows } = await client.query(
			'SELECT id FROM gepro.etp WHERE instrucao_tecnica_id = $1',
			[instrucaoId],
		);

		if (etpRows.length === 0) {
			await client.query(
				`INSERT INTO gepro.etp (
					instrucao_tecnica_id,
					categoria_equipamento, processador_tipo, processador_velocidade, processador_nucleos,
					memoria_ram_minima, armazenamento_tipo, armazenamento_capacidade,
					conectividade, peso_dimensoes, voltagem, sistema_operacional,
					compatibilidade_sistemas, software_incluidos, garantia_periodo, garantia_cobertura,
					suporte_tecnico, condicoes_entrega, condicoes_instalacao,
					certificacoes_obrigatorias, acessibilidade_conformidade,
					criterios_rejeicao, justificativa_tecnica
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
				[
					instrucaoId,
					dados.categoria_equipamento || null,
					dados.processador_tipo || null,
					dados.processador_velocidade || null,
					dados.processador_nucleos || null,
					dados.memoria_ram_minima || null,
					dados.armazenamento_tipo || null,
					dados.armazenamento_capacidade || null,
					dados.conectividade || null,
					dados.peso_dimensoes || null,
					dados.voltagem || null,
					dados.sistema_operacional || null,
					dados.compatibilidade_sistemas || null,
					dados.software_incluidos || null,
					dados.garantia_periodo || null,
					dados.garantia_cobertura || null,
					dados.suporte_tecnico || null,
					dados.condicoes_entrega || null,
					dados.condicoes_instalacao || null,
					dados.certificacoes_obrigatorias || null,
					dados.acessibilidade_conformidade || null,
					dados.criterios_rejeicao || null,
					dados.justificativa_tecnica || null,
				],
			);
		} else {
			await client.query(
				`UPDATE gepro.etp SET
					categoria_equipamento = $2, processador_tipo = $3, processador_velocidade = $4,
					processador_nucleos = $5, memoria_ram_minima = $6, armazenamento_tipo = $7,
					armazenamento_capacidade = $8, conectividade = $9, peso_dimensoes = $10,
					voltagem = $11, sistema_operacional = $12, compatibilidade_sistemas = $13,
					software_incluidos = $14, garantia_periodo = $15, garantia_cobertura = $16,
					suporte_tecnico = $17, condicoes_entrega = $18, condicoes_instalacao = $19,
					certificacoes_obrigatorias = $20, acessibilidade_conformidade = $21,
					criterios_rejeicao = $22, justificativa_tecnica = $23, data_atualizacao = NOW()
				 WHERE instrucao_tecnica_id = $1`,
				[
					instrucaoId,
					dados.categoria_equipamento || null,
					dados.processador_tipo || null,
					dados.processador_velocidade || null,
					dados.processador_nucleos || null,
					dados.memoria_ram_minima || null,
					dados.armazenamento_tipo || null,
					dados.armazenamento_capacidade || null,
					dados.conectividade || null,
					dados.peso_dimensoes || null,
					dados.voltagem || null,
					dados.sistema_operacional || null,
					dados.compatibilidade_sistemas || null,
					dados.software_incluidos || null,
					dados.garantia_periodo || null,
					dados.garantia_cobertura || null,
					dados.suporte_tecnico || null,
					dados.condicoes_entrega || null,
					dados.condicoes_instalacao || null,
					dados.certificacoes_obrigatorias || null,
					dados.acessibilidade_conformidade || null,
					dados.criterios_rejeicao || null,
					dados.justificativa_tecnica || null,
				],
			);
		}

		if (demanda.status === 'necessidade_aprovada') {
			await client.query(
				`UPDATE gepro.demanda SET status = 'instrucao_rascunho', data_atualizacao = NOW() WHERE id = $1`,
				[demandaId],
			);
		}

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_etp_submetido', 'gepro.etp', instrucaoId, {
			demanda_id: demandaId,
			template_versao: validacao.template_versao,
		}, ipAddress);

		return { demanda_id: Number(demandaId), instrucao_tecnica_id: instrucaoId, template_versao: validacao.template_versao };
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

// RN004: Preencher TR — bloqueado se modalidade = ARP
exports.submeterTR = async (demandaId, dados, usuarioId, ipAddress) => {
	const demanda = await getDemanda(demandaId);

	// RN004: ARP não permite TR
	modalidadeService.assertTRPermitido(demanda.modalidade_licitatoria);

	if (!['instrucao_rascunho', 'instrucao_rejeitada_gestor', 'necessidade_aprovada'].includes(demanda.status)) {
		throw makeError(`TR não pode ser preenchido no status atual: ${demanda.status}.`, 422);
	}

	const validacao = await templatesService.validarDadosContraTemplate('tr', dados);
	if (!validacao.valido) {
		const err = makeError('TR inválido — campos obrigatórios faltando ou incorretos.', 400);
		err.campos = validacao.erros;
		throw err;
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		let instrucaoId;
		const { rows: instrucaoRows } = await client.query(
			'SELECT id FROM gepro.instrucao_tecnica WHERE demanda_id = $1 ORDER BY versao DESC LIMIT 1',
			[demandaId],
		);

		if (instrucaoRows.length === 0) {
			const instrRes = await client.query(
				`INSERT INTO gepro.instrucao_tecnica (demanda_id, versao) VALUES ($1, 1) RETURNING id`,
				[demandaId],
			);
			instrucaoId = instrRes.rows[0].id;
		} else {
			instrucaoId = instrucaoRows[0].id;
		}

		const { rows: trRows } = await client.query(
			'SELECT id FROM gepro.termo_referencia WHERE instrucao_tecnica_id = $1',
			[instrucaoId],
		);

		if (trRows.length === 0) {
			await client.query(
				`INSERT INTO gepro.termo_referencia (
					instrucao_tecnica_id, objeto, justificativa, descricao_detalhada,
					valor_estimado_unitario, valor_estimado_total, projecao_preco_justo,
					criterio_selecao, prazo_entrega_dias_max, validade_cotacao,
					prazo_garantia_meses, condicoes_pagamento, multa_atraso_percentual,
					multa_nao_conformidade_percentual, clauses_rescisao
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
				[
					instrucaoId,
					dados.objeto || null,
					dados.justificativa || null,
					dados.descricao_detalhada || null,
					dados.valor_estimado_unitario || null,
					dados.valor_estimado_total || null,
					dados.projecao_preco_justo || null,
					dados.criterio_selecao || null,
					dados.prazo_entrega_dias_max || null,
					dados.validade_cotacao || null,
					dados.prazo_garantia_meses || null,
					dados.condicoes_pagamento || null,
					dados.multa_atraso_percentual || null,
					dados.multa_nao_conformidade_percentual || null,
					dados.clauses_rescisao || null,
				],
			);
		} else {
			await client.query(
				`UPDATE gepro.termo_referencia SET
					objeto = $2, justificativa = $3, descricao_detalhada = $4,
					valor_estimado_unitario = $5, valor_estimado_total = $6,
					projecao_preco_justo = $7, criterio_selecao = $8,
					prazo_entrega_dias_max = $9, validade_cotacao = $10,
					prazo_garantia_meses = $11, condicoes_pagamento = $12,
					multa_atraso_percentual = $13, multa_nao_conformidade_percentual = $14,
					clauses_rescisao = $15, data_atualizacao = NOW()
				 WHERE instrucao_tecnica_id = $1`,
				[
					instrucaoId,
					dados.objeto || null,
					dados.justificativa || null,
					dados.descricao_detalhada || null,
					dados.valor_estimado_unitario || null,
					dados.valor_estimado_total || null,
					dados.projecao_preco_justo || null,
					dados.criterio_selecao || null,
					dados.prazo_entrega_dias_max || null,
					dados.validade_cotacao || null,
					dados.prazo_garantia_meses || null,
					dados.condicoes_pagamento || null,
					dados.multa_atraso_percentual || null,
					dados.multa_nao_conformidade_percentual || null,
					dados.clauses_rescisao || null,
				],
			);
		}

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_tr_submetido', 'gepro.termo_referencia', instrucaoId, {
			demanda_id: demandaId,
			template_versao: validacao.template_versao,
		}, ipAddress);

		return { demanda_id: Number(demandaId), instrucao_tecnica_id: instrucaoId };
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

// Retorna ETP, TR e templates ativos para a tela de Fase 2
exports.obterFase2 = async (demandaId) => {
	const demanda = await getDemanda(demandaId);

	const { rows: instrRows } = await pool.query(
		'SELECT * FROM gepro.instrucao_tecnica WHERE demanda_id = $1 ORDER BY versao DESC LIMIT 1',
		[demandaId],
	);
	const instrucao = instrRows[0] || null;
	const instrucaoId = instrucao?.id || null;

	const etp = instrucaoId
		? (await pool.query('SELECT * FROM gepro.etp WHERE instrucao_tecnica_id = $1', [instrucaoId])).rows[0] || null
		: null;

	const requerTR = modalidadeService.requiresTR(demanda.modalidade_licitatoria);
	const tr = requerTR && instrucaoId
		? (await pool.query('SELECT * FROM gepro.termo_referencia WHERE instrucao_tecnica_id = $1', [instrucaoId])).rows[0] || null
		: null;

	const { rows: cotacoes } = await pool.query(
		'SELECT * FROM gepro.cotacao WHERE demanda_id = $1 ORDER BY numero_sequencial ASC',
		[demandaId],
	);

	const templateETP = await templatesService.obter('etp').catch(() => null);
	const templateTR = requerTR
		? await templatesService.obter('tr').catch(() => null)
		: null;

	return {
		demanda,
		instrucao_tecnica: instrucao,
		etp,
		tr,
		tr_permitido: requerTR,
		cotacoes,
		templates: { etp: templateETP, tr: templateTR },
	};
};

// Encaminha demanda para análise jurídica — valida checklist completo antes
exports.encaminhar = async (demandaId, usuarioId, ipAddress) => {
	const demanda = await getDemanda(demandaId);

	if (!['instrucao_rascunho', 'instrucao_rejeitada_gestor'].includes(demanda.status)) {
		throw makeError(`Não é possível encaminhar no status atual: ${demanda.status}.`, 422);
	}

	const check = await exports.checklist(demandaId);
	if (!check.pode_avancar) {
		const pendentes = check.itens.filter((i) => i.ok === false).map((i) => i.item);
		const err = makeError('Fase 2 incompleta. Itens pendentes: ' + pendentes.join(', ') + '.', 422);
		err.checklist = check.itens;
		throw err;
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		await client.query(
			`UPDATE gepro.demanda SET status = 'encaminhamento_aguardando_juridico', data_atualizacao = NOW() WHERE id = $1`,
			[demandaId],
		);

		// Garante registro em gepro.encaminhamento (upsert por demanda)
		const { rows: encRows } = await client.query(
			'SELECT id FROM gepro.encaminhamento WHERE demanda_id = $1', [demandaId],
		);
		if (encRows.length === 0) {
			await client.query(
				`INSERT INTO gepro.encaminhamento (demanda_id, data_envio_juridico) VALUES ($1, NOW())`,
				[demandaId],
			);
		} else {
			await client.query(
				`UPDATE gepro.encaminhamento SET data_envio_juridico = NOW(), data_atualizacao = NOW() WHERE demanda_id = $1`,
				[demandaId],
			);
		}

		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}

	await logAudit(usuarioId, 'gepro_fase2_encaminhada', 'gepro.demanda', demandaId, {
		status_anterior: demanda.status,
		status_novo: 'encaminhamento_aguardando_juridico',
	}, ipAddress);

	return { demanda_id: Number(demandaId), status: 'encaminhamento_aguardando_juridico' };
};

// RN007: Retorna checklist com status de cada item obrigatório da Fase 2
exports.checklist = async (demandaId) => {
	const demanda = await getDemanda(demandaId);

	const { rows: instrRows } = await pool.query(
		'SELECT id FROM gepro.instrucao_tecnica WHERE demanda_id = $1 ORDER BY versao DESC LIMIT 1',
		[demandaId],
	);
	const instrucaoId = instrRows[0]?.id || null;

	const etpOk = instrucaoId
		? (await pool.query('SELECT id FROM gepro.etp WHERE instrucao_tecnica_id = $1', [instrucaoId])).rows.length > 0
		: false;

	const requerTR = modalidadeService.requiresTR(demanda.modalidade_licitatoria);
	const trOk = requerTR
		? instrucaoId
			? (await pool.query('SELECT id FROM gepro.termo_referencia WHERE instrucao_tecnica_id = $1', [instrucaoId])).rows.length > 0
			: false
		: null; // null = não aplicável (ARP)

	const { rows: cotacoes } = await pool.query(
		'SELECT id, vencedor FROM gepro.cotacao WHERE demanda_id = $1',
		[demandaId],
	);
	const cotacoesOk = cotacoes.length >= 3;
	const vencedorOk = cotacoes.some((c) => c.vencedor === true);
	const modalidadeOk = !!demanda.modalidade_licitatoria;
	const valorOk = demanda.valor_estimado != null && Number(demanda.valor_estimado) > 0;

	const itens = [
		{ item: 'ETP preenchido', ok: etpOk },
		{ item: 'TR preenchido', ok: trOk, observacao: trOk === null ? 'Não aplicável (ARP)' : undefined },
		{ item: 'Mínimo 3 cotações', ok: cotacoesOk, detalhe: `${cotacoes.length} cotações registradas` },
		{ item: 'Fornecedor vencedor selecionado', ok: vencedorOk },
		{ item: 'Modalidade válida', ok: modalidadeOk, detalhe: demanda.modalidade_licitatoria },
		{ item: 'Valor estimado informado', ok: valorOk },
	];

	const podeAvancar = itens.every((i) => i.ok === true || i.ok === null);

	return {
		demanda_id: Number(demandaId),
		status_demanda: demanda.status,
		pode_avancar: podeAvancar,
		itens,
	};
};
