const pool = require('../../config/database');

exports.findByEmail = async (email) => {
	const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
	return result.rows[0];
};

exports.findById = async (id) => {
	const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
	return result.rows[0];
};

exports.findAll = async ({ role, is_active, search } = {}) => {
	const conditions = [];
	const values = [];

	if (role !== undefined) {
		values.push(role);
		conditions.push(`role = $${values.length}`);
	}

	if (is_active !== undefined) {
		values.push(is_active);
		conditions.push(`is_active = $${values.length}`);
	}

	if (search) {
		values.push(`%${search}%`);
		const idx = values.length;
		conditions.push(
			`(full_name ILIKE $${idx} OR email ILIKE $${idx} OR username ILIKE $${idx})`,
		);
	}

	const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

	const result = await pool.query(
		`SELECT id, username, email, full_name, role, is_active, job_title,
		        registration_number, cpf, unit_id, created_at
		 FROM users ${where} ORDER BY full_name ASC`,
		values,
	);
	return result.rows;
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

exports.update = async (id, { email, full_name, role, job_title, registration_number, cpf, unit_id }) => {
	const result = await pool.query(
		`UPDATE users
		 SET email = $1, full_name = $2, role = $3, job_title = $4,
		     registration_number = $5, cpf = $6, unit_id = $7, updated_at = NOW()
		 WHERE id = $8
		 RETURNING id, username, email, full_name, role, is_active, job_title,
		           registration_number, cpf, unit_id`,
		[email, full_name, role, job_title, registration_number, cpf, unit_id, id],
	);
	return result.rows[0];
};

exports.updatePassword = async (id, password_hash) => {
	await pool.query(
		`UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
		 WHERE id = $2`,
		[password_hash, id],
	);
};

exports.setActiveStatus = async (id, is_active) => {
	const result = await pool.query(
		`UPDATE users SET is_active = $1, updated_at = NOW()
		 WHERE id = $2
		 RETURNING id, is_active`,
		[is_active, id],
	);
	return result.rows[0];
};

exports.deleteById = async (id) => {
	await pool.query('DELETE FROM users WHERE id = $1', [id]);
};
