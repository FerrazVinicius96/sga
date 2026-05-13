const { PERMISSIONS } = require('../constants/permissions');

exports.getSistemas = (req, res) => {
	const { role } = req.user;
	const sistemas = [];

	if (PERMISSIONS.SISTEMA_SGA.includes(role)) sistemas.push('sga');
	if (PERMISSIONS.SISTEMA_GEPRO.includes(role)) sistemas.push('gepro');

	return res.status(200).json({ sistemas });
};
