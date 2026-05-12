/**
 * Serviço de Usuários do sistema — encapsula todas as chamadas a /users/*.
 * Diferente de personService (que gerencia pessoas externas/colaboradores),
 * este serviço gerencia contas de acesso ao SGA.
 */

import api from './api';
import { User } from '../types/auth';

export interface UserListFilters {
  role?: string;
  is_active?: boolean;
  search?: string;
}

export interface ResetPasswordResponse {
  message: string;
  generatedPassword: string;
}

export async function getUsers(filters?: UserListFilters): Promise<User[]> {
  const response = await api.get<{ users: User[] }>('/users', { params: filters });
  return response.data.users;
}

export async function getUserById(userId: number): Promise<User> {
  const response = await api.get<{ user: User }>(`/users/${userId}`);
  return response.data.user;
}

export async function registerUser(data: Partial<User> & { password?: string }): Promise<{ user: User; generatedPassword?: string }> {
  const response = await api.post<{ user: User; generatedPassword?: string }>('/users/register', data);
  return response.data;
}

export async function updateUser(userId: number, data: Partial<User>): Promise<User> {
  const response = await api.put<{ user: User }>(`/users/${userId}`, data);
  return response.data.user;
}

export async function resetUserPassword(userId: number): Promise<ResetPasswordResponse> {
  const response = await api.patch<ResetPasswordResponse>(`/users/${userId}/reset-password`);
  return response.data;
}

export async function activateUser(userId: number): Promise<void> {
  await api.patch(`/users/${userId}/activate`);
}

export async function deactivateUser(userId: number): Promise<void> {
  await api.patch(`/users/${userId}/deactivate`);
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}
