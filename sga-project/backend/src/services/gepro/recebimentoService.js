const pool = require('../../config/database');
const { logAudit } = require('../../utils/logger');

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

// Registra recebimento provisório — status: agendamento_confirmado → recebimento_provisorio
exports.registrar = async (demandaId, dados, usuarioId, ipAddress) => {
	const { responsavel_recebimento, numero_nf, quantidade_recebida, data_recebimento_provisorio } = dados;

	if (!responsavel_recebimento?.trim()) throw makeError('Responsável pelo recebimento é obrigatório.', 400);
	if (!numero_nf?.trim()) throw makeError('Número da nota fiscal é obrigatório.', 400);
	if (!quantidade_recebida || Number(quantidade_recebida) <= 0) throw makeError('Quantidade recebida deve ser maior que zero.', 400);

	const demanda = await getDemanda(demandaId);
	if (demanda.status !== 'agendamento_confirmado') {
		throw makeError(`Recebimento só é permitido com status "agendamento_confirmado". Atual: ${demanda.status}.`, 422);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		const { rows } = await client.query(
			`INSERT INTO gepro.recebimento (
				demanda_id, data_recebimento_provisorio, responsavel_recebimento,
				fornecedor_id, numero_nf, quantidade_recebida, quantidade_solicitada,
				numero_serie, observacoes_embalagem, observacoes_gerais
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
			[
				demandaId,
				data_recebimento_provisorio || new Date(),
				responsavel_recebimento.trim(),
				dados.fornecedor_id || null,
				numero_nf.trim(),
				Number(quantidade_recebida),
				dados.quantidade_solicitada ? Number(dados.quantidade_solicitada) : demanda.quantidade,
				dados.numero_serie || null,
				dados.observacoes_embalagem || null,
				dados.observacoes_gerais || null,
			],
		);
		const recebimento = rows[0];

		await client.query(
			`UPDATE gepro.demanda SET status = 'recebimento_provisorio', data_atualizacao = NOW() WHERE id = $1`,
			[demandaId],
		);

		await client.query(
			`INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao)
			 VALUES ($1, $2, 'recebimento', $3)`,
			[demandaId, usuarioId, `Recebimento provisório registrado. NF: ${numero_nf.trim()}. Qtd: ${quantidade_recebida}.`],
		);

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_recebimento_registrado', 'gepro.recebimento', recebimento.id, {
			demanda_id: demandaId, numero_nf: numero_nf.trim(),
		}, ipAddress);

		return recebimento;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

// Registra testes técnicos — status: recebimento_provisorio → conforme | rejeitado
exports.registrarTestes = async (demandaId, dados, usuarioId, ipAddress) => {
	const RESULTADOS = ['conforme', 'com_desvios', 'nao_conforme'];
	if (!RESULTADOS.includes(dados.resultado_geral)) {
		throw makeError(`resultado_geral inválido. Use: ${RESULTADOS.join(', ')}.`, 400);
	}

	const demanda = await getDemanda(demandaId);
	if (demanda.status !== 'recebimento_provisorio') {
		throw makeError(`Testes só são permitidos com status "recebimento_provisorio". Atual: ${demanda.status}.`, 422);
	}

	const { rows: recRows } = await pool.query(
		'SELECT id FROM gepro.recebimento WHERE demanda_id = $1 ORDER BY data_criacao DESC LIMIT 1',
		[demandaId],
	);
	if (!recRows[0]) throw makeError('Recebimento provisório não encontrado para esta demanda.', 404);
	const recebimentoId = recRows[0].id;

	const novoStatus = dados.resultado_geral === 'nao_conforme' ? 'recebimento_rejeitado' : 'recebimento_testado_conforme';

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		const { rows } = await client.query(
			`INSERT INTO gepro.teste_tecnico (
				recebimento_id, data_teste, responsavel_teste,
				teste_funcionamento_basico, processador_validado, processador_especificado, processador_recebido,
				memoria_ram_validada, memoria_ram_especificada, memoria_ram_recebida,
				armazenamento_validado, armazenamento_especificado, armazenamento_recebido,
				conectividade_validada, ethernet_teste, wifi_teste, usb_teste,
				acessorios_validados, acessorios_inclusos,
				software_licencas_validados, so_versao_recebida,
				documentacao_validada, teste_estresse, compatibilidade_ambiente_ti,
				resultado_geral, descricao_desvios, acao_desvios, data_conclusao_testes
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
			RETURNING *`,
			[
				recebimentoId,
				dados.data_teste || new Date(),
				dados.responsavel_teste || null,
				dados.teste_funcionamento_basico ?? null,
				dados.processador_validado ?? null,
				dados.processador_especificado || null,
				dados.processador_recebido || null,
				dados.memoria_ram_validada ?? null,
				dados.memoria_ram_especificada || null,
				dados.memoria_ram_recebida || null,
				dados.armazenamento_validado ?? null,
				dados.armazenamento_especificado || null,
				dados.armazenamento_recebido || null,
				dados.conectividade_validada ?? null,
				dados.ethernet_teste ?? null,
				dados.wifi_teste ?? null,
				dados.usb_teste ?? null,
				dados.acessorios_validados ?? null,
				dados.acessorios_inclusos || null,
				dados.software_licencas_validados ?? null,
				dados.so_versao_recebida || null,
				dados.documentacao_validada ?? null,
				dados.teste_estresse ?? null,
				dados.compatibilidade_ambiente_ti ?? null,
				dados.resultado_geral,
				dados.descricao_desvios || null,
				dados.acao_desvios || null,
				dados.data_conclusao_testes || new Date(),
			],
		);
		const teste = rows[0];

		await client.query(
			`UPDATE gepro.demanda SET status = $2, data_atualizacao = NOW() WHERE id = $1`,
			[demandaId, novoStatus],
		);

		await client.query(
			`INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao)
			 VALUES ($1, $2, 'recebimento', $3)`,
			[demandaId, usuarioId, `Testes técnicos concluídos. Resultado: ${dados.resultado_geral}.${dados.descricao_desvios ? ' Desvios: ' + dados.descricao_desvios : ''}`],
		);

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_testes_registrados', 'gepro.teste_tecnico', teste.id, {
			demanda_id: demandaId, resultado_geral: dados.resultado_geral,
		}, ipAddress);

		return { ...teste, status_demanda: novoStatus };
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.obter = async (demandaId) => {
	const { rows: recRows } = await pool.query(
		`SELECT r.*, f.nome AS fornecedor_nome
		 FROM gepro.recebimento r
		 LEFT JOIN gepro.fornecedor f ON f.id = r.fornecedor_id
		 WHERE r.demanda_id = $1
		 ORDER BY r.data_criacao DESC LIMIT 1`,
		[demandaId],
	);
	if (!recRows[0]) return null;

	const recebimento = recRows[0];
	const { rows: testeRows } = await pool.query(
		'SELECT * FROM gepro.teste_tecnico WHERE recebimento_id = $1 ORDER BY data_criacao DESC LIMIT 1',
		[recebimento.id],
	);

	return { ...recebimento, teste_tecnico: testeRows[0] || null };
};
