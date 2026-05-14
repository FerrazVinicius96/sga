const pool = require('../../config/database');
const { logAudit } = require('../../utils/logger');

const makeError = (message, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	return err;
};

// RN008/RN009: GPOT emite NE → sistema notifica gerência e move demanda para agendamento_pendente
exports.emitirNotaEmpenho = async (demandaId, { nota_empenho_numero, data_nota_empenho }, usuarioId, ipAddress) => {
	if (!nota_empenho_numero || !nota_empenho_numero.trim()) {
		throw makeError('Número da Nota de Empenho é obrigatório.', 400);
	}
	if (!data_nota_empenho) {
		throw makeError('Data da Nota de Empenho é obrigatória.', 400);
	}

	const { rows } = await pool.query('SELECT * FROM gepro.demanda WHERE id = $1', [demandaId]);
	const demanda = rows[0];
	if (!demanda) throw makeError('Demanda não encontrada.', 404);

	const statusPermitidos = [
		'encaminhamento_aguardando_juridico',
		'encaminhamento_aprovado_juridico',
	];
	if (!statusPermitidos.includes(demanda.status)) {
		throw makeError(
			`Nota de Empenho só pode ser emitida quando a demanda está em encaminhamento. Status atual: ${demanda.status}.`,
			422,
		);
	}

	const dataNE = new Date(data_nota_empenho);
	if (dataNE < new Date(demanda.data_criacao)) {
		throw makeError('Data da NE não pode ser anterior à criação da demanda. (V019)', 400);
	}

	const client = await pool.getClient();
	try {
		await client.query('BEGIN');

		await client.query(
			`UPDATE gepro.demanda SET
				status                 = 'agendamento_pendente',
				nota_empenho_numero    = $2,
				data_nota_empenho      = $3,
				data_atualizacao       = NOW()
			 WHERE id = $1`,
			[demandaId, nota_empenho_numero.trim(), data_nota_empenho],
		);

		await client.query(
			`INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao)
			 VALUES ($1, $2, 'encaminhamento', $3)`,
			[
				demandaId,
				usuarioId,
				`Nota de Empenho emitida: ${nota_empenho_numero.trim()}. Aguardando agendamento de entrega pela gerência.`,
			],
		);

		await client.query('COMMIT');

		await logAudit(usuarioId, 'gepro_ne_emitida', 'gepro.demanda', demandaId, {
			nota_empenho_numero: nota_empenho_numero.trim(),
			data_nota_empenho,
		}, ipAddress);

		return { demanda_id: demandaId, nota_empenho_numero: nota_empenho_numero.trim(), status: 'agendamento_pendente' };
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};
