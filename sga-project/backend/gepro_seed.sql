-- ============================================================
-- GEPRO SEED — 50 demandas fictícias para apresentação
-- Executar: psql -U postgres -d sga_db -f gepro_seed.sql
-- Pré-requisito: gepro_schema.sql já executado; usuário id=1 (admin) existente
-- ============================================================

BEGIN;

-- ── Fornecedores ─────────────────────────────────────────────
INSERT INTO gepro.fornecedor (nome, cnpj, telefone, email, cidade, ativo) VALUES
  ('TechBrasil Soluções LTDA',        '12.345.678/0001-01', '(61) 3201-4400', 'comercial@techbrasil.com.br',    'Brasília',        true),
  ('InfoSystems Comércio SA',          '23.456.789/0001-02', '(61) 3202-5500', 'vendas@infosystems.com.br',      'Brasília',        true),
  ('Conecta Tecnologia EIRELI',        '34.567.890/0001-03', '(21) 2233-6600', 'contato@conectatech.com.br',     'Rio de Janeiro',  true),
  ('DataTech Brasil LTDA',             '45.678.901/0001-04', '(11) 3100-7700', 'licitacao@datatech.com.br',      'São Paulo',       true),
  ('Prime Computing Distribuidora',    '56.789.012/0001-05', '(61) 3203-8800', 'prime@primecomputing.com.br',    'Brasília',        true),
  ('Alfa Informática ME',              '67.890.123/0001-06', '(62) 3300-9900', 'alfa@alfainformatica.com.br',    'Goiânia',         true),
  ('MaxTI Equipamentos SA',            '78.901.234/0001-07', '(31) 3400-1100', 'maxti@maxti.com.br',             'Belo Horizonte',  true),
  ('Rede Suprimentos EIRELI',          '89.012.345/0001-08', '(41) 3500-2200', 'rede@redesuprimentos.com.br',   'Curitiba',        true),
  ('Global IT Solutions LTDA',         '90.123.456/0001-09', '(85) 3600-3300', 'global@globalitsolutions.com.br','Fortaleza',       true),
  ('NovaTec Distribuidora ME',         '01.234.567/0001-10', '(61) 3204-4400', 'novatec@novatec.com.br',         'Brasília',        true)
ON CONFLICT (cnpj) DO NOTHING;

-- ── Demandas + necessidade ────────────────────────────────────
-- Status: necessidade_rascunho (12), necessidade_aprovada (8),
--         instrucao_rascunho (8), encaminhamento_aguardando_juridico (6),
--         agendamento_pendente (5), agendamento_confirmado (4),
--         recebimento_provisorio (3), recebimento_testado_conforme (2),
--         encerramento_pagamento_realizado (1), encerramento_finalizado (1)

