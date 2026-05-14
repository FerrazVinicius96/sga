const pool = require('../../config/database');

exports.criar = async (client, { numero_contrato, demanda_id, fornecedor_id, objeto, valor_total, data_inicio, data_fim, criado_por_id }) => {
	const result = await client.query(
		`INSERT INTO gepro.contrato
			(numero_contrato, demanda_id, fornecedor_id, objeto, valor_total, data_inicio, data_fim, criado_por_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING *`,
		[numero_contrato, demanda_id || null, fornecedor_id, objeto, valor_total, data_inicio, data_fim, criado_por_id || null],
	);
	return result.rows[0];
};

exports.criarItens = async (client, contratoId, itens) => {
	const inseridos = [];
	for (const item of itens) {
		const result = await client.query(
			`INSERT INTO gepro.contrato_item (contrato_id, descricao, valor_unitario, quantidade_estimada)
			 VALUES ($1, $2, $3, $4) RETURNING *`,
			[contratoId, item.descricao, item.valor_unitario, item.quantidade_estimada],
		);
		inseridos.push(result.rows[0]);
	}
	return inseridos;
};

exports.findById = async (id) => {
	const result = await pool.query(
		`SELECT c.*,
			f.nome AS fornecedor_nome, f.cnpj AS fornecedor_cnpj, f.email AS fornecedor_email,
			u.full_name AS criado_por_nome
		 FROM gepro.contrato c
		 LEFT JOIN gepro.fornecedor f ON f.id = c.fornecedor_id
		 LEFT JOIN users u ON u.id = c.criado_por_id
		 WHERE c.id = $1`,
		[id],
	);
	if (!result.rows[0]) return null;

	const itens = await pool.query(
		'SELECT * FROM gepro.contrato_item WHERE contrato_id = $1 ORDER BY id',
		[id],
	);
	return { ...result.rows[0], itens: itens.rows };
};

exports.findAll = async ({ status, fornecedor_id, limit = 50, offset = 0 } = {}) => {
	const conditions = [];
	const values = [];
	let idx = 1;

	if (status) { values.push(status); conditions.push(`c.status = $${idx++}`); }
	if (fornecedor_id) { values.push(fornecedor_id); conditions.push(`c.fornecedor_id = $${idx++}`); }

	const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
	values.push(limit, offset);

	const result = await pool.query(
		`SELECT c.id, c.numero_contrato, c.objeto, c.valor_total, c.data_inicio, c.data_fim,
			c.status, c.data_criacao, f.nome AS fornecedor_nome
		 FROM gepro.contrato c
		 LEFT JOIN gepro.fornecedor f ON f.id = c.fornecedor_id
		 ${where}
		 ORDER BY c.data_criacao DESC
		 LIMIT $${idx} OFFSET $${idx + 1}`,
		values,
	);
	return result.rows;
};

exports.atualizarStatus = async (client, id, status) => {
	const result = await client.query(
		`UPDATE gepro.contrato SET status = $2, data_atualizacao = NOW() WHERE id = $1 RETURNING *`,
		[id, status],
	);
	return result.rows[0];
};

exports.inserirMetrica = async (client, { contrato_id, mes, ano, metrica_descricao, meta_quantidade, quantidade_realizada, observacao, registrado_por_id }) => {
	const result = await client.query(
		`INSERT INTO gepro.contrato_metrica
			(contrato_id, mes, ano, metrica_descricao, meta_quantidade, quantidade_realizada, observacao, registrado_por_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 ON CONFLICT (contrato_id, mes, ano) DO UPDATE SET
			metrica_descricao    = EXCLUDED.metrica_descricao,
			meta_quantidade      = EXCLUDED.meta_quantidade,
			quantidade_realizada = EXCLUDED.quantidade_realizada,
			observacao           = EXCLUDED.observacao,
			registrado_por_id    = EXCLUDED.registrado_por_id,
			data_atualizacao     = NOW()
		 RETURNING *`,
		[contrato_id, mes, ano, metrica_descricao, meta_quantidade, quantidade_realizada || 0, observacao || null, registrado_por_id || null],
	);
	return result.rows[0];
};

exports.findMetricas = async (contratoId) => {
	const result = await pool.query(
		`SELECT m.*,
			CASE WHEN m.meta_quantidade > 0
				THEN ROUND((m.quantidade_realizada / m.meta_quantidade * 100), 2)
				ELSE 0
			END AS percentual_cumprimento,
			u.full_name AS registrado_por_nome
		 FROM gepro.contrato_metrica m
		 LEFT JOIN users u ON u.id = m.registrado_por_id
		 WHERE m.contrato_id = $1
		 ORDER BY m.ano, m.mes`,
		[contratoId],
	);
	return result.rows;
};
