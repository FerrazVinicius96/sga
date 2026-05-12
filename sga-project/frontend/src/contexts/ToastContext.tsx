/**
 * ToastContext — sistema global de notificações visuais.
 * Extraído do App.tsx para que qualquer componente da árvore acesse via useToast().
 *
 * Uso:
 *   const { addToast } = useToast();
 *   addToast('Ativo salvo com sucesso!', 'success');
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Toast, ToastContextType, ToastType } from '../types/ui';

const ToastContext = createContext<ToastContextType | null>(null);

// ── Hook público ─────────────────────────────────────────────────────────────

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

// ── Componentes internos ──────────────────────────────────────────────────────

const BG: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
};

const ICON: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const Icon = ICON[toast.type];
  return (
    <div
      className={`${BG[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300`}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium flex-grow">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-auto p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[2000] space-y-3">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Auto-remove o primeiro toast após 5 segundos
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => removeToast(toasts[0].id), 5000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
