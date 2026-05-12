/**
 * Serviço de Ativos — encapsula todas as chamadas a /assets/*.
 * Nenhum estado React aqui: apenas funções puras que retornam dados da API.
 */

import api from './api';
import { Asset } from '../types/entities';

export async function getAssets(): Promise<Asset[]> {
  const response = await api.get<Asset[]>('/assets');
  return response.data;
}

export async function createAsset(data: Partial<Asset>): Promise<Asset> {
  const response = await api.post<Asset>('/assets', data);
  return response.data;
}

export async function updateAsset(id: number, data: Partial<Asset>): Promise<Asset> {
  const response = await api.put<Asset>(`/assets/${id}`, data);
  return response.data;
}

export async function deleteAsset(id: number): Promise<void> {
  await api.delete(`/assets/${id}`);
}

export async function retireAsset(assetId: number, reason: string): Promise<void> {
  await api.put(`/assets/${assetId}/retire`, { reason });
}

export async function disposeAsset(assetId: number, disposalNote: string): Promise<void> {
  await api.put(`/assets/${assetId}/dispose`, { disposal_note: disposalNote });
}

/** Importação em lote via FormData (arquivo CSV/XLSX). */
export async function importAssets(formData: FormData): Promise<{ importedCount: number; errors: string[] }> {
  const response = await api.post('/assets/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
