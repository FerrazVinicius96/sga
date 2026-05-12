/**
 * Serviço de Usuários do sistema — encapsula todas as chamadas a /users/*.
 * Diferente de personService (que gerencia pessoas externas/colaboradores),
 * este serviço gerencia contas de acesso ao SGA.
 */

import api from './api';
import { User } from '../types/auth';

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return response.data;
}

export async function registerUser(data: Partial<User> & { password?: string }): Promise<User> {
  const response = await api.post<User>('/users/register', data);
  return response.data;
}

export async function updateUser(userId: number, data: Partial<User> & { password?: string }): Promise<User> {
  const response = await api.put<User>(`/users/${userId}`, data);
  return response.data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}
