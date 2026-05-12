/**
 * Tipos relacionados à autenticação e ao usuário autenticado.
 * Corrige a definição anterior que tinha apenas 3 roles, alinhando com os 5 roles do backend.
 */

/** Os cinco perfis de acesso definidos no backend (src/constants/permissions.js). */
export type UserRole = 'admin' | 'manager' | 'advisor' | 'basic' | 'operator';

/** Objeto de usuário retornado pelo backend nos endpoints /auth/* */
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: UserRole;
  must_change_password?: boolean;
  is_active?: boolean;
  job_title?: string;
  registration_number?: string;
  cpf?: string;
  unit_id?: number;
}

/** Contrato do AuthContext exposto via useAuth(). */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}
