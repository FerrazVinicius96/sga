/**
 * AuthContext — gerencia o estado de autenticação global da aplicação.
 *
 * Responsabilidades:
 *   - Persistir e restaurar sessão via localStorage (token).
 *   - Verificar validade do token na inicialização (via authService.verifyToken).
 *   - Expor login() e logout() para os componentes.
 *   - Escutar o evento 'auth:unauthorized' emitido pelo interceptor de api.ts
 *     para realizar logout automático quando o backend retorna 401.
 *
 * O que NÃO está aqui:
 *   - Chamadas axios diretas (delegadas a authService).
 *   - API_URL (movido para src/config/env.ts).
 *   - Registro de interceptors axios (feito no singleton src/services/api.ts).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { AxiosError } from 'axios';
import { User, AuthContextType } from '../types/auth';
import { BackendErrorResponse } from '../types/api';
import * as authService from '../services/authService';
import { useToast } from './ToastContext';

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { addToast } = useToast();

  // ── Limpa a sessão localmente (não chama o backend) ────────────────────────
  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // ── Logout completo: registra no backend + limpa estado ───────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
      addToast('Logout realizado com sucesso.', 'info');
    } catch {
      // Falha no registro de auditoria não impede o logout local
      addToast('Erro ao registrar logout. Sessão encerrada localmente.', 'warning');
    } finally {
      clearSession();
    }
  }, [addToast, clearSession]);

  // ── Escuta 401 global emitido pelo interceptor de api.ts ──────────────────
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      addToast('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearSession, addToast]);

  // ── Verifica token salvo ao carregar a aplicação ──────────────────────────
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    authService
      .verifyToken()
      .then((userData) => {
        if (!cancelled) setUser(userData);
      })
      .catch((error: AxiosError<BackendErrorResponse>) => {
        if (cancelled) return;
        const status = error.response?.status;
        if (status === 403) {
          addToast('Sua conta está inativa. Contate o administrador.', 'error');
        } else {
          addToast('Sessão inválida ou expirada. Faça login novamente.', 'warning');
        }
        clearSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // Executado apenas quando o token muda (login/logout/reload)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
      try {
        const { token: newToken, user: userData } = await authService.login(email, password);
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        addToast('Login bem-sucedido!', 'success');
        return { success: true, message: 'Login bem-sucedido!' };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<BackendErrorResponse>;
        const message =
          typeof axiosError.response?.data?.message === 'string'
            ? axiosError.response.data.message
            : 'Erro ao fazer login. Verifique suas credenciais.';
        addToast(message, 'error');
        return { success: false, message };
      }
    },
    [addToast],
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
