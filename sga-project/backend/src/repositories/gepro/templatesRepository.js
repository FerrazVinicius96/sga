const pool = require('../../config/database');

exports.findAtivo = async (tipo) => {
	const tabela = tipo === 'etp' ? 'gepro.template_etp' : 'gepro.template_tr';
	const result = await pool.query(
		`SELECT * FROM ${tabela} WHERE ativo = TRUE ORDER BY data_publicacao DESC LIMIT 1`,
	);
	return result.rows[0] || null;
};

exports.findAll = async (tipo) => {
	const tabela = tipo === 'etp' ? 'gepro.template_etp' : 'gepro.template_tr';
	const result = await pool.query(
		`SELECT id, versao, data_publicacao, ativo, data_criacao FROM ${tabela} ORDER BY data_publicacao DESC`,
	);
	return result.rows;
};

exports.criar = async (tipo, { versao, data_publicacao, json_schema, criado_por_id }) => {
	const tabela = tipo === 'etp' ? 'gepro.template_etp' : 'gepro.template_tr';

	// Desativa todos os anteriores e insere o novo como ativo
	await pool.query(`UPDATE ${tabela} SET ativo = FALSE`);

	const result = await pool.query(
		`INSERT INTO ${tabela} (versao, data_publicacao, json_schema, ativo, criado_por_id)
		 VALUES ($1, $2, $3, TRUE, $4) RETURNING *`,
		[versao, data_publicacao, json_schema, criado_por_id || null],
	);
	return result.rows[0];
};
