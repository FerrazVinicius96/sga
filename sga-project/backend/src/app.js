const express = require('express');
const cors = require('cors');
const authRoute = require('./routes/authRoute');
const usersRoute = require('./routes/usersRoute');

const app = express();

// --- MIDDLEWARES GLOBAIS ---
app.use(express.json()); // Parseia corpos de requisição JSON
app.use(
	cors({
		exposedHeaders: 'Content-Disposition',
	}),
);

// --- ROTAS DA APLICAÇÃO ---
// Endpoint de verificação de saúde (Health Check)
app.get('/api/', (req, res) => {
	res.status(200).send('API rodando com sucesso!');
});

// Monta o módulo de rotas de autenticação
app.use('/api/auth', authRoute);
// Monta o módulo de rotas para usuários
app.use('/api/users', usersRoute);

module.exports = app;
