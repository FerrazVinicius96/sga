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

// Registra confirmação de pagamento — status: recebimento_testado_conforme → encerramento_pagamento_realizado
exports.registrar = async (demandaId, dados, usuarioId, ipAddress) => {
	const demanda = await getDemanda(demandaId);
	if (demanda.status !== 'recebimento_testado_conforme') {
		throw makeError(`Encerramento só é permitido com status "recebimento_testado_conforme". Atual: ${demanda.status}.`, 422);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		const { rows } = await client.query(
			`INSERT INTO gepro.encerramento (
				demanda_id, data_confirmacao_pagamento, status_pagamento,
				numero_patrimonio_sga, observacoes_encerramento
			) VALUES ($1, $2, 'realizado', $3, $4) RETURNING *`,
			[
				demandaId,
				dados.data_confirmacao_pagamento || new Date(),
				dados.numero_patrimonio_sga || null,
				dados.observacoes_encerramento || null,
			],
		);
		const encerramento = rows[0];

		await client.query(
			`UPDATE gepro.demanda SET status = 'encerramento_pagamento_realizado', data_atualizacao = NOW() WHERE id = $1`,
			[demandaId],
		);

		await client.query(
			`INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao)
			 VALUES ($1, $2, 'encerramento', $3)`,
			[demandaId, usuarioId, `Pagamento confirmado.${dados.numero_patrimonio_sga ? ' Patrimônio SGA: ' + dados.numero_patrimonio_sga : ''}`],
		);

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_pagamento_confirmado', 'gepro.encerramento', encerramento.id, {
			demanda_id: demandaId,
		}, ipAddress);

		return encerramento;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

// Finaliza demanda — status: encerramento_pagamento_realizado → encerramento_finalizado
exports.finalizar = async (demandaId, dados, usuarioId, ipAddress) => {
	const demanda = await getDemanda(demandaId);
	if (demanda.status !== 'encerramento_pagamento_realizado') {
		throw makeError(`Finalização só é permitida com status "encerramento_pagamento_realizado". Atual: ${demanda.status}.`, 422);
	}

	const { rows: encRows } = await pool.query(
		'SELECT id FROM gepro.encerramento WHERE demanda_id = $1 ORDER BY data_criacao DESC LIMIT 1',
		[demandaId],
	);
	if (!encRows[0]) throw makeError('Registro de encerramento não encontrado.', 404);

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		await client.query(
			`UPDATE gepro.encerramento SET
				relatorio_conclusao    = $2,
				licoes_aprendidas      = $3,
				recomendacoes_futuras  = $4,
				data_finalizacao       = NOW()
			 WHERE id = $1`,
			[
				encRows[0].id,
				dados.relatorio_conclusao || null,
				dados.licoes_aprendidas || null,
				dados.recomendacoes_futuras || null,
			],
		);

		await client.query(
			`UPDATE gepro.demanda SET status = 'encerramento_finalizado', data_atualizacao = NOW() WHERE id = $1`,
			[demandaId],
		);

		await client.query(
			`INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao)
			 VALUES ($1, $2, 'encerramento', 'Demanda finalizada com sucesso.')`,
			[demandaId, usuarioId],
		);

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_demanda_finalizada', 'gepro.demanda', demandaId, {
			numero_demanda: demanda.numero_demanda,
		}, ipAddress);

		return { demanda_id: Number(demandaId), status: 'encerramento_finalizado' };
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.obter = async (demandaId) => {
	const { rows } = await pool.query(
		'SELECT * FROM gepro.encerramento WHERE demanda_id = $1 ORDER BY data_criacao DESC LIMIT 1',
		[demandaId],
	);
	return rows[0] || null;
};
