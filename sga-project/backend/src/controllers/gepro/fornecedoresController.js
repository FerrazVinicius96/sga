const pool = require('../../config/database');

const handleError = (res, error, contexto) => {
	const status = error.statusCode || 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor.';
	if (!error.statusCode) console.error(`Erro em ${contexto}:`, error);
	return res.status(status).json({ message });
};

exports.listar = async (req, res) => {
	try {
		const { rows } = await pool.query(
			'SELECT id, nome, cnpj, telefone, email, cidade, ativo FROM gepro.fornecedor ORDER BY nome ASC',
		);
		return res.status(200).json({ success: true, data: rows });
	} catch (error) {
		return handleError(res, error, 'listar fornecedores');
	}
};

exports.criar = async (req, res) => {
	const { nome, cnpj, telefone, email, endereco, cidade } = req.body;
	if (!nome?.trim()) {
		return res.status(400).json({ message: 'Nome do fornecedor é obrigatório.' });
	}
	try {
		const { rows } = await pool.query(
			`INSERT INTO gepro.fornecedor (nome, cnpj, telefone, email, endereco, cidade, ativo)
			 VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
			[nome.trim(), cnpj?.trim() || null, telefone?.trim() || null, email?.trim() || null, endereco?.trim() || null, cidade?.trim() || null],
		);
		return res.status(201).json({ success: true, data: rows[0] });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(409).json({ message: 'CNPJ já cadastrado.' });
		}
		return handleError(res, error, 'criar fornecedor');
	}
};

exports.atualizar = async (req, res) => {
	const { id } = req.params;
	const { nome, cnpj, telefone, email, endereco, cidade, ativo } = req.body;
	try {
		const { rows } = await pool.query(
			`UPDATE gepro.fornecedor SET
				nome      = COALESCE($2, nome),
				cnpj      = COALESCE($3, cnpj),
				telefone  = COALESCE($4, telefone),
				email     = COALESCE($5, email),
				endereco  = COALESCE($6, endereco),
				cidade    = COALESCE($7, cidade),
				ativo     = COALESCE($8, ativo)
			 WHERE id = $1 RETURNING *`,
			[id, nome?.trim() || null, cnpj?.trim() || null, telefone?.trim() || null,
			 email?.trim() || null, endereco?.trim() || null, cidade?.trim() || null,
			 ativo !== undefined ? ativo : null],
		);
		if (!rows[0]) return res.status(404).json({ message: 'Fornecedor não encontrado.' });
		return res.status(200).json({ success: true, data: rows[0] });
	} catch (error) {
		return handleError(res, error, 'atualizar fornecedor');
	}
};
