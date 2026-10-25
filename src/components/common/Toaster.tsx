'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToasterContextType {
  toast: (type: Toast['type'], message: string) => void;
}

const ToasterContext = createContext<ToasterContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToasterContext);
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToasterContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right ${
            t.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
            t.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            {t.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
            <span className="text-sm flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="flex-shrink-0 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </ToasterContext.Provider>
  );
}

export function Toaster() {
  return <ToasterProvider>{null}</ToasterProvider>;
}