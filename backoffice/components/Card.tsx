'use client';

import { ReactNode } from "react";

type CardProps = {
  children?: ReactNode;
  className?: string;
  title?: string;
  value?: ReactNode;
};

export function StatCard({ children, title, value, className = "" }: CardProps) {
  return (
    <div className={`rounded-2xl border border-[#131315] bg-[#0F0F10] p-5 text-white ${className}`}>
      {title && <p className="text-sm text-[#C5C5C5]">{title}</p>}
      {value && <div className="pt-3 text-4xl font-semibold">{value}</div>}
      {children}
    </div>
  );
}
