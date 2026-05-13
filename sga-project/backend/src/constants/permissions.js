/**
 * Definições de ROLES e PERMISSIONS
 *
 * Este arquivo centraliza todas as definições de papéis (roles) e permissões do sistema.
 * Extraído de src/server.js para evitar repetição e facilitar manutenção.
 *
 * Uso:
 *   const { ROLES, PERMISSIONS } = require('./constants/permissions');
 */

// Definindo os nomes dos perfis para evitar erros de digitação
const ROLES = {
	ADMIN: 'admin', // Você (Full)
	MANAGER: 'manager', // Coordenação
	ADVISOR: 'advisor', // Assessoria (Novo)
	BASIC: 'basic', // Técnicos
	OPERATOR: 'operator', // Técnico de Campo (Logística + Escolar) - NOVO
};

// Mapeamento de cada ação para os perfis que podem executá-la
const PERMISSIONS = {
	MENU_DASHBOARD: [
		ROLES.ADMIN,
		ROLES.MANAGER,
		ROLES.ADVISOR,
		ROLES.BASIC,
		ROLES.OPERATOR,
	],
	MENU_CADASTROS: [ROLES.ADMIN, ROLES.MANAGER],

	// Logística Geral: Basic e Operator acessam
	MENU_LOGISTICA: [
		ROLES.ADMIN,
		ROLES.MANAGER,
		ROLES.ADVISOR,
		ROLES.BASIC,
		ROLES.OPERATOR,
	],

	// Patrimônio: Gestão apenas
	MENU_PATRIMONIO: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR],

	// Menu Escolar: REMOVEMOS O BASIC e adicionamos o OPERATOR
	MENU_ESCOLAR: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.OPERATOR],

	MENU_RELATORIOS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR],
	MENU_CONSULTAS: [
		ROLES.ADMIN,
		ROLES.MANAGER,
		ROLES.ADVISOR,
		ROLES.BASIC,
		ROLES.OPERATOR,
	],

	MENU_AUDITORIA: [ROLES.ADMIN],
	MENU_CONFIGURACOES: [ROLES.ADMIN, ROLES.MANAGER],

	// Ações
	// Ambos (Basic e Operator) podem registrar movimentações gerais
	ACTION_REGISTER_MOVEMENT: [
		ROLES.ADMIN,
		ROLES.MANAGER,
		ROLES.BASIC,
		ROLES.OPERATOR,
	],

	ACTION_CREATE_EDIT: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR],
	ACTION_REQUEST_RETIREMENT: [ROLES.ADMIN, ROLES.MANAGER],
	ACTION_FINAL_APPROVAL: [ROLES.ADMIN],
	ACTION_APPROVE_REJECT: [ROLES.ADMIN],
	ACTION_DELETE: [ROLES.ADMIN],

	// Compatibilidade
	SUBMENU_TIPOS_ITENS: [ROLES.ADMIN, ROLES.MANAGER],
	SUBMENU_UNIDADES: [ROLES.ADMIN, ROLES.MANAGER],
	SUBMENU_PESSOAS: [ROLES.ADMIN, ROLES.MANAGER],
	SUBMENU_ATIVOS: [ROLES.ADMIN, ROLES.MANAGER],

	// ──────────────────────────────────────────────────────────────────────────
	// Bifurcação de sistemas
	// ──────────────────────────────────────────────────────────────────────────
	// Mapeamento de papéis do sistema existente para os módulos:
	//   admin    → gepro_admin  (acesso total)
	//   manager  → gepro_gestor (aprovador de fases)
	//   advisor  → gepro_ti     (instrução técnica — ETP/TR, Fase 2)
	//   basic    → gepro_solicitante (cria demandas, Fase 1)
	//   operator → gepro_recebimento (recebe equipamentos, Fase 4)
	SISTEMA_SGA: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],
	SISTEMA_GEPRO: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],

	// ──────────────────────────────────────────────────────────────────────────
	// GEPRO — permissões por ação
	// ──────────────────────────────────────────────────────────────────────────

	// Fase 1: qualquer usuário com acesso ao GEPRO pode criar demanda
	GEPRO_CRIAR_DEMANDA: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],

	// Fase 1: apenas gestor e admin aprovam/rejeitam
	GEPRO_APROVAR_DEMANDA: [ROLES.ADMIN, ROLES.MANAGER],

	// Fase 2: analista técnico (advisor) e admin preenchem ETP/TR
	GEPRO_INSTRUCAO_TECNICA: [ROLES.ADMIN, ROLES.ADVISOR],

	// Fase 2: gestor de compras (manager) e admin registram cotações
	GEPRO_COTACOES: [ROLES.ADMIN, ROLES.MANAGER],

	// Fase 3: jurídico (advisor) e admin emitem parecer
	GEPRO_JURIDICO: [ROLES.ADMIN, ROLES.ADVISOR],

	// Fase 4: recebimento (operator) e admin registram testes/atestado
	GEPRO_RECEBIMENTO: [ROLES.ADMIN, ROLES.OPERATOR],

	// Admin GEPRO: configurações e auditoria
	GEPRO_ADMIN: [ROLES.ADMIN],
};

module.exports = {
	ROLES,
	PERMISSIONS,
};
