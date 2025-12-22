import { ReactNode } from "react";

export function Carousel({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto py-2">
      {children}
    </div>
  );
}
