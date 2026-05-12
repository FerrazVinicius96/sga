const { Pool } = require('pg');
const path = require('path');

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
	if (err) {
		console.error('Erro na conexão com o banco de dados: ', err);
	}

	console.log('Servidor conectado!');
});

module.exports = {
	// Para consultas simples e rápidas (onde a transação não importa)
	query: (text, params) => pool.query(text, params),

	// Para obter um client exclusivo (Essencial para transações BEGIN/COMMIT)
	getClient: () => pool.connect(),

	// Opcional: para desligar o banco quando a API cair
	end: () => pool.end(),
};
