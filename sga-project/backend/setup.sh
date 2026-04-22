#!/bin/bash
# =============================================================
# SGA - Script de setup para ambiente local de estudo
# Pré-requisito: PostgreSQL instalado e rodando
# =============================================================

set -e

# Lê variáveis do .env
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_NAME="sga_db"
DB_USER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-admin}"

PSQL="C:/Program Files/PostgreSQL/18/bin/psql.exe"

echo ""
echo "======================================"
echo "  SGA - Setup do banco de dados local"
echo "======================================"
echo ""

# 1. Cria o banco se não existir
echo "[1/3] Criando banco de dados '$DB_NAME' (se não existir)..."
"$PSQL" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && \
  echo "      Banco criado com sucesso." || \
  echo "      Banco já existe, continuando..."

# 2. Aplica o schema
echo "[2/3] Aplicando schema (tabelas e índices)..."
"$PSQL" -U "$DB_USER" -d "$DB_NAME" -f schema.sql
echo "      Schema aplicado com sucesso."

# 3. Resultado
echo ""
echo "[3/3] Setup concluído!"
echo ""
echo "--------------------------------------"
echo "  Credenciais do admin padrão:"
echo "  Usuário : admin"
echo "  Senha   : Admin@123"
echo "--------------------------------------"
echo ""
echo "  Para iniciar o backend:"
echo "    npm start"
echo ""
echo "  Para iniciar o frontend (outra aba):"
echo "    cd ../frontend && npm start"
echo ""
echo "  Acesse: http://localhost:3000"
echo "======================================"
echo ""
