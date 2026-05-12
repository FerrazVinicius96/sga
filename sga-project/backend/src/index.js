const path = require('path');
// Carrega as variáveis de ambiente baseadas no caminho do seu código original
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const startServer = require('./server');
const pool = require('./config/database'); // Importado apenas para validar a conexão se desejar

const bootstrap = async () => {
	try {
		const result = await pool.query('SELECT NOW();');
		console.log('📦 Banco de dados conectado com sucesso.');
		console.log('⏰ Hora atual no banco: ', result.rows[0].now);

		// Inicia o servidor HTTP
		startServer();
	} catch (error) {
		console.error('🔥 Erro fatal ao iniciar a aplicação:', error);
		process.exit(1);
	}
};

bootstrap();
