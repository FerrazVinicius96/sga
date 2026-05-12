/**
 * Serviço de Relatórios e Dashboard — encapsula chamadas a /dashboard/* e /reports/*.
 * Funções que retornam Blob são para download de arquivos XLSX/PDF.
 */

import api from './api';
import { DashboardData } from '../types/entities';

export async function getDashboardSummary(): Promise<DashboardData> {
  const response = await api.get<DashboardData>('/dashboard/summary');
  return response.data;
}

export async function getExpiringWarranties(): Promise<
  { count: number; description: string; endDate: string; daysRemaining: number }[]
> {
  const response = await api.get('/reports/expiring-warranties');
  return response.data;
}

/** Baixa relatório como Blob e dispara download no browser. */
async function downloadReport(endpoint: string, filename: string): Promise<void> {
  const response = await api.get(endpoint, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const downloadInventoryByUnit = () =>
  downloadReport('/reports/management/inventory-by-unit/xlsx', 'inventario-por-unidade.xlsx');

export const downloadMovementsSummary = () =>
  downloadReport('/reports/management/movements-summary/xlsx', 'resumo-movimentacoes.xlsx');

export const downloadPendingDocs = () =>
  downloadReport('/reports/pending-docs/xlsx', 'termos-pendentes.xlsx');

export const downloadMaintenanceReport = () =>
  downloadReport('/reports/maintenance/xlsx', 'manutencao.xlsx');

export const downloadExpiringWarrantiesReport = () =>
  downloadReport('/reports/expiring-warranties/xlsx', 'garantias-a-vencer.xlsx');
