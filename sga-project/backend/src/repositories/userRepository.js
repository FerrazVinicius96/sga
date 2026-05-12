const pool = require('../config/database');

exports.findByEmail = async (email) => {
	const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
	return result.rows[0];
};

exports.findById = async (id) => {
	const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
	return result.rows[0];
};

exports.register = async (
	username, email, password_hash, full_name, role,
	job_title, registration_number, cpf, unit_id,
) => {
	const result = await pool.query(
		`INSERT INTO users (username, email, password_hash, full_name, role, job_title, registration_number, cpf, unit_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, username, email, full_name, role`,
		[username, email, password_hash, full_name, role, job_title, registration_number, cpf, unit_id],
	);
	return result.rows[0];
};
