/**
 * Serviço de Tipos de Itens — encapsula todas as chamadas a /item-types/*.
 */

import api from './api';
import { ItemType } from '../types/entities';

export async function getItemTypes(): Promise<ItemType[]> {
  const response = await api.get<ItemType[]>('/item-types');
  return response.data;
}

export async function createItemType(data: Partial<ItemType>): Promise<ItemType> {
  const response = await api.post<ItemType>('/item-types', data);
  return response.data;
}

export async function updateItemType(id: number, data: Partial<ItemType>): Promise<ItemType> {
  const response = await api.put<ItemType>(`/item-types/${id}`, data);
  return response.data;
}

export async function deleteItemType(id: number): Promise<void> {
  await api.delete(`/item-types/${id}`);
}
