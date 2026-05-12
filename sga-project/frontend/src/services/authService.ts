/**
 * Serviço de autenticação — espelha os endpoints de backend/src/routes/authRoute.js:
 *   POST /auth/login
 *   POST /auth/logout
 *   GET  /auth/verify-token
 *
 * Não contém estado React. Retorna apenas as respostas cruas da API para que
 * o AuthContext decida o que fazer com elas (persistir token, atualizar estado, etc.).
 */

import { AxiosError } from 'axios';
import api from './api';
import { User } from '../types/auth';
import { BackendErrorResponse } from '../types/api';

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

interface VerifyTokenResponse {
  user: User;
  isValid?: boolean;
}

/** Autentica o usuário e devolve token + dados do usuário. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

/** Registra logout no backend (auditoria). Falha silenciosa — cleanup ocorre no contexto. */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Valida o token armazenado e devolve os dados atualizados do usuário.
 * Lança erro (401/403) se o token for inválido ou o usuário estiver inativo.
 */
export async function verifyToken(): Promise<User> {
  try {
    const response = await api.get<VerifyTokenResponse>('/auth/verify-token');
    return response.data.user;
  } catch (error) {
    const axiosError = error as AxiosError<BackendErrorResponse>;
    // Preserva o status HTTP para que o AuthContext possa diferenciar 401 de 403
    throw axiosError;
  }
}
