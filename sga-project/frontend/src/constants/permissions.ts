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

  // ── Bifurcação de sistemas ────────────────────────────────────────────────
  // Espelho de backend/src/constants/permissions.js — seção GEPRO
  // Mapeamento: admin→gepro_admin, manager→gestor/compras, advisor→analista/jurídico,
  //             basic→solicitante, operator→recebimento
  SISTEMA_SGA:   [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],
  SISTEMA_GEPRO: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],

  // ── GEPRO — permissões por ação ───────────────────────────────────────────
  // Fase 1: qualquer usuário com acesso ao GEPRO pode criar demanda
  GEPRO_CRIAR_DEMANDA:    [ROLES.ADMIN, ROLES.MANAGER, ROLES.ADVISOR, ROLES.BASIC, ROLES.OPERATOR],
  // Fase 1: apenas gestor e admin aprovam/rejeitam
  GEPRO_APROVAR_DEMANDA:  [ROLES.ADMIN, ROLES.MANAGER],
  // Fase 2: analista técnico (advisor) e admin preenchem ETP/TR
  GEPRO_INSTRUCAO_TECNICA:[ROLES.ADMIN, ROLES.ADVISOR],
  // Fase 2: gestor de compras (manager) e admin registram cotações
  GEPRO_COTACOES:         [ROLES.ADMIN, ROLES.MANAGER],
  // Fase 3: jurídico (advisor) e admin emitem parecer
  GEPRO_JURIDICO:         [ROLES.ADMIN, ROLES.ADVISOR],
  // Fase 4: recebimento (operator) e admin registram testes/atestado
  GEPRO_RECEBIMENTO:      [ROLES.ADMIN, ROLES.OPERATOR],
  // Fase 4A: gerência (manager) agenda entrega após NE emitida
  GEPRO_AGENDAMENTO:      [ROLES.ADMIN, ROLES.MANAGER],
  // Fase 3/GPOT: apenas admin emite nota de empenho (invisível para gerência)
  GEPRO_EMITIR_NE:        [ROLES.ADMIN],
  // Módulo Contratos (DANTAS)
  GEPRO_CONTRATOS:        [ROLES.ADMIN, ROLES.MANAGER],
  // Configurações e templates GEPRO
  GEPRO_ADMIN:            [ROLES.ADMIN],
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
