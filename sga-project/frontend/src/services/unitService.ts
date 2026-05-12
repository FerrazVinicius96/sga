/**
 * Serviço de Unidades — encapsula todas as chamadas a /units/*.
 */

import api from './api';
import { Unit, UnitData } from '../types/entities';

export async function getUnits(): Promise<Unit[]> {
  const response = await api.get<Unit[]>('/units');
  return response.data;
}

export async function createUnit(data: UnitData): Promise<Unit> {
  const response = await api.post<Unit>('/units', data);
  return response.data;
}

export async function updateUnit(id: number, data: Partial<UnitData>): Promise<Unit> {
  const response = await api.put<Unit>(`/units/${id}`, data);
  return response.data;
}

export async function deleteUnit(id: number): Promise<void> {
  await api.delete(`/units/${id}`);
}
