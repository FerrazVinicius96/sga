const express = require('express');
const cors = require('cors');
const authRoute = require('./routes/authRoute');
const usersRoute = require('./routes/usersRoute');
const bifurcacaoRoute = require('./routes/bifurcacaoRoute');
const demandasRoute = require('./routes/gepro/demandasRoute');
const templatesRoute = require('./routes/gepro/templatesRoute');
const contratosRoute = require('./routes/gepro/contratosRoute');
const fornecedoresRoute = require('./routes/gepro/fornecedoresRoute');
const statsRoute = require('./routes/gepro/statsRoute');

const app = express();

// --- MIDDLEWARES GLOBAIS ---
app.use(express.json());
app.use(
	cors({
		exposedHeaders: 'Content-Disposition',
	}),
);

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- ROTAS DA APLICAÇÃO ---
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/bifurcacao', bifurcacaoRoute);

// GEPRO
app.use('/api/gepro/demandas', demandasRoute);
app.use('/api/gepro/templates', templatesRoute);
app.use('/api/gepro/contratos', contratosRoute);
app.use('/api/gepro/fornecedores', fornecedoresRoute);
app.use('/api/gepro/stats', statsRoute);

module.exports = app;
