import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[10000] space-y-3 pointer-events-none w-full max-w-sm px-4 sm:px-0">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-4 rounded-xl shadow-2xl shadow-black/50 animate-in slide-in-from-right fade-in duration-300">
             <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${t.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_#34d399]' : t.type === 'error' ? 'bg-rose-500 shadow-[0_0_8px_#fb7185]' : 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]'}`} />
             <div className="flex-1 min-w-0">
                 <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${t.type === 'success' ? 'text-emerald-500' : t.type === 'error' ? 'text-rose-500' : 'text-sky-500'}`}>
                     {t.type}
                 </h4>
                 <p className="text-xs font-medium text-slate-300 break-words leading-relaxed">{t.message}</p>
             </div>
             <button onClick={() => removeToast(t.id)} className="text-slate-500 hover:text-white transition-colors p-1">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};