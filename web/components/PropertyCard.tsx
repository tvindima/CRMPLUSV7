import { Property } from "../src/services/publicApi";
import Link from "next/link";
import { SafeImage } from "./SafeImage";
import { getPropertyCover } from "../src/utils/placeholders";

export function PropertyCard({ property }: { property: Property }) {
  const cover = getPropertyCover(property);
  const slug = encodeURIComponent(property.reference || property.title || `imovel-${property.id}`);
  return (
    <Link
      href={`/imovel/${slug}`}
      className="group relative overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0B0B0D] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:rotate-[-1deg] hover:border-[#4b9dff] hover:shadow-[0_20px_50px_rgba(75,157,255,0.35)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        <SafeImage src={cover} alt={property.title} fill className="object-cover transition duration-500 group-hover:scale-[1.04]" sizes="(min-width: 768px) 280px, 240px" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent opacity-80" />
        <div className="absolute bottom-2 left-2 flex flex-col gap-1 rounded-lg bg-black/35 px-3 py-2 backdrop-blur">
          <h3 className="text-base font-semibold text-white drop-shadow">{property.title}</h3>
          <p className="text-xs text-[#C5C5C5]">{property.location || "Localização"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-3 text-sm">
        <span className="rounded-full bg-[#10101A] px-3 py-1 font-semibold text-[#4b9dff]">
          € {property.price ?? "—"}
        </span>
        <span className="rounded-full bg-[#10101A] px-3 py-1 text-[#C5C5C5]">
          {property.area ? `${property.area} m²` : "—"}
        </span>
      </div>
    </Link>
  );
}
