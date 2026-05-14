const pool = require('../../config/database');
const { logAudit } = require('../../utils/logger');

const makeError = (message, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	return err;
};

const LOCALIDADES_VALIDAS = ['CETEC', 'ALMOXARIFADO'];

// RN - Fase 4A: Gerência agenda entrega após NE emitida
exports.agendar = async (demandaId, payload, usuarioId, ipAddress) => {
	const { data_proposta, localidade, observacoes } = payload;

	if (!data_proposta) throw makeError('Data proposta para entrega é obrigatória.', 400);
	if (!localidade || !LOCALIDADES_VALIDAS.includes(localidade)) {
		throw makeError(`Localidade deve ser ${LOCALIDADES_VALIDAS.join(' ou ')}.`, 400);
	}

	const { rows } = await pool.query('SELECT * FROM gepro.demanda WHERE id = $1', [demandaId]);
	const demanda = rows[0];
	if (!demanda) throw makeError('Demanda não encontrada.', 404);

	if (demanda.status !== 'agendamento_pendente') {
		throw makeError(
			`Agendamento só é permitido quando a demanda está em "agendamento_pendente". Status atual: ${demanda.status}.`,
			422,
		);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		// Upsert do agendamento (demanda UNIQUE garante apenas um por demanda)
		await client.query(
			`INSERT INTO gepro.agendamento_entrega
				(demanda_id, data_proposta, localidade, observacoes, agendado_por_id)
			 VALUES ($1, $2, $3, $4, $5)
			 ON CONFLICT (demanda_id) DO UPDATE SET
				data_proposta    = EXCLUDED.data_proposta,
				localidade       = EXCLUDED.localidade,
				observacoes      = EXCLUDED.observacoes,
				agendado_por_id  = EXCLUDED.agendado_por_id,
				data_atualizacao = NOW()`,
			[demandaId, data_proposta, localidade, observacoes || null, usuarioId],
		);

		await client.query(
			`UPDATE gepro.demanda SET
				status               = 'agendamento_confirmado',
				localidade_entrega   = $2,
				data_atualizacao     = NOW()
			 WHERE id = $1`,
			[demandaId, localidade],
		);

		await client.query(
			`INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao)
			 VALUES ($1, $2, 'recebimento', $3)`,
			[
				demandaId,
				usuarioId,
				`Entrega agendada para ${data_proposta} em ${localidade}.${observacoes ? ' ' + observacoes : ''}`,
			],
		);

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_entrega_agendada', 'gepro.demanda', demandaId, {
			data_proposta,
			localidade,
		}, ipAddress);

		return { demanda_id: Number(demandaId), data_proposta, localidade, status: 'agendamento_confirmado' };
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

exports.obter = async (demandaId) => {
	const { rows } = await pool.query(
		`SELECT a.*, u.full_name AS agendado_por_nome
		 FROM gepro.agendamento_entrega a
		 LEFT JOIN users u ON u.id = a.agendado_por_id
		 WHERE a.demanda_id = $1`,
		[demandaId],
	);
	if (!rows[0]) throw makeError('Agendamento não encontrado para esta demanda.', 404);
	return rows[0];
};
