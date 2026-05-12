/**
 * usePermission — verifica se o usuário autenticado tem acesso a uma permissão.
 *
 * Substitui a função can() definida inline no DashboardPage do App.tsx.
 * Usa a matriz PERMISSIONS de src/constants/permissions.ts, que é o espelho
 * do backend, garantindo consistência sem duplicação de regras.
 *
 * Exemplo de uso:
 *   const canDelete = usePermission('ACTION_DELETE');
 *   const canViewAudit = usePermission('MENU_AUDITORIA');
 */

import { useAuth } from '../contexts/AuthContext';
import { hasPermission, PermissionKey } from '../constants/permissions';

export function usePermission(permission: PermissionKey): boolean {
  const { user } = useAuth();
  return hasPermission(user?.role, permission);
}
