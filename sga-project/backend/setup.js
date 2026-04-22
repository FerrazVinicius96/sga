// SGA - Setup do banco de dados local
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'sga_db';
const baseUrl = process.env.DATABASE_URL.replace(`/${DB_NAME}`, '/postgres');

async function setup() {
  console.log('\n======================================');
  console.log('  SGA - Setup do banco de dados local');
  console.log('======================================\n');

  // 1. Conecta ao banco padrão (postgres) para criar o sga_db
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();

  process.stdout.write('[1/3] Criando banco de dados "sga_db" (se não existir)... ');
  try {
    await admin.query(`CREATE DATABASE ${DB_NAME}`);
    console.log('criado.');
  } catch (e) {
    if (e.code === '42P04') console.log('já existe, continuando.');
    else throw e;
  }
  await admin.end();

  // 2. Conecta ao sga_db e aplica o schema
  console.log('[2/3] Aplicando schema (tabelas e índices)...');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('      Schema aplicado com sucesso.');
  await db.end();

  // 3. Resultado
  console.log('\n[3/3] Setup concluído!');
  console.log('\n--------------------------------------');
  console.log('  Credenciais do admin padrão:');
  console.log('  Usuário : admin');
  console.log('  Senha   : Admin@123');
  console.log('--------------------------------------');
  console.log('\n  Para iniciar o backend:');
  console.log('    npm start');
  console.log('\n  Para iniciar o frontend (outra aba):');
  console.log('    cd ../frontend && npm start');
  console.log('\n  Acesse: http://localhost:3000');
  console.log('======================================\n');
}

setup().catch(err => {
  console.error('\n[ERRO]', err.message);
  process.exit(1);
});
