'use client';

import { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Drawer({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
      <div className="h-full w-full max-w-xl border-l border-[#2A2A2E] bg-[#0B0B0D] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2A2A2E] px-4 py-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-sm text-[#C5C5C5] hover:text-white">
            Fechar
          </button>
        </div>
        <div className="max-h-[calc(100vh-60px)] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