-- ── necessidade_rascunho (1–12) ──────────────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_criacao) VALUES
('GEPRO-2026-001', 1, 'Aquisição de Notebooks para SUTIC', 'Necessidade de substituição do parque de notebooks obsoletos da SUTIC com mais de 5 anos de uso, causando lentidão nas atividades administrativas e técnicas.', 'Notebook', 30, 126000.00, 'pregao', 'SUTIC', 'necessidade_rascunho', '2026-01-08 09:00:00'),
('GEPRO-2026-002', 1, 'Fornecimento de Monitores — Secretaria Geral', 'Reposição de monitores danificados e aquisição de novos para ampliar capacidade operacional da Secretaria Geral, atendendo novas contratações.', 'Monitor', 20, 22000.00, 'pregao', 'Secretaria Geral', 'necessidade_rascunho', '2026-01-15 10:30:00'),
('GEPRO-2026-003', 1, 'Tablets para Fiscalização de Campo', 'Dotação de tablets robustos para equipes de fiscalização que atuam em campo, necessitando de equipamentos portáteis e com boa duração de bateria.', 'Tablet', 15, 45000.00, 'ata_registro_precos', 'Fiscalização', 'necessidade_rascunho', '2026-01-22 14:00:00'),
('GEPRO-2026-004', 1, 'Impressoras Multifuncionais — Almoxarifado', 'Substituição das impressoras do almoxarifado central, atualmente sem manutenção viável dado o custo elevado de peças para modelos antigos.', 'Impressora', 5, 18500.00, 'convite', 'Almoxarifado', 'necessidade_rascunho', '2026-02-03 08:30:00'),
('GEPRO-2026-005', 1, 'Desktop para Setor Financeiro', 'Aquisição de computadores desktop de alto desempenho para o setor financeiro, necessários para execução de sistemas de gestão fiscal e contábil.', 'Desktop', 12, 66000.00, 'pregao', 'Financeiro', 'necessidade_rascunho', '2026-02-10 09:45:00'),
('GEPRO-2026-006', 1, 'Câmeras IP para Monitoramento', 'Implantação de sistema de monitoramento visual nas dependências do órgão para aumentar a segurança patrimonial e o controle de acesso.', 'Câmera IP', 24, 36000.00, 'pregao', 'Segurança Patrimonial', 'necessidade_rascunho', '2026-02-17 11:00:00'),
('GEPRO-2026-007', 1, 'Nobreaks para Sala de Servidores', 'Equipamentos de proteção elétrica indispensáveis para continuidade dos serviços em caso de interrupção do fornecimento de energia elétrica.', 'Nobreak', 8, 32000.00, 'pregao', 'Infraestrutura TI', 'necessidade_rascunho', '2026-02-24 13:30:00'),
('GEPRO-2026-008', 1, 'Scanners de Alta Velocidade — Protocolo', 'Digitalização de documentos físicos do protocolo geral exige scanners de alta velocidade e resolução, substituindo equipamentos com falhas recorrentes.', 'Scanner', 4, 28000.00, 'convite', 'Protocolo Geral', 'necessidade_rascunho', '2026-03-03 08:00:00'),
('GEPRO-2026-009', 1, 'Notebooks para Novos Servidores — RH', 'Dotação inicial de equipamentos para servidores empossados no último concurso público, conforme dotação orçamentária aprovada.', 'Notebook', 18, 75600.00, 'pregao', 'Recursos Humanos', 'necessidade_rascunho', '2026-03-10 10:00:00'),
('GEPRO-2026-010', 1, 'Projetor para Auditório Principal', 'Substituição do projetor do auditório principal, inoperante desde março/2025, impactando realizações de eventos, treinamentos e reuniões oficiais.', 'Projetor', 2, 14000.00, 'convite', 'Comunicação', 'necessidade_rascunho', '2026-03-17 14:30:00'),
('GEPRO-2026-011', 1, 'Switches de Rede — Expansão CETEC', 'Expansão da infraestrutura de rede do CETEC para suportar aumento de 40% no número de estações de trabalho previsto para o segundo semestre.', 'Switch', 6, 54000.00, 'pregao', 'CETEC', 'necessidade_rascunho', '2026-04-07 09:00:00'),
('GEPRO-2026-012', 1, 'Tablets para Educação — Programa Digital', 'Aquisição de tablets educacionais para o programa de inclusão digital, destinados a alunos de escolas públicas municipais conforme convênio estadual.', 'Tablet', 100, 280000.00, 'ata_registro_precos', 'Educação Digital', 'necessidade_rascunho', '2026-04-14 11:00:00');

