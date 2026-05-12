// Importe a conexão com o banco de dados (ajuste o caminho se necessário)
const pool = require('../config/database');

exports.logAudit = async (
	userId,
	actionType,
	targetEntity = null,
	targetId = null,
	details = null,
	ipAddress = null,
) => {
	try {
		await pool.query(
			`INSERT INTO audit_logs (user_id, action_type, target_entity, target_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				userId,
				actionType,
				targetEntity,
				targetId,
				details ? JSON.stringify(details) : null,
				ipAddress,
			],
		);
	} catch (error) {
		// Apenas loga no console para não interromper o fluxo do usuário caso o log falhe
		console.error('Erro ao registrar log de auditoria:', error);
	}
};
