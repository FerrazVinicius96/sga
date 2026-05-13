const pool = require('../../config/database');

exports.gerarNumeroDemanda = async () => {
	const ano = new Date().getFullYear();
	const result = await pool.query(`SELECT NEXTVAL('gepro.seq_numero_demanda') AS seq`);
	const seq = result.rows[0].seq.toString().padStart(3, '0');
	return `GEPRO-${ano}-${seq}`;
};

exports.criar = async (client, data) => {
	const result = await client.query(
		`INSERT INTO gepro.demanda (
			numero_demanda, usuario_criador_id, gestor_id, titulo, descricao,
			tipo_equipamento, quantidade, data_necessidade_prevista, setor_solicitante,
			pca_id, aquisicao_emergencial, justificativa_emergencial, valor_estimado,
			modalidade_licitatoria, status
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'necessidade_rascunho')
		RETURNING *`,
		[
			data.numero_demanda,
			data.usuario_criador_id,
			data.gestor_id || null,
			data.titulo,
			data.descricao,
			data.tipo_equipamento || null,
			data.quantidade,
			data.data_necessidade_prevista || null,
			data.setor_solicitante || null,
			data.pca_id || null,
			data.aquisicao_emergencial || false,
			data.justificativa_emergencial || null,
			data.valor_estimado || null,
			data.modalidade_licitatoria || null,
		],
	);
	return result.rows[0];
};

exports.criarNecessidade = async (client, demandaId, dadosNecessidade = {}) => {
	const result = await client.query(
		`INSERT INTO gepro.necessidade (demanda_id, descricao_necessidade, justificativa_tecnica, justificativa_negocio)
		 VALUES ($1, $2, $3, $4)
		 RETURNING *`,
		[
			demandaId,
			dadosNecessidade.descricao_necessidade || null,
			dadosNecessidade.justificativa_tecnica || null,
			dadosNecessidade.justificativa_negocio || null,
		],
	);
	return result.rows[0];
};

exports.registrarAcompanhamento = async (client, demandaId, usuarioId, fase, observacao) => {
	await client.query(
		`INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao)
		 VALUES ($1, $2, $3, $4)`,
		[demandaId, usuarioId, fase, observacao],
	);
};

exports.registrarAprovacao = async (client, demandaId, usuarioId, tipoAprovacao, resultado, observacoes) => {
	const result = await client.query(
		`INSERT INTO gepro.aprovacao (demanda_id, usuario_id, tipo_aprovacao, resultado, observacoes)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING *`,
		[demandaId, usuarioId, tipoAprovacao, resultado, observacoes || null],
	);
	return result.rows[0];
};

exports.atualizarStatus = async (client, id, status, camposExtras = {}) => {
	const setClauses = ['status = $2', 'data_atualizacao = NOW()'];
	const values = [id, status];
	let idx = 3;

	for (const [campo, valor] of Object.entries(camposExtras)) {
		setClauses.push(`${campo} = $${idx}`);
		values.push(valor);
		idx++;
	}

	const result = await client.query(
		`UPDATE gepro.demanda SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
		values,
	);
	return result.rows[0];
};

exports.findById = async (id) => {
	const result = await pool.query(
		`SELECT
			d.*,
			u.full_name AS criador_nome,
			u.email AS criador_email,
			g.full_name AS gestor_nome,
			n.descricao_necessidade,
			n.justificativa_tecnica,
			n.justificativa_negocio,
			n.duplicacao_verificada,
			n.compatibilidade_infraestrutura_validada
		 FROM gepro.demanda d
		 LEFT JOIN users u ON u.id = d.usuario_criador_id
		 LEFT JOIN users g ON g.id = d.gestor_id
		 LEFT JOIN gepro.necessidade n ON n.demanda_id = d.id
		 WHERE d.id = $1`,
		[id],
	);
	return result.rows[0] || null;
};

exports.findAll = async ({ status, criador_id, gestor_id, search, limit = 50, offset = 0 } = {}) => {
	const conditions = [];
	const values = [];
	let idx = 1;

	if (status) {
		values.push(status);
		conditions.push(`d.status = $${idx++}`);
	}
	if (criador_id) {
		values.push(criador_id);
		conditions.push(`d.usuario_criador_id = $${idx++}`);
	}
	if (gestor_id) {
		values.push(gestor_id);
		conditions.push(`d.gestor_id = $${idx++}`);
	}
	if (search) {
		values.push(`%${search}%`);
		conditions.push(`(d.titulo ILIKE $${idx} OR d.numero_demanda ILIKE $${idx} OR d.tipo_equipamento ILIKE $${idx})`);
		idx++;
	}

	const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
	values.push(limit, offset);

	const result = await pool.query(
		`SELECT
			d.id, d.numero_demanda, d.titulo, d.tipo_equipamento,
			d.quantidade, d.status, d.setor_solicitante, d.valor_estimado,
			d.data_criacao, d.data_atualizacao,
			u.full_name AS criador_nome,
			g.full_name AS gestor_nome
		 FROM gepro.demanda d
		 LEFT JOIN users u ON u.id = d.usuario_criador_id
		 LEFT JOIN users g ON g.id = d.gestor_id
		 ${where}
		 ORDER BY d.data_criacao DESC
		 LIMIT $${idx} OFFSET $${idx + 1}`,
		values,
	);
	return result.rows;
};

exports.findFilaAprovacoes = async () => {
	const result = await pool.query(
		`SELECT
			d.id, d.numero_demanda, d.titulo, d.tipo_equipamento,
			d.quantidade, d.setor_solicitante, d.valor_estimado, d.data_criacao,
			u.full_name AS criador_nome, u.email AS criador_email
		 FROM gepro.demanda d
		 LEFT JOIN users u ON u.id = d.usuario_criador_id
		 WHERE d.status = 'necessidade_rascunho'
		 ORDER BY d.data_criacao ASC`,
	);
	return result.rows;
};

exports.findAcompanhamento = async (demandaId) => {
	const result = await pool.query(
		`SELECT
			a.id, a.fase_atual, a.observacao, a.data_acompanhamento,
			u.full_name AS usuario_nome, u.role AS usuario_role
		 FROM gepro.acompanhamento a
		 JOIN users u ON u.id = a.usuario_id
		 WHERE a.demanda_id = $1
		 ORDER BY a.data_acompanhamento ASC`,
		[demandaId],
	);
	return result.rows;
};
