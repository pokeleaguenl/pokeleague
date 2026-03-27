"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "i",
  };

  const styles: Record<ToastType, string> = {
    success: "border-green-500/40 bg-green-950/90 text-green-300",
    error: "border-red-500/40 bg-red-950/90 text-red-300",
    info: "border-blue-500/40 bg-blue-950/90 text-blue-300",
  };

  const iconStyles: Record<ToastType, string> = {
    success: "bg-green-500/20 text-green-400",
    error: "bg-red-500/20 text-red-400",
    info: "bg-blue-500/20 text-blue-400",
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-toast-in ${styles[t.type]}`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${iconStyles[t.type]}`}>
              {icons[t.type]}
            </span>
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
