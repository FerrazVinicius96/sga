const { PERMISSIONS } = require('../constants/permissions');

// Valida o header X-Sistema e autoriza acesso ao sistema solicitado.
// Deve ser usado após authenticateToken.
exports.requireSistema = (req, res, next) => {
	const sistema = (req.headers['x-sistema'] || '').toLowerCase();

	if (!sistema) {
		return res.status(400).json({ message: 'Header X-Sistema é obrigatório (gepro ou sga).' });
	}

	if (sistema === 'gepro') {
		if (!PERMISSIONS.SISTEMA_GEPRO.includes(req.user.role)) {
			return res.status(403).json({ message: 'Seu perfil não tem acesso ao sistema GEPRO.' });
		}
	} else if (sistema === 'sga') {
		if (!PERMISSIONS.SISTEMA_SGA.includes(req.user.role)) {
			return res.status(403).json({ message: 'Seu perfil não tem acesso ao sistema SGA.' });
		}
	} else {
		return res.status(400).json({ message: 'X-Sistema inválido. Use "gepro" ou "sga".' });
	}

	req.sistema = sistema;
	next();
};
