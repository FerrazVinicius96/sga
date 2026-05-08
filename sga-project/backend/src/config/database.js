const { Pool } = require('pg');
const path = require('path');

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
	console.error('Erro na conexão com o banco de dados: ', err);
});

module.exports = pool;
