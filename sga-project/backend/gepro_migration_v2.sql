-- =============================================
-- GEPRO Migration v2: Adequação Gerencial
-- Data: 2026-05-13
-- Docs: REGRAS_NEGOCIO_REVISADAS.md, IMPACTO_TECNICO_REVISAO.md
-- Execução: psql -U postgres -d sga_db -f gepro_migration_v2.sql
-- =============================================

-- ============================================================
-- 0. ALTER TABLE gepro.cotacao — adicionar campo vencedor (RN006)
-- ============================================================
ALTER TABLE gepro.cotacao ADD COLUMN IF NOT EXISTS vencedor BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_cotacao_vencedor ON gepro.cotacao(demanda_id, vencedor) WHERE vencedor = TRUE;

-- ============================================================
-- 1. ALTER TABLE gepro.demanda — novas colunas e constraints
-- ============================================================

ALTER TABLE gepro.demanda
  ADD COLUMN IF NOT EXISTS nota_empenho_numero  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS data_nota_empenho    DATE,
  ADD COLUMN IF NOT EXISTS localidade_entrega   VARCHAR(20)
    CHECK (localidade_entrega IN ('CETEC', 'ALMOXARIFADO'));

-- Garantia de unicidade da NE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'gepro.demanda'::regclass
      AND conname = 'demanda_nota_empenho_numero_key'
  ) THEN
    ALTER TABLE gepro.demanda ADD CONSTRAINT demanda_nota_empenho_numero_key
      UNIQUE (nota_empenho_numero);
  END IF;
END $$;

-- Atualizar CHECK constraint de status para incluir novos estados
ALTER TABLE gepro.demanda DROP CONSTRAINT IF EXISTS demanda_status_check;
ALTER TABLE gepro.demanda ADD CONSTRAINT demanda_status_check CHECK (status IN (
  'necessidade_rascunho',
  'necessidade_aprovada',
  'instrucao_rascunho',
  'instrucao_aprovada_gestor',
  'instrucao_rejeitada_gestor',
  'encaminhamento_aguardando_juridico',
  'encaminhamento_aprovado_juridico',
  'encaminhamento_rejeitado_juridico',
  'nota_empenho_emitida',
  'agendamento_pendente',
  'agendamento_confirmado',
  'recebimento_provisorio',
  'recebimento_testado_conforme',
  'recebimento_rejeitado',
  'encerramento_pagamento_realizado',
  'encerramento_finalizado'
));

-- Atualizar CHECK constraint de modalidade para incluir ata_registro_precos
ALTER TABLE gepro.demanda DROP CONSTRAINT IF EXISTS demanda_modalidade_licitatoria_check;
ALTER TABLE gepro.demanda ADD CONSTRAINT demanda_modalidade_licitatoria_check CHECK (
  modalidade_licitatoria IN ('pregao', 'concorrencia', 'srp', 'convite', 'ata_registro_precos')
);

-- ============================================================
-- 2. gepro.template_etp — versionamento de templates ETP (PGM)
-- ============================================================
CREATE TABLE IF NOT EXISTS gepro.template_etp (
  id               SERIAL PRIMARY KEY,
  versao           VARCHAR(20) NOT NULL,
  data_publicacao  DATE NOT NULL,
  json_schema      JSONB NOT NULL,
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  criado_por_id    INTEGER REFERENCES users(id),
  data_criacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. gepro.template_tr — versionamento de templates TR (PGM)
-- ============================================================
CREATE TABLE IF NOT EXISTS gepro.template_tr (
  id               SERIAL PRIMARY KEY,
  versao           VARCHAR(20) NOT NULL,
  data_publicacao  DATE NOT NULL,
  json_schema      JSONB NOT NULL,
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  criado_por_id    INTEGER REFERENCES users(id),
  data_criacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. gepro.agendamento_entrega — Fase 4A
-- ============================================================
CREATE TABLE IF NOT EXISTS gepro.agendamento_entrega (
  id               SERIAL PRIMARY KEY,
  demanda_id       INTEGER NOT NULL REFERENCES gepro.demanda(id),
  data_proposta    DATE NOT NULL,
  localidade       VARCHAR(20) NOT NULL CHECK (localidade IN ('CETEC', 'ALMOXARIFADO')),
  observacoes      TEXT,
  data_confirmacao DATE,
  agendado_por_id  INTEGER REFERENCES users(id),
  data_criacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (demanda_id)
);

-- ============================================================
-- 5. gepro.contrato — Módulo DANTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS gepro.contrato (
  id               SERIAL PRIMARY KEY,
  numero_contrato  VARCHAR(100) NOT NULL UNIQUE,
  demanda_id       INTEGER REFERENCES gepro.demanda(id),
  fornecedor_id    INTEGER NOT NULL REFERENCES gepro.fornecedor(id),
  objeto           TEXT NOT NULL,
  valor_total      DECIMAL(15,2) NOT NULL CHECK (valor_total > 0),
  data_inicio      DATE NOT NULL,
  data_fim         DATE NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'encerrado', 'suspenso')),
  criado_por_id    INTEGER REFERENCES users(id),
  data_criacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (data_fim > data_inicio)
);

