const pool = require('../../config/database');

exports.obter = async (req, res) => {
	try {
		const { rows: porStatus } = await pool.query(
			`SELECT status, COUNT(*)::int AS total
			 FROM gepro.demanda
			 GROUP BY status
			 ORDER BY status`,
		);

		const { rows: totais } = await pool.query(
			`SELECT
				COUNT(*)::int                                                        AS total,
				COUNT(*) FILTER (WHERE status = 'necessidade_rascunho')::int         AS rascunho,
				COUNT(*) FILTER (WHERE status = 'necessidade_aprovada')::int         AS aguardando_instrucao,
				COUNT(*) FILTER (WHERE status LIKE 'instrucao%')::int                AS em_instrucao,
				COUNT(*) FILTER (WHERE status LIKE 'encaminhamento%')::int           AS em_encaminhamento,
				COUNT(*) FILTER (WHERE status LIKE 'agendamento%')::int              AS em_agendamento,
				COUNT(*) FILTER (WHERE status LIKE 'recebimento%')::int              AS em_recebimento,
				COUNT(*) FILTER (WHERE status LIKE 'encerramento%')::int             AS encerradas,
				COUNT(*) FILTER (WHERE status = 'encerramento_finalizado')::int      AS finalizadas
			 FROM gepro.demanda`,
		);

		const { rows: recentes } = await pool.query(
			`SELECT d.id, d.numero_demanda, d.titulo, d.status, d.valor_estimado,
			        d.data_criacao, u.full_name AS criador_nome
			 FROM gepro.demanda d
			 LEFT JOIN users u ON u.id = d.usuario_criador_id
			 ORDER BY d.data_criacao DESC
			 LIMIT 5`,
		);

		return res.status(200).json({
			success: true,
			data: {
				totais: totais[0],
				por_status: porStatus,
				recentes,
			},
		});
	} catch (error) {
		console.error('Erro em stats:', error);
		return res.status(500).json({ message: 'Erro interno no servidor.' });
	}
};
