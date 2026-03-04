import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = (message: string) => add('success', message);
  const error = (message: string) => add('error', message);
  const warning = (message: string) => add('warning', message);
  const info = (message: string) => add('info', message);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, remove }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  key?: string;
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const duration = 3000;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const variants = {
    success: {
      icon: <CheckCircle2 className="text-emerald-500" size={20} />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      progress: 'bg-emerald-500',
    },
    error: {
      icon: <AlertCircle className="text-rose-500" size={20} />,
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      progress: 'bg-rose-500',
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={20} />,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      progress: 'bg-amber-500',
    },
    info: {
      icon: <Info className="text-indigo-500" size={20} />,
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-800',
      progress: 'bg-indigo-500',
    },
  };

  const { icon, bg, border, progress } = variants[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`pointer-events-auto w-80 md:w-96 rounded-2xl border shadow-2xl overflow-hidden ${bg} ${border} backdrop-blur-lg`}
    >
      <div className="p-4 flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
            {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-secondary)]"
        >
          <X size={16} />
        </button>
      </div>
      <div className="h-1 w-full bg-black/5 dark:bg-white/5">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`h-full ${progress}`}
        />
      </div>
    </motion.div>
  );
}
