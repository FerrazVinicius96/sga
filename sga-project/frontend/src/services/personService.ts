/**
 * Serviço de Pessoas — encapsula todas as chamadas a /people/*.
 */

import api from './api';
import { Person } from '../types/entities';

export async function getPeople(): Promise<Person[]> {
  const response = await api.get<Person[]>('/people');
  return response.data;
}

export async function createPerson(data: Partial<Person>): Promise<Person> {
  const response = await api.post<Person>('/people', data);
  return response.data;
}

export async function updatePerson(id: number, data: Partial<Person>): Promise<Person> {
  const response = await api.put<Person>(`/people/${id}`, data);
  return response.data;
}

export async function deletePerson(id: number): Promise<void> {
  await api.delete(`/people/${id}`);
}
