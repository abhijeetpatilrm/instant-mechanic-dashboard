"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';

type Toast = { id: string; type: 'success' | 'error' | 'info'; title: string; description?: string };

type ToastContextValue = { toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void; remove: (id: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (t: Omit<Toast, 'id'>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const nt = { id, ...t } as Toast;
    setToasts((s) => [nt, ...s]);
    // auto remove
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4500);
  };

  const remove = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  const value = useMemo(() => ({ toasts, push, remove }), [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`max-w-sm w-full rounded-md p-3 shadow ${t.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : t.type === 'error' ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-200'}`}>
            <div className="font-medium text-sm">{t.title}</div>
            {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
            <button aria-label={`Dismiss ${t.title}`} className="absolute top-1 right-1 text-xs opacity-70" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return { push: ctx.push, remove: ctx.remove, toasts: ctx.toasts };
}

export default ToastProvider;
