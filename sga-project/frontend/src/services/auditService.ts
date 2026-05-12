/**
 * Serviço de Auditoria — encapsula chamadas a /audit-logs.
 */

import api from './api';
import { AuditLog } from '../types/entities';

export async function getAuditLogs(): Promise<AuditLog[]> {
  const response = await api.get<AuditLog[]>('/audit-logs');
  return response.data;
}
