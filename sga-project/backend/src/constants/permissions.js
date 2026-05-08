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
};

module.exports = {
	ROLES,
	PERMISSIONS,
};
