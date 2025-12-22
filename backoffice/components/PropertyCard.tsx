import { Property } from "../src/services/publicApi";
import Link from "next/link";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/imovel/${property.title}`}
      className="group relative overflow-hidden rounded-xl border border-[#2A2A2E] bg-[#151518] p-4 transition hover:border-[#E10600] hover:shadow-[0_0_18px_rgba(225,6,0,0.35)]"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{property.title}</h3>
        <span className="rounded-full border border-[#2A2A2E] px-2 py-1 text-xs uppercase text-[#C5C5C5]">
          {property.status || "—"}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#C5C5C5]">{property.location || "Localização indisponível"}</p>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="rounded bg-[#0B0B0D] px-3 py-1 font-semibold text-[#E10600]">
          € {property.price ?? "—"}
        </span>
        <span className="rounded bg-[#0B0B0D] px-3 py-1 text-[#C5C5C5]">
          Área: {property.area ? `${property.area} m²` : "—"}
        </span>
      </div>
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E10600]/10 to-transparent" />
      </div>
    </Link>
  );
}