-- ── necessidade_aprovada (13–20) ──────────────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_criacao) VALUES
('GEPRO-2026-013', 1, 1, 'Notebooks para CETEC — Laboratório 3', 'Modernização do laboratório 3 do CETEC com equipamentos de maior desempenho, habilitando o uso de ferramentas de análise de dados e GIS.', 'Notebook', 25, 105000.00, 'pregao', 'CETEC', 'necessidade_aprovada', '2026-02-05 10:00:00', '2026-01-28 08:00:00'),
('GEPRO-2026-014', 1, 1, 'Monitores Duplos — Setor Jurídico', 'Configuração de estações com monitor duplo para o setor jurídico, aumentando produtividade na análise simultânea de documentos e processos.', 'Monitor', 16, 24000.00, 'ata_registro_precos', 'Jurídico', 'necessidade_aprovada', '2026-02-12 14:00:00', '2026-02-05 09:00:00'),
('GEPRO-2026-015', 1, 1, 'Desktop para Suporte Técnico', 'Equipamentos para a equipe de suporte técnico itinerante, necessitando configuração específica para diagnóstico e manutenção de outros sistemas.', 'Desktop', 8, 44000.00, 'pregao', 'Suporte TI', 'necessidade_aprovada', '2026-02-19 11:00:00', '2026-02-12 10:00:00'),
('GEPRO-2026-016', 1, 1, 'Servidor de Backup — Datacenter', 'Implantação de solução de backup dedicada no datacenter para garantir a política de retenção de dados e conformidade com a LGPD.', 'Servidor', 1, 185000.00, 'concorrencia', 'Infraestrutura TI', 'necessidade_aprovada', '2026-02-26 09:00:00', '2026-02-19 08:00:00'),
('GEPRO-2026-017', 1, 1, 'Impressoras — Postos Regionais', 'Dotação de impressoras para os 5 postos regionais que atualmente compartilham equipamentos de outros setores, gerando filas e atrasos no atendimento.', 'Impressora', 10, 37000.00, 'ata_registro_precos', 'Postos Regionais', 'necessidade_aprovada', '2026-03-05 14:00:00', '2026-02-26 09:30:00'),
('GEPRO-2026-018', 1, 1, 'Notebooks — Coordenação de Projetos', 'Equipamentos para coordenadores de projetos que trabalham em regime híbrido, exigindo portabilidade e boa autonomia de bateria.', 'Notebook', 10, 42000.00, 'ata_registro_precos', 'Projetos', 'necessidade_aprovada', '2026-03-12 11:00:00', '2026-03-05 10:00:00'),
('GEPRO-2026-019', 1, 1, 'Câmeras IP — Expansão Monitoramento', 'Segunda fase do projeto de monitoramento: expansão para corredores externos e estacionamento, cobrindo pontos cegos identificados na auditoria de segurança.', 'Câmera IP', 18, 27000.00, 'srp', 'Segurança Patrimonial', 'necessidade_aprovada', '2026-03-19 10:00:00', '2026-03-12 09:00:00'),
('GEPRO-2026-020', 1, 1, 'Scanner para Digitalização de Acervo', 'Projeto de digitalização do acervo histórico do órgão, estimado em 80.000 documentos físicos. Exige scanner de alta resolução com alimentador automático.', 'Scanner', 2, 45000.00, 'pregao', 'Arquivo Histórico', 'necessidade_aprovada', '2026-04-02 14:00:00', '2026-03-26 09:00:00');

