'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; message: string; type: "success" | "error" | "info" };

type ToastContextValue = {
  push: (message: string, type?: Toast["type"]) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo(() => ({ push, remove }), [push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-16 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded border px-4 py-2 text-sm shadow ${
              toast.type === "success"
                ? "border-green-500/50 bg-green-500/10 text-green-200"
                : toast.type === "error"
                  ? "border-red-500/50 bg-red-500/10 text-red-200"
                  : "border-[#2A2A2E] bg-[#151518] text-white"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
