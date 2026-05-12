/**
 * Espelho TypeScript de backend/src/constants/permissions.js
 *
 * REGRA: qualquer alteração de permissão no backend DEVE ser replicada aqui.
 * Centraliza toda a lógica de acesso — menus, ações e submenus — em um único lugar.
 */

import { UserRole } from '../types/auth';

export const ROLES = {
  ADMIN: 'admin' as UserRole,
  MANAGER: 'manager' as UserRole,
  ADVISOR: 'advisor' as UserRole,
  BASIC: 'basic' as UserRole,
  OPERATOR: 'operator' as UserRole,
} as const;

export const PERMISSIONS = {
  MENU_DASHBOARD: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],

  MENU_CADASTROS: [ROLES.ADMIN, ROLES.MANAGER],

  MENU_LOGISTICA: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],

  // Patrimônio: gestão apenas
  MENU_PATRIMONIO: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR],

  // Escolar: operator acessa, basic não
  MENU_ESCOLAR: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.OPERATOR],

  MENU_RELATORIOS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR],

  MENU_CONSULTAS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],

  MENU_AUDITORIA: [ROLES.ADMIN],

  MENU_CONFIGURACOES: [ROLES.ADMIN, ROLES.MANAGER],

  // Ações
  ACTION_REGISTER_MOVEMENT: [ROLES.ADMIN, ROLES.MANAGER, ROLES.BASIC, ROLES.OPERATOR],
  ACTION_CREATE_EDIT: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR],
  ACTION_REQUEST_RETIREMENT: [ROLES.ADMIN, ROLES.MANAGER],
  ACTION_FINAL_APPROVAL: [ROLES.ADMIN],
  ACTION_APPROVE_REJECT: [ROLES.ADMIN],
  ACTION_DELETE: [ROLES.ADMIN],

  // Submenus de cadastro
  SUBMENU_TIPOS_ITENS: [ROLES.ADMIN, ROLES.MANAGER],
  SUBMENU_UNIDADES: [ROLES.ADMIN, ROLES.MANAGER],
  SUBMENU_PESSOAS: [ROLES.ADMIN, ROLES.MANAGER],
  SUBMENU_ATIVOS: [ROLES.ADMIN, ROLES.MANAGER],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Verifica se um role tem permissão para uma chave.
 * Uso puro (sem React) — pode ser chamado em serviços e guards.
 */
export function hasPermission(role: UserRole | undefined, permission: PermissionKey): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