-- ── instrucao_rascunho (21–28) ────────────────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_criacao) VALUES
('GEPRO-2026-021', 1, 1, 'Notebooks — Secretaria de Saúde', 'Equipamentos para agentes de saúde que realizam visitas domiciliares e precisam registrar dados em campo com acesso ao sistema integrado de saúde.', 'Notebook', 40, 168000.00, 'pregao', 'Saúde', 'instrucao_rascunho', '2026-01-20 09:00:00', '2026-01-13 08:00:00'),
('GEPRO-2026-022', 1, 1, 'Switches Core — Rede Principal', 'Substituição dos switches de núcleo da rede principal com mais de 7 anos de uso, sem suporte do fabricante, representando risco crítico à continuidade dos serviços.', 'Switch', 4, 120000.00, 'concorrencia', 'Infraestrutura TI', 'instrucao_rascunho', '2026-01-27 10:00:00', '2026-01-20 09:30:00'),
('GEPRO-2026-023', 1, 1, 'Desktop — Setor de Engenharia', 'Workstations de alto desempenho para a equipe de engenharia, com requisitos de GPU dedicada para software de CAD e BIM utilizado nos projetos de infraestrutura.', 'Desktop', 6, 84000.00, 'pregao', 'Engenharia', 'instrucao_rascunho', '2026-02-03 14:00:00', '2026-01-27 10:00:00'),
('GEPRO-2026-024', 1, 1, 'Tablets — Controle de Estoque', 'Automação do controle de estoque do almoxarifado com tablets e leitores de código de barras, eliminando registros em papel e reduzindo erros de inventário.', 'Tablet', 8, 24000.00, 'ata_registro_precos', 'Almoxarifado', 'instrucao_rascunho', '2026-02-10 11:00:00', '2026-02-03 09:00:00'),
('GEPRO-2026-025', 1, 1, 'Servidor de Aplicação — Sistema Integrado', 'Servidor para hospedar o novo sistema integrado de gestão em fase de implantação, com requisitos de alta disponibilidade e redundância.', 'Servidor', 2, 320000.00, 'concorrencia', 'Infraestrutura TI', 'instrucao_rascunho', '2026-02-17 09:00:00', '2026-02-10 08:00:00'),
('GEPRO-2026-026', 1, 1, 'Monitors — Sala de Situação', 'Painéis de monitoramento para a sala de situação do órgão: monitores de 55" para visualização de dashboards em tempo real.', 'Monitor', 6, 42000.00, 'pregao', 'Gestão Estratégica', 'instrucao_rascunho', '2026-02-24 13:00:00', '2026-02-17 09:30:00'),
('GEPRO-2026-027', 1, 1, 'Impressoras Térmicas — Emissão de Documentos', 'Impressoras térmicas de alta velocidade para os guichês de atendimento ao público, agilizando a emissão de protocolos e comprovantes.', 'Impressora', 12, 21600.00, 'ata_registro_precos', 'Atendimento ao Público', 'instrucao_rascunho', '2026-03-03 10:00:00', '2026-02-24 09:00:00'),
('GEPRO-2026-028', 1, 1, 'Notebooks — Auditoria Interna', 'Renovação do parque tecnológico da auditoria interna para garantir a segurança das informações e compatibilidade com ferramentas de auditoria digital.', 'Notebook', 8, 33600.00, 'srp', 'Auditoria', 'instrucao_rascunho', '2026-03-10 14:00:00', '2026-03-03 10:00:00');

-- ── encaminhamento_aguardando_juridico (29–34) ────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_instrucao_aprovada_gestor, data_encaminhamento_juridico, data_criacao) VALUES
('GEPRO-2026-029', 1, 1, 'Notebooks — Programa Escola Digital', 'Fornecimento de notebooks para docentes da rede pública conforme programa estadual de modernização das escolas e capacitação dos professores.', 'Notebook', 200, 840000.00, 'pregao', 'Educação', 'encaminhamento_aguardando_juridico', '2025-12-20 10:00:00', '2026-01-10 14:00:00', '2026-01-20 09:00:00', '2025-12-13 08:00:00'),
('GEPRO-2026-030', 1, 1, 'Servidor Hiperconvergente — Datacenter', 'Modernização do datacenter com solução hiperconvergente para consolidação de servidores físicos, redução de custos operacionais e aumento da resiliência.', 'Servidor', 3, 750000.00, 'concorrencia', 'Infraestrutura TI', 'encaminhamento_aguardando_juridico', '2025-12-27 09:00:00', '2026-01-17 11:00:00', '2026-01-27 10:00:00', '2025-12-20 09:00:00'),
('GEPRO-2026-031', 1, 1, 'Tablets — Agentes de Trânsito', 'Equipamentos para os agentes de trânsito registrarem autuações em campo com conectividade 4G, integrando com o sistema de multas em tempo real.', 'Tablet', 35, 105000.00, 'ata_registro_precos', 'Trânsito', 'encaminhamento_aguardando_juridico', '2026-01-10 10:00:00', '2026-02-01 14:00:00', '2026-02-10 09:00:00', '2026-01-03 08:00:00'),
('GEPRO-2026-032', 1, 1, 'Desktops — Postos de Identificação', 'Modernização dos postos de emissão de documentos de identidade com desktops específicos para integração com o sistema nacional de identificação biométrica.', 'Desktop', 15, 82500.00, 'pregao', 'Identificação Civil', 'encaminhamento_aguardando_juridico', '2026-01-17 11:00:00', '2026-02-08 10:00:00', '2026-02-17 09:00:00', '2026-01-10 09:30:00'),
('GEPRO-2026-033', 1, 1, 'Câmeras IP — Sistema Integrado de Vigilância', 'Expansão do sistema de vigilância para cobertura total do perímetro externo da sede, integrando com central de monitoramento 24 horas.', 'Câmera IP', 42, 63000.00, 'srp', 'Segurança', 'encaminhamento_aguardando_juridico', '2026-01-24 10:00:00', '2026-02-14 11:00:00', '2026-02-24 09:00:00', '2026-01-17 10:00:00'),
('GEPRO-2026-034', 1, 1, 'Impressoras — Rede de Atendimento Regionalizado', 'Padronização e renovação do parque de impressoras dos 12 núcleos regionais de atendimento, garantindo suprimentos unificados e manutenção simplificada.', 'Impressora', 24, 88800.00, 'ata_registro_precos', 'Atendimento Regional', 'encaminhamento_aguardando_juridico', '2026-01-31 14:00:00', '2026-02-21 10:00:00', '2026-03-03 09:00:00', '2026-01-24 09:00:00');

