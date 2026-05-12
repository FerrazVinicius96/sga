// Importe a sua conexão com o banco de dados
const pool = require('../config/database');

exports.findByEmail = async (email) => {
	const result = await pool.query('SELECT * FROM users WHERE email = $1', [
		email,
	]);
	return result.rows[0];
};

exports.findById = async (id) => {
	const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
	return result.rows[0];
};
