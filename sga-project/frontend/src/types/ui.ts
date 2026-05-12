/**
 * Tipos relacionados à camada de interface do usuário.
 * Isola tipos de UI (toast, modais, etc.) dos tipos de domínio.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}