-- ── agendamento_pendente (35–39) ──────────────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_instrucao_aprovada_gestor, data_encaminhamento_juridico, data_criacao) VALUES
('GEPRO-2026-035', 1, 1, 'Notebooks — Modernização GPOT', 'Renovação dos notebooks da equipe GPOT para suportar as novas ferramentas de gestão de contratos e análise de editais licitatórios.', 'Notebook', 12, 50400.00, 'pregao', 'GPOT', 'agendamento_pendente', '2025-12-06 10:00:00', '2025-12-27 14:00:00', '2026-01-06 09:00:00', '2025-11-29 08:00:00'),
('GEPRO-2026-036', 1, 1, 'Desktops — Sala de Treinamento', 'Equipamentos para a sala de treinamento corporativo, substituindo máquinas com mais de 6 anos e sem capacidade para os sistemas de e-learning adotados.', 'Desktop', 20, 110000.00, 'pregao', 'Treinamento', 'agendamento_pendente', '2025-12-13 11:00:00', '2026-01-03 10:00:00', '2026-01-13 09:00:00', '2025-12-06 09:30:00'),
('GEPRO-2026-037', 1, 1, 'Servidor NAS — Compartilhamento de Arquivos', 'Storage em rede para centralizar o compartilhamento de arquivos, eliminando o uso de pendrives e e-mails para troca de documentos de grande volume.', 'Servidor', 1, 85000.00, 'pregao', 'Infraestrutura TI', 'agendamento_pendente', '2025-12-20 10:00:00', '2026-01-10 14:00:00', '2026-01-20 09:00:00', '2025-12-13 10:00:00'),
('GEPRO-2026-038', 1, 1, 'Scanners Portáteis — Vistoria Técnica', 'Scanners portáteis sem fio para equipes de vistoria técnica que necessitam digitalizar documentos durante as inspeções em campo.', 'Scanner', 10, 35000.00, 'ata_registro_precos', 'Fiscalização', 'agendamento_pendente', '2025-12-27 09:00:00', '2026-01-17 11:00:00', '2026-01-27 10:00:00', '2025-12-20 09:00:00'),
('GEPRO-2026-039', 1, 1, 'Monitores Ergonômicos — Teletrabalho', 'Dotação de monitores de 27" ergonômicos para servidores em regime de teletrabalho permanente, conforme política de saúde ocupacional aprovada.', 'Monitor', 30, 45000.00, 'ata_registro_precos', 'Gestão de Pessoas', 'agendamento_pendente', '2026-01-03 10:00:00', '2026-01-24 14:00:00', '2026-02-03 09:00:00', '2025-12-27 09:30:00');

