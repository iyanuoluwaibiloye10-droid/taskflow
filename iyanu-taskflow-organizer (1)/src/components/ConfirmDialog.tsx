import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-[var(--bg-secondary)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border-color)]"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  variant === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold">{title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{message}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                    variant === 'danger' 
                      ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600' 
                      : 'bg-indigo-600 shadow-indigo-500/20 hover:bg-indigo-700'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
