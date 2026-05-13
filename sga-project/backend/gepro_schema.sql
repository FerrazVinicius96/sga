-- =============================================
-- GEPRO - Gestão de Aquisições (Lei 14.133/2021)
-- Schema: gepro.*
-- Execução: psql -U postgres -d sga_db -f gepro_schema.sql
-- =============================================

CREATE SCHEMA IF NOT EXISTS gepro;

-- ========================
-- 1. PCA (Plano de Contratações Anual)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.pca (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    ano         INTEGER NOT NULL,
    data_inicio DATE,
    data_fim    DATE,
    descricao   TEXT,
    ativo       BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 2. FORNECEDOR
-- ========================
CREATE TABLE IF NOT EXISTS gepro.fornecedor (
    id           SERIAL PRIMARY KEY,
    nome         VARCHAR(255) NOT NULL,
    cnpj         VARCHAR(20) UNIQUE NOT NULL,
    telefone     VARCHAR(50),
    email        VARCHAR(255),
    endereco     TEXT,
    cidade       VARCHAR(100),
    ativo        BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 3. DEMANDA (entidade central das 5 fases)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.demanda (
    id                              SERIAL PRIMARY KEY,
    numero_demanda                  VARCHAR(50) UNIQUE NOT NULL,
    usuario_criador_id              INTEGER NOT NULL REFERENCES users(id),
    gestor_id                       INTEGER REFERENCES users(id),
    titulo                          VARCHAR(500) NOT NULL,
    descricao                       TEXT NOT NULL,
    tipo_equipamento                VARCHAR(255),
    quantidade                      INTEGER NOT NULL CHECK (quantidade > 0),
    data_necessidade_prevista       DATE,
    setor_solicitante               VARCHAR(255),
    status                          VARCHAR(60) NOT NULL DEFAULT 'necessidade_rascunho'
        CHECK (status IN (
            'necessidade_rascunho',
            'necessidade_aprovada',
            'instrucao_rascunho',
            'instrucao_aprovada_gestor',
            'instrucao_rejeitada_gestor',
            'encaminhamento_aguardando_juridico',
            'encaminhamento_aprovado_juridico',
            'encaminhamento_rejeitado_juridico',
            'recebimento_provisorio',
            'recebimento_testado_conforme',
            'recebimento_rejeitado',
            'encerramento_pagamento_realizado',
            'encerramento_finalizado'
        )),
    pca_id                          INTEGER REFERENCES gepro.pca(id),
    aquisicao_emergencial           BOOLEAN DEFAULT FALSE,
    justificativa_emergencial       TEXT,
    valor_estimado                  DECIMAL(15,2),
    modalidade_licitatoria          VARCHAR(20)
        CHECK (modalidade_licitatoria IN ('pregao', 'concorrencia', 'srp', 'convite')),
    numero_processo_sei             VARCHAR(100),
    data_criacao                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_necessidade_aprovada       TIMESTAMP,
    data_instrucao_aprovada_gestor  TIMESTAMP,
    data_encaminhamento_juridico    TIMESTAMP,
    data_juridico_resposta          TIMESTAMP,
    data_recebimento_provisorio     TIMESTAMP,
    data_atestado_definitivo        TIMESTAMP,
    data_pagamento_confirmado       TIMESTAMP,
    data_encerramento               TIMESTAMP
);

-- ========================
-- 4. NECESSIDADE (Fase 1 — detalhes da demanda)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.necessidade (
    id                                        SERIAL PRIMARY KEY,
    demanda_id                                INTEGER NOT NULL REFERENCES gepro.demanda(id),
    descricao_necessidade                     TEXT,
    justificativa_tecnica                     TEXT,
    justificativa_negocio                     TEXT,
    duplicacao_verificada                     BOOLEAN DEFAULT FALSE,
    motivo_duplicacao                         TEXT,
    compatibilidade_infraestrutura_validada   BOOLEAN DEFAULT FALSE,
    data_validacao_interna                    TIMESTAMP,
    data_criacao                              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 5. INSTRUCAO_TECNICA (Fase 2 — container de ETP + TR)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.instrucao_tecnica (
    id                   SERIAL PRIMARY KEY,
    demanda_id           INTEGER NOT NULL REFERENCES gepro.demanda(id),
    versao               INTEGER NOT NULL DEFAULT 1,
    observacoes_gestor   TEXT,
    data_criacao         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 6. ETP (Estudo Técnico Preliminar)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.etp (
    id                           SERIAL PRIMARY KEY,
    instrucao_tecnica_id         INTEGER NOT NULL REFERENCES gepro.instrucao_tecnica(id),
    versao                       INTEGER NOT NULL DEFAULT 1,
    categoria_equipamento        VARCHAR(100),
    processador_tipo             VARCHAR(100),
    processador_velocidade       VARCHAR(50),
    processador_nucleos          INTEGER,
    memoria_ram_minima           VARCHAR(50),
    armazenamento_tipo           VARCHAR(10) CHECK (armazenamento_tipo IN ('SSD', 'HDD', 'eMMC', 'NVMe')),
    armazenamento_capacidade     VARCHAR(50),
    conectividade                TEXT,
    peso_dimensoes               TEXT,
    voltagem                     VARCHAR(50),
    sistema_operacional          VARCHAR(100),
    compatibilidade_sistemas     TEXT,
    software_incluidos           TEXT,
    garantia_periodo             VARCHAR(50),
    garantia_cobertura           TEXT,
    suporte_tecnico              TEXT,
    condicoes_entrega            TEXT,
    condicoes_instalacao         TEXT,
    certificacoes_obrigatorias   TEXT,
    acessibilidade_conformidade  TEXT,
    criterios_rejeicao           TEXT,
    justificativa_tecnica        TEXT,
    data_criacao                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 7. TERMO_REFERENCIA (TR)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.termo_referencia (
    id                               SERIAL PRIMARY KEY,
    instrucao_tecnica_id             INTEGER NOT NULL REFERENCES gepro.instrucao_tecnica(id),
    versao                           INTEGER NOT NULL DEFAULT 1,
    objeto                           TEXT,
    justificativa                    TEXT,
    descricao_detalhada              TEXT,
    valor_estimado_unitario          DECIMAL(15,2),
    valor_estimado_total             DECIMAL(15,2),
    projecao_preco_justo             TEXT,
    criterio_selecao                 VARCHAR(20)
        CHECK (criterio_selecao IN ('menor_preco', 'melhor_tecnica', 'tecnica_preco')),
    prazo_entrega_dias_max           INTEGER,
    validade_cotacao                 DATE,
    prazo_garantia_meses             INTEGER,
    condicoes_pagamento              TEXT,
    multa_atraso_percentual          DECIMAL(5,2),
    multa_nao_conformidade_percentual DECIMAL(5,2),
    clauses_rescisao                 TEXT,
    data_criacao                     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 8. COTACAO
-- ========================
CREATE TABLE IF NOT EXISTS gepro.cotacao (
    id                      SERIAL PRIMARY KEY,
    demanda_id              INTEGER NOT NULL REFERENCES gepro.demanda(id),
    numero_sequencial       INTEGER NOT NULL,
    fornecedor_id           INTEGER NOT NULL REFERENCES gepro.fornecedor(id),
    descricao_produto_cotado TEXT,
    valor_unitario          DECIMAL(15,2) NOT NULL CHECK (valor_unitario > 0),
    valor_total             DECIMAL(15,2),
    prazo_entrega_dias      INTEGER,
    validade_cotacao        DATE,
    arquivo_pdf_path        VARCHAR(500),
    observacoes             TEXT,
    data_criacao            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (demanda_id, numero_sequencial)
);

-- ========================
-- 9. ENCAMINHAMENTO (Fase 3 — análise jurídica + licitação)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.encaminhamento (
    id                          SERIAL PRIMARY KEY,
    demanda_id                  INTEGER NOT NULL REFERENCES gepro.demanda(id),
    data_envio_juridico         TIMESTAMP,
    data_juridico_resposta      TIMESTAMP,
    resultado_juridico          VARCHAR(15)
        CHECK (resultado_juridico IN ('aprovado', 'rejeitado', 'ressalvas')),
    motivo_rejeicao_juridico    TEXT,
    observacoes_juridico        TEXT,
    versoes_documentos_anexadas BOOLEAN DEFAULT FALSE,
    data_encaminhamento_compras TIMESTAMP,
    data_resultado_licitacao    TIMESTAMP,
    fornecedor_vencedor_id      INTEGER REFERENCES gepro.fornecedor(id),
    preco_final_contratado      DECIMAL(15,2),
    numero_edital               VARCHAR(100),
    data_criacao                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 10. RETORNO_JURIDICO
-- ========================
CREATE TABLE IF NOT EXISTS gepro.retorno_juridico (
    id               SERIAL PRIMARY KEY,
    encaminhamento_id INTEGER NOT NULL REFERENCES gepro.encaminhamento(id),
    status           VARCHAR(15) NOT NULL
        CHECK (status IN ('aprovado', 'rejeitado', 'ressalvas')),
    justificativa    TEXT,
    observacoes      TEXT,
    data_retorno     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 11. RECEBIMENTO (Fase 4 — entrada física)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.recebimento (
    id                         SERIAL PRIMARY KEY,
    demanda_id                 INTEGER NOT NULL REFERENCES gepro.demanda(id),
    data_recebimento_provisorio TIMESTAMP,
    responsavel_recebimento    VARCHAR(255),
    fornecedor_id              INTEGER REFERENCES gepro.fornecedor(id),
    numero_nf                  VARCHAR(100),
    quantidade_recebida        INTEGER,
    quantidade_solicitada      INTEGER,
    observacoes_embalagem      TEXT,
    numero_serie               VARCHAR(255),
    arquivo_fotos_path         VARCHAR(500),
    observacoes_gerais         TEXT,
    data_criacao               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 12. TESTE_TECNICO (7 grupos de testes)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.teste_tecnico (
    id                          SERIAL PRIMARY KEY,
    recebimento_id              INTEGER NOT NULL REFERENCES gepro.recebimento(id),
    data_teste                  TIMESTAMP,
    responsavel_teste           VARCHAR(255),
    teste_funcionamento_basico  BOOLEAN,
    processador_validado        BOOLEAN,
    processador_especificado    VARCHAR(100),
    processador_recebido        VARCHAR(100),
    memoria_ram_validada        BOOLEAN,
    memoria_ram_especificada    VARCHAR(50),
    memoria_ram_recebida        VARCHAR(50),
    armazenamento_validado      BOOLEAN,
    armazenamento_especificado  VARCHAR(50),
    armazenamento_recebido      VARCHAR(50),
    conectividade_validada      BOOLEAN,
    ethernet_teste              BOOLEAN,
    wifi_teste                  BOOLEAN,
    usb_teste                   BOOLEAN,
    acessorios_validados        BOOLEAN,
    acessorios_inclusos         TEXT,
    software_licencas_validados BOOLEAN,
    so_versao_recebida          VARCHAR(100),
    documentacao_validada       BOOLEAN,
    teste_estresse              BOOLEAN,
    compatibilidade_ambiente_ti BOOLEAN,
    resultado_geral             VARCHAR(15)
        CHECK (resultado_geral IN ('conforme', 'com_desvios', 'nao_conforme')),
    descricao_desvios           TEXT,
    acao_desvios                VARCHAR(20)
        CHECK (acao_desvios IN ('solicitar_ajuste', 'aceitar_desconto', 'rejeitar')),
    data_conclusao_testes       TIMESTAMP,
    data_criacao                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 13. ATESTADO
-- ========================
CREATE TABLE IF NOT EXISTS gepro.atestado (
    id                SERIAL PRIMARY KEY,
    recebimento_id    INTEGER NOT NULL REFERENCES gepro.recebimento(id),
    teste_tecnico_id  INTEGER REFERENCES gepro.teste_tecnico(id),
    responsavel_ateste VARCHAR(255),
    texto_atestado    TEXT,
    arquivo_pdf_path  VARCHAR(500),
    data_ateste       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assinado          BOOLEAN DEFAULT FALSE
);

-- ========================
-- 14. DOCUMENTO (gerado em cada fase)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.documento (
    id             SERIAL PRIMARY KEY,
    demanda_id     INTEGER NOT NULL REFERENCES gepro.demanda(id),
    tipo           VARCHAR(20) NOT NULL
        CHECK (tipo IN ('etp', 'tr', 'cotacao', 'atestado', 'relatorio', 'outro')),
    nome_documento VARCHAR(255) NOT NULL,
    arquivo_path   VARCHAR(500),
    formato        VARCHAR(5) CHECK (formato IN ('pdf', 'docx', 'xlsx')),
    data_criacao   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 15. ENCERRAMENTO (Fase 5)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.encerramento (
    id                         SERIAL PRIMARY KEY,
    demanda_id                 INTEGER NOT NULL REFERENCES gepro.demanda(id),
    data_confirmacao_pagamento TIMESTAMP,
    status_pagamento           VARCHAR(15) DEFAULT 'aguardando'
        CHECK (status_pagamento IN ('aguardando', 'realizado')),
    numero_patrimonio_sga      VARCHAR(50),
    observacoes_encerramento   TEXT,
    relatorio_conclusao        TEXT,
    licoes_aprendidas          TEXT,
    recomendacoes_futuras      TEXT,
    data_finalizacao           TIMESTAMP,
    data_criacao               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 16. ACOMPANHAMENTO (timeline de eventos)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.acompanhamento (
    id                  SERIAL PRIMARY KEY,
    demanda_id          INTEGER NOT NULL REFERENCES gepro.demanda(id),
    usuario_id          INTEGER NOT NULL REFERENCES users(id),
    fase_atual          VARCHAR(25)
        CHECK (fase_atual IN ('necessidade', 'instrucao_tecnica', 'encaminhamento', 'recebimento', 'encerramento')),
    observacao          TEXT,
    data_acompanhamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 17. OBSERVACAO (comentários livres por demanda)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.observacao (
    id           SERIAL PRIMARY KEY,
    demanda_id   INTEGER NOT NULL REFERENCES gepro.demanda(id),
    usuario_id   INTEGER NOT NULL REFERENCES users(id),
    conteudo     TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 18. APROVACAO (registro de cada decisão de aprovação/rejeição)
-- ========================
CREATE TABLE IF NOT EXISTS gepro.aprovacao (
    id              SERIAL PRIMARY KEY,
    demanda_id      INTEGER NOT NULL REFERENCES gepro.demanda(id),
    usuario_id      INTEGER NOT NULL REFERENCES users(id),
    tipo_aprovacao  VARCHAR(25) NOT NULL
        CHECK (tipo_aprovacao IN ('gestor_necessidade', 'gestor_instrucao', 'juridico')),
    resultado       VARCHAR(15) NOT NULL
        CHECK (resultado IN ('aprovado', 'rejeitado', 'ressalvas')),
    observacoes     TEXT,
    data_aprovacao  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- Sequence para número sequencial de demanda (global, reiniciado por ano via aplicação)
-- ========================
CREATE SEQUENCE IF NOT EXISTS gepro.seq_numero_demanda START WITH 1 INCREMENT BY 1;

-- ========================
-- Índices
-- ========================
CREATE INDEX IF NOT EXISTS idx_demanda_status       ON gepro.demanda(status);
CREATE INDEX IF NOT EXISTS idx_demanda_criador      ON gepro.demanda(usuario_criador_id);
CREATE INDEX IF NOT EXISTS idx_demanda_gestor       ON gepro.demanda(gestor_id);
CREATE INDEX IF NOT EXISTS idx_demanda_numero       ON gepro.demanda(numero_demanda);
CREATE INDEX IF NOT EXISTS idx_necessidade_demanda  ON gepro.necessidade(demanda_id);
CREATE INDEX IF NOT EXISTS idx_acompanhamento_demanda ON gepro.acompanhamento(demanda_id);
CREATE INDEX IF NOT EXISTS idx_aprovacao_demanda    ON gepro.aprovacao(demanda_id);
CREATE INDEX IF NOT EXISTS idx_cotacao_demanda      ON gepro.cotacao(demanda_id);
CREATE INDEX IF NOT EXISTS idx_instrucao_demanda    ON gepro.instrucao_tecnica(demanda_id);