-- ── agendamento_confirmado (40–43) ────────────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_instrucao_aprovada_gestor, data_encaminhamento_juridico, data_criacao) VALUES
('GEPRO-2026-040', 1, 1, 'Tablets — Cadastro Rural', 'Tablets para os técnicos agrícolas realizarem cadastro rural e georreferenciamento in loco, com GPS de alta precisão integrado.', 'Tablet', 20, 60000.00, 'pregao', 'Agricultura', 'agendamento_confirmado', '2025-11-20 10:00:00', '2025-12-11 14:00:00', '2025-12-21 09:00:00', '2025-11-13 08:00:00'),
('GEPRO-2026-041', 1, 1, 'Notebooks Blindados — Uso Externo', 'Notebooks com estrutura reforçada (military grade) para uso em campo por equipes de inspeção que trabalham em condições adversas de temperatura e umidade.', 'Notebook', 15, 112500.00, 'concorrencia', 'Fiscalização Ambiental', 'agendamento_confirmado', '2025-11-27 11:00:00', '2025-12-18 10:00:00', '2025-12-28 09:00:00', '2025-11-20 09:30:00'),
('GEPRO-2026-042', 1, 1, 'Câmeras para Telepresença — Salas de Reunião', 'Câmeras de videoconferência de alta resolução para as 4 salas de reunião principais, habilitando participação remota de qualidade em comitês e reuniões institucionais.', 'Câmera IP', 8, 32000.00, 'srp', 'Comunicação Institucional', 'agendamento_confirmado', '2025-12-04 10:00:00', '2025-12-25 14:00:00', '2026-01-04 09:00:00', '2025-11-27 09:00:00'),
('GEPRO-2026-043', 1, 1, 'Desktop — Central de Atendimento 156', 'Renovação dos computadores da central de atendimento telefônico 156, necessários para suportar o novo software de CRM adotado para gestão do atendimento ao cidadão.', 'Desktop', 18, 99000.00, 'pregao', 'Atendimento 156', 'agendamento_confirmado', '2025-12-11 11:00:00', '2026-01-01 10:00:00', '2026-01-11 09:00:00', '2025-12-04 09:30:00');

-- ── recebimento_provisorio (44–46) ────────────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_instrucao_aprovada_gestor, data_encaminhamento_juridico, data_recebimento_provisorio, data_criacao) VALUES
('GEPRO-2026-044', 1, 1, 'Impressoras Laser — Contabilidade', 'Impressoras laser monocromáticas de alto volume para o setor de contabilidade, responsável pela emissão de centenas de relatórios fiscais mensalmente.', 'Impressora', 6, 22200.00, 'ata_registro_precos', 'Contabilidade', 'recebimento_provisorio', '2025-11-01 10:00:00', '2025-11-22 14:00:00', '2025-12-02 09:00:00', '2026-02-15 10:00:00', '2025-10-25 08:00:00'),
('GEPRO-2026-045', 1, 1, 'Notebooks — Expansão TRE Regional', 'Equipamentos para servidores cedidos ao TRE durante o período eleitoral, conforme termo de cooperação técnica firmado entre os órgãos.', 'Notebook', 22, 92400.00, 'pregao', 'Cooperação TRE', 'recebimento_provisorio', '2025-11-08 11:00:00', '2025-11-29 10:00:00', '2025-12-09 09:00:00', '2026-02-22 14:00:00', '2025-11-01 09:30:00'),
('GEPRO-2026-046', 1, 1, 'Servidor de Virtualização', 'Servidor para virtualização de estações de trabalho (VDI), reduzindo custo de manutenção de hardware e centralizando a gestão do parque tecnológico.', 'Servidor', 2, 420000.00, 'concorrencia', 'Infraestrutura TI', 'recebimento_provisorio', '2025-11-15 10:00:00', '2025-12-06 14:00:00', '2025-12-16 09:00:00', '2026-03-01 10:00:00', '2025-11-08 09:00:00');

-- ── recebimento_testado_conforme (47–48) ──────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_instrucao_aprovada_gestor, data_encaminhamento_juridico, data_recebimento_provisorio, data_atestado_definitivo, data_criacao) VALUES
('GEPRO-2026-047', 1, 1, 'Tablets para Assistência Social', 'Tablets para os assistentes sociais realizarem visitas domiciliares com registro digital imediato, agilizando o acompanhamento de beneficiários de programas sociais.', 'Tablet', 30, 90000.00, 'pregao', 'Assistência Social', 'recebimento_testado_conforme', '2025-10-10 10:00:00', '2025-10-31 14:00:00', '2025-11-10 09:00:00', '2026-01-20 14:00:00', '2026-02-10 10:00:00', '2025-10-03 08:00:00'),
('GEPRO-2026-048', 1, 1, 'Monitors — Renovação Secretaria de Obras', 'Substituição de monitores CRT e LCD antigos da Secretaria de Obras por monitores LED de baixo consumo energético, contribuindo para a meta de sustentabilidade.', 'Monitor', 25, 30000.00, 'ata_registro_precos', 'Obras', 'recebimento_testado_conforme', '2025-10-17 11:00:00', '2025-11-07 10:00:00', '2025-11-17 09:00:00', '2026-01-27 10:00:00', '2026-02-17 14:00:00', '2025-10-10 09:30:00');

