import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import React from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string; type: ToastType; message: string; duration: number;
}

interface ToastContextValue {
  show:    (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  warning: (message: string) => void;
  info:    (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { wrapper: string; icon: string; path: string }> = {
  success: { wrapper: 'bg-green-50 border-green-200 text-green-800', icon: 'text-green-500', path: 'M5 13l4 4L19 7' },
  error:   { wrapper: 'bg-red-50 border-red-200 text-red-800',       icon: 'text-red-500',   path: 'M6 18L18 6M6 6l12 12' },
  warning: { wrapper: 'bg-amber-50 border-amber-200 text-amber-800', icon: 'text-amber-500', path: 'M12 9v2m0 4h.01' },
  info:    { wrapper: 'bg-blue-50 border-blue-200 text-blue-800',    icon: 'text-blue-500',  path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

function ToastItemComponent({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = STYLES[item.type];
  useEffect(() => {
    if (item.duration > 0) timerRef.current = setTimeout(() => onRemove(item.id), item.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [item.id, item.duration, onRemove]);
  return (
    <div role="alert" aria-live="assertive"
      className={`flex items-start gap-3 px-4 py-3 rounded-md border text-sm shadow-md max-w-sm w-full animate-slide-right ${s.wrapper}`}>
      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${s.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.path} />
      </svg>
      <span className="flex-1 leading-snug">{item.message}</span>
      <button onClick={() => onRemove(item.id)} aria-label="닫기" className="shrink-0 opacity-50 hover:opacity-100">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const remove = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const show   = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((p) => [...p.slice(-4), { id, type, message, duration }]);
  }, []);
  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error:   (m) => show(m, 'error',   5000),
    warning: (m) => show(m, 'warning'),
    info:    (m) => show(m, 'info'),
  };
  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end" aria-label="알림">
          {toasts.map((t) => <ToastItemComponent key={t.id} item={t} onRemove={remove} />)}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