-- ============================================================
-- 6. gepro.contrato_item — itens de contrato com valores unitários
-- ============================================================
CREATE TABLE IF NOT EXISTS gepro.contrato_item (
  id                  SERIAL PRIMARY KEY,
  contrato_id         INTEGER NOT NULL REFERENCES gepro.contrato(id),
  descricao           TEXT NOT NULL,
  valor_unitario      DECIMAL(15,2) NOT NULL CHECK (valor_unitario > 0),
  quantidade_estimada INTEGER NOT NULL CHECK (quantidade_estimada > 0),
  data_criacao        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. gepro.contrato_metrica — acompanhamento mensal de contratos
-- ============================================================
CREATE TABLE IF NOT EXISTS gepro.contrato_metrica (
  id                   SERIAL PRIMARY KEY,
  contrato_id          INTEGER NOT NULL REFERENCES gepro.contrato(id),
  mes                  INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano                  INTEGER NOT NULL,
  metrica_descricao    TEXT NOT NULL,
  meta_quantidade      DECIMAL(15,2) NOT NULL CHECK (meta_quantidade > 0),
  quantidade_realizada DECIMAL(15,2) NOT NULL DEFAULT 0,
  observacao           TEXT,
  registrado_por_id    INTEGER REFERENCES users(id),
  data_criacao         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (contrato_id, mes, ano)
);

-- ============================================================
-- 8. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_template_etp_ativo ON gepro.template_etp(ativo);
CREATE INDEX IF NOT EXISTS idx_template_tr_ativo  ON gepro.template_tr(ativo);
CREATE INDEX IF NOT EXISTS idx_agendamento_demanda ON gepro.agendamento_entrega(demanda_id);
CREATE INDEX IF NOT EXISTS idx_contrato_status     ON gepro.contrato(status);
CREATE INDEX IF NOT EXISTS idx_contrato_fornecedor ON gepro.contrato(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contrato_demanda    ON gepro.contrato(demanda_id);
CREATE INDEX IF NOT EXISTS idx_contrato_item_contrato   ON gepro.contrato_item(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_metrica_contrato ON gepro.contrato_metrica(contrato_id);
CREATE INDEX IF NOT EXISTS idx_demanda_nota_empenho ON gepro.demanda(nota_empenho_numero);

-- ============================================================
-- 9. Seed: template ETP v1.0 (publicado por PGM)
-- Campos nomeados conforme colunas de gepro.etp usadas em fase2Service.submeterETP
-- ============================================================
INSERT INTO gepro.template_etp (versao, data_publicacao, json_schema, ativo)
SELECT '1.0', '2025-01-01', '{
  "versao": "1.0",
  "campos": [
    { "nome": "justificativa_tecnica",  "tipo": "text",   "obrigatorio": true,  "min_length": 50 },
    { "nome": "categoria_equipamento",  "tipo": "text",   "obrigatorio": true                    },
    { "nome": "criterios_rejeicao",     "tipo": "text",   "obrigatorio": true,  "min_length": 20 },
    { "nome": "garantia_periodo",       "tipo": "text",   "obrigatorio": false                   },
    { "nome": "suporte_tecnico",        "tipo": "text",   "obrigatorio": false                   }
  ]
}'::JSONB, TRUE
WHERE NOT EXISTS (SELECT 1 FROM gepro.template_etp WHERE versao = '1.0');

-- Corrige seed já inserido com campo names errados
UPDATE gepro.template_etp
SET json_schema = '{
  "versao": "1.0",
  "campos": [
    { "nome": "justificativa_tecnica",  "tipo": "text",   "obrigatorio": true,  "min_length": 50 },
    { "nome": "categoria_equipamento",  "tipo": "text",   "obrigatorio": true                    },
    { "nome": "criterios_rejeicao",     "tipo": "text",   "obrigatorio": true,  "min_length": 20 },
    { "nome": "garantia_periodo",       "tipo": "text",   "obrigatorio": false                   },
    { "nome": "suporte_tecnico",        "tipo": "text",   "obrigatorio": false                   }
  ]
}'::JSONB
WHERE versao = '1.0'
  AND json_schema->'campos'->0->>'nome' = 'especificacao_tecnica';

-- ============================================================
-- 10. Seed: template TR v1.0 (publicado por PGM)
-- Campos nomeados conforme colunas de gepro.termo_referencia usadas em fase2Service.submeterTR
-- ============================================================
INSERT INTO gepro.template_tr (versao, data_publicacao, json_schema, ativo)
SELECT '1.0', '2025-01-01', '{
  "versao": "1.0",
  "campos": [
    { "nome": "objeto",                 "tipo": "text",   "obrigatorio": true, "min_length": 30 },
    { "nome": "justificativa",          "tipo": "text",   "obrigatorio": true, "min_length": 50 },
    { "nome": "prazo_entrega_dias_max", "tipo": "number", "obrigatorio": true                   },
    { "nome": "criterio_selecao",       "tipo": "text",   "obrigatorio": true                   },
    { "nome": "condicoes_pagamento",    "tipo": "text",   "obrigatorio": true                   }
  ]
}'::JSONB, TRUE
WHERE NOT EXISTS (SELECT 1 FROM gepro.template_tr WHERE versao = '1.0');

-- Corrige seed já inserido com prazo_entrega_dias (errado) → prazo_entrega_dias_max
UPDATE gepro.template_tr
SET json_schema = '{
  "versao": "1.0",
  "campos": [
    { "nome": "objeto",                 "tipo": "text",   "obrigatorio": true, "min_length": 30 },
    { "nome": "justificativa",          "tipo": "text",   "obrigatorio": true, "min_length": 50 },
    { "nome": "prazo_entrega_dias_max", "tipo": "number", "obrigatorio": true                   },
    { "nome": "criterio_selecao",       "tipo": "text",   "obrigatorio": true                   },
    { "nome": "condicoes_pagamento",    "tipo": "text",   "obrigatorio": true                   }
  ]
}'::JSONB
WHERE versao = '1.0'
  AND json_schema->'campos'->2->>'nome' = 'prazo_entrega_dias';
