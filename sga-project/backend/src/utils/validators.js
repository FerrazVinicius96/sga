const { ROLES } = require('../constants/permissions');

const VALID_ROLES = Object.values(ROLES);

// Verifica se todos os campos obrigatórios estão presentes e não vazios.
// Retorna null se válido, ou string com mensagem de erro.
exports.validateRequiredFields = (fields, data) => {
	const missing = fields.filter((f) => !data[f] && data[f] !== 0);
	if (missing.length === 0) return null;
	return `Campos obrigatórios ausentes: ${missing.join(', ')}.`;
};

// Valida formato de e-mail.
exports.isValidEmail = (email) => {
	if (typeof email !== 'string') return false;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Valida que o role está entre os perfis definidos no sistema.
exports.isValidRole = (role) => VALID_ROLES.includes(role);

// Valida formato de username: 3–50 chars, letras, números, ponto e underscore.
exports.isValidUsername = (username) => {
	if (typeof username !== 'string') return false;
	return /^[a-zA-Z0-9._]{3,50}$/.test(username.trim());
};

// Valida CPF brasileiro (formato e dígitos verificadores).
// Aceita "000.000.000-00" ou "00000000000".
exports.isValidCPF = (cpf) => {
	if (!cpf || typeof cpf !== 'string') return false;

	const digits = cpf.replace(/\D/g, '');
	if (digits.length !== 11) return false;
	if (/^(\d)\1{10}$/.test(digits)) return false; // sequência repetida

	const calcDigit = (base) => {
		const sum = base.reduce((acc, d, i) => acc + parseInt(d) * (base.length + 1 - i), 0);
		const rem = (sum * 10) % 11;
		return rem === 10 || rem === 11 ? 0 : rem;
	};

	const d = digits.split('');
	return (
		calcDigit(d.slice(0, 9)) === parseInt(d[9]) &&
		calcDigit(d.slice(0, 10)) === parseInt(d[10])
	);
};
