/**
 * Serviço de Movimentações — encapsula todas as chamadas a /asset-movements/*.
 */

import api from './api';
import { Movement } from '../types/entities';

export interface MovementFilters {
  solicitante?: string;
  patrimonio?: string;
  cpf?: string;
  matricula?: string;
  movementType?: string;
  startDate?: string;
  endDate?: string;
}

export async function getMovements(filters: MovementFilters = {}): Promise<Movement[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.append(key, value);
  }
  const response = await api.get<Movement[]>(`/asset-movements?${params.toString()}`);
  return response.data;
}

export async function getMovementDetails(movementId: number): Promise<Movement> {
  const response = await api.get<Movement>(`/asset-movements/${movementId}/details`);
  return response.data;
}

/** Cria uma movimentação. Aceita FormData para movimentações com arquivo anexo. */
export async function createMovement(data: FormData | Record<string, unknown>): Promise<Movement> {
  const isFormData = data instanceof FormData;
  const response = await api.post<Movement>('/asset-movements', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
}

export async function renewMovement(movementId: number, data: Record<string, unknown>): Promise<Movement> {
  const response = await api.put<Movement>(`/asset-movements/${movementId}/renew`, data);
  return response.data;
}

/** Baixa o comprovante PDF de uma movimentação como Blob. */
export async function getMovementReceiptPdf(movementId: number): Promise<Blob> {
  const response = await api.get(`/asset-movements/${movementId}/receipt-pdf`, {
    responseType: 'blob',
  });
  return response.data;
}