-- ── encerramento_pagamento_realizado (49) ────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_instrucao_aprovada_gestor, data_encaminhamento_juridico, data_recebimento_provisorio, data_atestado_definitivo, data_pagamento_confirmado, data_criacao) VALUES
('GEPRO-2026-049', 1, 1, 'Desktops — Reforma da Sala de Controle', 'Modernização da sala de controle operacional com desktops de última geração, displays de alta resolução e periféricos para monitoramento 24/7 dos sistemas críticos.', 'Desktop', 10, 55000.00, 'pregao', 'Controle Operacional', 'encerramento_pagamento_realizado', '2025-09-05 10:00:00', '2025-09-26 14:00:00', '2025-10-06 09:00:00', '2025-12-15 14:00:00', '2026-01-05 10:00:00', '2026-02-05 10:00:00', '2025-08-29 08:00:00');

-- ── encerramento_finalizado (50) ──────────────────────────────
INSERT INTO gepro.demanda (numero_demanda, usuario_criador_id, gestor_id, titulo, descricao, tipo_equipamento, quantidade, valor_estimado, modalidade_licitatoria, setor_solicitante, status, data_necessidade_aprovada, data_instrucao_aprovada_gestor, data_encaminhamento_juridico, data_recebimento_provisorio, data_atestado_definitivo, data_pagamento_confirmado, data_encerramento, data_criacao) VALUES
('GEPRO-2026-050', 1, 1, 'Notebooks — Primeira Aquisição GEPRO 2026', 'Aquisição pioneira do sistema GEPRO: notebooks para modernização do gabinete, validando o fluxo completo de gestão de aquisições na nova plataforma digital.', 'Notebook', 5, 21000.00, 'srp', 'Gabinete', 'encerramento_finalizado', '2025-08-15 10:00:00', '2025-09-05 14:00:00', '2025-09-15 09:00:00', '2025-11-20 14:00:00', '2025-12-10 10:00:00', '2026-01-10 10:00:00', '2026-02-10 14:00:00', '2025-08-08 08:00:00');

-- ── Necessidade (uma por demanda) ─────────────────────────────
INSERT INTO gepro.necessidade (demanda_id, descricao_necessidade, justificativa_tecnica, duplicacao_verificada, compatibilidade_infraestrutura_validada)
SELECT
  d.id,
  'Necessidade identificada pelo setor ' || d.setor_solicitante || ' para atender às demandas operacionais relacionadas a ' || lower(d.tipo_equipamento) || '.',
  'Equipamento selecionado conforme especificações técnicas mínimas definidas pela equipe de TI, compatíveis com a infraestrutura existente e os sistemas institucionais em uso.',
  true,
  true
FROM gepro.demanda d
WHERE d.numero_demanda LIKE 'GEPRO-2026-%'
ON CONFLICT DO NOTHING;

-- ── Acompanhamento (timeline) ─────────────────────────────────
-- Para demandas que avançaram além de necessidade_rascunho
INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'necessidade', 'Demanda criada e submetida para avaliação do gestor.', d.data_criacao + interval '1 hour'
FROM gepro.demanda d WHERE d.status != 'necessidade_rascunho' AND d.numero_demanda LIKE 'GEPRO-2026-%';

INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'necessidade', 'Necessidade aprovada pelo gestor. Processo encaminhado para instrução técnica.', d.data_necessidade_aprovada
FROM gepro.demanda d WHERE d.data_necessidade_aprovada IS NOT NULL AND d.numero_demanda LIKE 'GEPRO-2026-%';

INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'instrucao_tecnica', 'ETP e Termo de Referência concluídos. Demanda encaminhada para análise e emissão de nota de empenho.', d.data_instrucao_aprovada_gestor
FROM gepro.demanda d WHERE d.data_instrucao_aprovada_gestor IS NOT NULL AND d.numero_demanda LIKE 'GEPRO-2026-%';

INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'encaminhamento', 'Nota de Empenho emitida. Processo liberado para agendamento de entrega com o fornecedor vencedor.', d.data_encaminhamento_juridico + interval '15 days'
FROM gepro.demanda d WHERE d.data_encaminhamento_juridico IS NOT NULL AND d.status NOT IN ('encaminhamento_aguardando_juridico') AND d.numero_demanda LIKE 'GEPRO-2026-%';

INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'recebimento', 'Equipamentos recebidos provisoriamente. Iniciados testes técnicos de conformidade.', d.data_recebimento_provisorio
FROM gepro.demanda d WHERE d.data_recebimento_provisorio IS NOT NULL AND d.numero_demanda LIKE 'GEPRO-2026-%';

INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'recebimento', 'Testes técnicos concluídos com resultado CONFORME. Atestado de recebimento definitivo emitido.', d.data_atestado_definitivo
FROM gepro.demanda d WHERE d.data_atestado_definitivo IS NOT NULL AND d.numero_demanda LIKE 'GEPRO-2026-%';

INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'encerramento', 'Pagamento ao fornecedor confirmado. Processo em fase de encerramento formal.', d.data_pagamento_confirmado
FROM gepro.demanda d WHERE d.data_pagamento_confirmado IS NOT NULL AND d.numero_demanda LIKE 'GEPRO-2026-%';

INSERT INTO gepro.acompanhamento (demanda_id, usuario_id, fase_atual, observacao, data_acompanhamento)
SELECT d.id, 1, 'encerramento', 'Processo encerrado definitivamente. Todos os documentos arquivados e lições aprendidas registradas.', d.data_encerramento
FROM gepro.demanda d WHERE d.data_encerramento IS NOT NULL AND d.numero_demanda LIKE 'GEPRO-2026-%';

-- ── Cotações (3 por demanda a partir de instrucao_rascunho) ───
-- Usa subquery para gerar 3 cotações por demanda elegível
WITH demandas_elegiveis AS (
  SELECT d.id AS demanda_id,
         ROW_NUMBER() OVER (ORDER BY d.id) AS rn
  FROM gepro.demanda d
  WHERE d.status NOT IN ('necessidade_rascunho','necessidade_aprovada','instrucao_rascunho')
    AND d.numero_demanda LIKE 'GEPRO-2026-%'
),
fornecedores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM gepro.fornecedor LIMIT 10
)
INSERT INTO gepro.cotacao (demanda_id, numero_sequencial, fornecedor_id, descricao_produto_cotado, valor_unitario, valor_total, prazo_entrega_dias, validade_cotacao)
SELECT
  de.demanda_id,
  seq.n,
  f.id,
  'Proposta comercial conforme edital — fornecedor ' || f.rn,
  -- valor unitário variando por cotação (1ª: referência, 2ª: +8%, 3ª: +15%)
  ROUND((dem.valor_estimado / dem.quantidade) * (1 + (seq.n - 1) * 0.08), 2),
  ROUND((dem.valor_estimado / dem.quantidade) * (1 + (seq.n - 1) * 0.08) * dem.quantidade, 2),
  30 + (seq.n - 1) * 5,
  CURRENT_DATE + interval '90 days'
FROM demandas_elegiveis de
JOIN gepro.demanda dem ON dem.id = de.demanda_id
CROSS JOIN (VALUES (1),(2),(3)) AS seq(n)
JOIN fornecedores f ON f.rn = ((de.rn + seq.n - 2) % 10) + 1
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificação rápida
SELECT status, COUNT(*) FROM gepro.demanda WHERE numero_demanda LIKE 'GEPRO-2026-%' GROUP BY status ORDER BY status;
