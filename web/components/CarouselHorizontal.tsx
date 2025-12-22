'use client';

import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type Props = {
  children: React.ReactNode;
  title?: string;
};

export function CarouselHorizontal({ children, title }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    if (ref.current) ref.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      {title && <h2 className="text-base font-semibold text-white md:text-xl">{title}</h2>}
      <div className="relative">
        <button
          aria-label="Anterior"
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 hidden md:block"
          onClick={() => scrollBy(-300)}
          type="button"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-2 sm:gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-2 [perspective:1200px] [-webkit-overflow-scrolling:touch]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>
        <button
          aria-label="Seguinte"
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 hidden md:block"
          onClick={() => scrollBy(300)}
          type="button"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
