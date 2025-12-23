import Link from "next/link";
import Image from "next/image";
import { BrandImage } from "../components/BrandImage";
import { getProperties, Property } from "../src/services/publicApi";
import { LeadForm } from "../components/LeadForm";
import { CarouselHorizontal } from "../components/CarouselHorizontal";
import { SafeImage } from "../components/SafeImage";
import { getPropertyCover, getPlaceholderImage } from "../src/utils/placeholders";
import { HeroCarousel } from "../components/HeroCarousel";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamic = "force-dynamic";

type RailConfig = {
  title: string;
  filter: (items: Property[]) => Property[];
  showRanking?: boolean;
  filterQuery?: string;
  maxItems?: number; // Número máximo de itens (default: 15)
};

const railConfigs: RailConfig[] = [
  {
    title: "Novidades",
    // Últimas 10 propriedades criadas (ordenar por created_at descendente)
    filter: (items) => [...items].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }),
    filterQuery: "",
  },
  {
    title: "Mais Vistos da Semana",
    // Top 10 mais visualizados nos últimos 7 dias (placeholder: ordenar por área útil)
    filter: (items) => [...items]
      .sort((a, b) => (b.usable_area ?? 0) - (a.usable_area ?? 0)),
    showRanking: true,
    filterQuery: "",
    maxItems: 10, // Sempre apenas 10 propriedades
  },
  {
    title: "Imóveis Luxury/Premium",
    filter: (items) =>
      items.filter(
        (p) =>
          (p.price ?? 0) >= 600000 ||
          (p.condition ?? "").toLowerCase().includes("lux") ||
          (p.property_type ?? "").toLowerCase().includes("villa")
      ),
    filterQuery: "?tipo=luxo",
  },
  {
    title: "Construção Nova",
    filter: (items) =>
      items.filter((p) => 
        (p.condition ?? "").toLowerCase().includes("novo") || 
        (p.condition ?? "").toLowerCase().includes("construção") ||
        (p.description ?? "").toLowerCase().includes("construção nova")
      ),
    filterQuery: "?condicao=novo",
  },
  {
    title: "Imóveis com Rendimento / Investimento",
    filter: (items) =>
      items.filter((p) => {
        const description = `${p.description ?? ""}${p.observations ?? ""}`.toLowerCase();
        return (
          (p.status ?? "").toUpperCase() === "RESERVED" ||
          (p.price ?? 0) < 150000 ||
          description.includes("rendimento") ||
          description.includes("arrendado")
        );
      }),
    filterQuery: "?negocio=investimento",
  },
  {
    title: "Apartamentos T0/T1",
    filter: (items) =>
      items.filter(
        (p) =>
          (p.property_type ?? "").toLowerCase().includes("apart") &&
          ((p.typology ?? "").toLowerCase() === "t0" || (p.typology ?? "").toLowerCase() === "t1")
      ),
    filterQuery: "?tipo=apartamento&tipologia=t0-t1",
  },
  {
    title: "Apartamentos T2/T3",
    filter: (items) =>
      items.filter(
        (p) =>
          (p.property_type ?? "").toLowerCase().includes("apart") &&
          ((p.typology ?? "").toLowerCase() === "t2" || (p.typology ?? "").toLowerCase() === "t3")
      ),
    filterQuery: "?tipo=apartamento&tipologia=t2-t3",
  },
  {
    title: "Apartamentos T4+",
    filter: (items) =>
      items.filter(
        (p) =>
          (p.property_type ?? "").toLowerCase().includes("apart") &&
          ((p.typology ?? "").toLowerCase().includes("t4") || 
           (p.typology ?? "").toLowerCase().includes("t5") ||
           (p.typology ?? "").toLowerCase().includes("t6"))
      ),
    filterQuery: "?tipo=apartamento&tipologia=t4plus",
  },
  {
    title: "Moradias Individuais",
    filter: (items) =>
      items.filter(
        (p) =>
          ((p.property_type ?? "").toLowerCase().includes("moradia") ||
           (p.property_type ?? "").toLowerCase().includes("villa")) &&
          !(p.description ?? "").toLowerCase().includes("geminada") &&
          !(p.observations ?? "").toLowerCase().includes("geminada")
      ),
    filterQuery: "?tipo=moradia-individual",
  },
  {
    title: "Moradias Geminadas",
    filter: (items) =>
      items.filter(
        (p) =>
          ((p.property_type ?? "").toLowerCase().includes("moradia") ||
           (p.property_type ?? "").toLowerCase().includes("villa")) &&
          ((p.description ?? "").toLowerCase().includes("geminada") ||
           (p.observations ?? "").toLowerCase().includes("geminada"))
      ),
    filterQuery: "?tipo=moradia-geminada",
  },
  {
    title: "Imóveis Comerciais",
    filter: (items) => 
      items.filter((p) => 
        (p.property_type ?? "").toLowerCase().includes("comer") ||
        (p.property_type ?? "").toLowerCase().includes("loja") ||
        (p.property_type ?? "").toLowerCase().includes("armazém")
      ),
    filterQuery: "?tipo=comercial",
  },
  {
    title: "Imóveis para Arrendar",
    filter: (items) => items.filter((p) => (p.business_type ?? "").toLowerCase().includes("arrend")),
    filterQuery: "?negocio=arrendamento",
  },
];

// ✅ Padrão: 15 itens por carrossel (exceto "Mais Vistos" que tem 10)
const MAX_ITEMS_PER_RAIL = 10;

const getRailData = (properties: Property[]) =>
  railConfigs.map((config) => {
    let items = config.filter(properties);
    const totalItems = items.length;
    
    // Usar maxItems específico do rail ou default (15)
    const limit = config.maxItems ?? MAX_ITEMS_PER_RAIL;
    items = items.slice(0, limit);
    
    console.log(`[${config.title}] Filtered: ${totalItems}, Showing: ${items.length}`);
    
    return {
      title: config.title,
      showRanking: config.showRanking,
      filterQuery: config.filterQuery || "",
      items,
      totalItems,
    };
  });

const getImage = (property?: Property) => {
  if (property) return getPropertyCover(property);
  return getPlaceholderImage("hero");
};

function RailCard({ property, index, showRanking }: { property: Property; index: number; showRanking?: boolean }) {
  const price = property.price ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) : "Preço sob consulta";
  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative min-w-[160px] sm:min-w-[200px] md:min-w-[220px] snap-start overflow-hidden rounded-xl md:rounded-2xl bg-[#101012] transition hover:-translate-y-1"
    >
      <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden">
        <SafeImage
          src={getImage(property)}
          alt={property.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 40vw, 240px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {showRanking && (
          <span className="absolute left-3 top-3 text-5xl font-extrabold text-white/30 drop-shadow-lg">{index + 1}</span>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
          {property.reference && (
            <span className="mb-1 inline-block rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E10600]">
              {property.reference}
            </span>
          )}
          <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1">{property.title || property.reference}</p>
          <p className="text-[10px] sm:text-xs text-[#C5C5C5] line-clamp-1">{property.location || property.municipality || "Localização reservada"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-2 sm:px-3 md:px-4 py-2 md:py-3 text-[10px] sm:text-xs text-[#C5C5C5]">
        <span className="font-semibold text-white">{price}</span>
        {property.typology && <span>{property.typology}</span>}
      </div>
    </Link>
  );
}

function SpotlightCard({ property }: { property: Property }) {
  const price = property.price ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) : "Preço sob consulta";
  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-b from-white/5 to-transparent"
    >
      <div className="relative h-64 w-full overflow-hidden">
        <SafeImage
          src={getImage(property)}
          alt={property.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 90vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[#E10600]">Destaque</p>
        {property.reference && (
          <span className="mb-2 inline-block w-fit rounded bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#E10600]">
            {property.reference}
          </span>
        )}
        <h3 className="text-lg font-semibold text-white md:text-2xl">{property.title || property.reference}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#C5C5C5]">
          <span>{property.typology || property.property_type || "Tipologia —"}</span>
          <span>{price}</span>
          <span>{property.location || property.municipality || "Localização reservada"}</span>
        </div>
      </div>
    </Link>
  );
}

function SpotlightCardVertical({ property }: { property: Property }) {
  const price = property.price ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) : "Preço sob consulta";
  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative block overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-b from-white/5 to-transparent transition hover:-translate-y-1"
    >
      <div className="relative h-80 w-full overflow-hidden">
        <SafeImage
          src={getImage(property)}
          alt={property.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-[#E10600] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
          Destaque
        </span>
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-5">
        <h3 className="text-base font-semibold text-white line-clamp-2 md:text-xl">{property.title || property.reference}</h3>
        <div className="mt-2 space-y-1 text-sm text-[#C5C5C5]">
          <p>{property.typology || property.property_type || "Tipologia —"}</p>
          <p className="font-semibold text-white">{price}</p>
          <p className="text-xs">{property.location || property.municipality || "Localização reservada"}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  const properties = await getProperties(500);
  console.log('Total properties loaded:', properties.length);
  
  // ✅ HERO: Preferir propriedades com vídeo; se não houver, usar destaques/novas
  const propertiesWithVideo = properties
    .filter(p => p.video_url && p.is_published)
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  
  let heroProperties = propertiesWithVideo.slice(0, 4);

  // Fallback: se não houver vídeos, usar propriedades em destaque ou últimas publicadas
  if (heroProperties.length === 0) {
    heroProperties = properties
      .filter(p => p.is_featured || p.is_published)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 4);
  }
  
  console.log(`Hero properties: ${heroProperties.length} propriedades com vídeo`);
  if (heroProperties.length > 0) {
    heroProperties.forEach((p, i) => {
      console.log(`  ${i + 1}ª: ${p.reference} (criada: ${p.created_at})`);
    });
  }
  
  // IDs already shown in hero
  const usedIds = new Set(heroProperties.map(p => p.id));
  
  // Filter out already shown properties before creating rails
  const availableForRails = properties.filter(p => !usedIds.has(p.id));
  
  const rails = getRailData(availableForRails);
  console.log('Rails generated:', rails.length);
  rails.forEach(r => console.log(`  ${r.title}: ${r.items.length} items`));
  const heroBackground = getImage(heroProperties[0]);
  const heroFallback = getPlaceholderImage("hero-fallback");

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      {/* header removido: menu e branding únicos no layout global */}

      <main className="space-y-12 pb-16">
        <HeroCarousel properties={heroProperties} />

        <section className="space-y-12">
          {rails.map(
            (rail) =>
              rail.items.length > 0 && (
                <div key={rail.title} className="space-y-4 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">{rail.title.includes("Top") ? "Top 10" : "Coleção"}</p>
                      <h3 className="text-2xl font-semibold">
                        {rail.title} <span className="text-sm text-[#666]">({rail.totalItems} imóveis)</span>
                      </h3>
                    </div>
                    {rail.totalItems > MAX_ITEMS_PER_RAIL && (
                      <Link
                        href={`/imoveis${rail.filterQuery}`}
                        className="flex items-center gap-2 text-sm font-semibold text-[#E10600] transition hover:text-white"
                      >
                        Ver Todos
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                  <CarouselHorizontal>
                    {rail.items.map((property, idx) => (
                      <div key={`${rail.title}-${property.id}`} className="snap-center pr-2 sm:pr-3">
                        <RailCard property={property} index={idx} showRanking={rail.showRanking} />
                      </div>
                    ))}
                  </CarouselHorizontal>
                </div>
              )
          )}
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 rounded-3xl border border-[#2A2A2E] bg-gradient-to-br from-[#0F0F10] to-[#070708] p-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">Curadoria pessoal</p>
              <h2 className="text-3xl font-semibold">Fala com o nosso studio e recebe sugestões privadas</h2>
              <p className="text-sm text-[#C5C5C5]">
                Mantemos o espírito “para si” com uma seleção privada enviada via e-mail ou chamada. Sem listas de agentes nesta zona—
                apenas experiências imersivas focadas em si.
              </p>
            </div>
            <LeadForm source="homepage" title="Quero ser contactado" cta="Pedir contacto" />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#111113] bg-[#050506] px-6 py-8 text-sm text-[#C5C5C5]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">Imóveis Mais</p>
            <p>Experiência alimentada por CRM PLUS.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/privacidade" className="hover:text-white">
              Privacidade
            </Link>
            <Link href="/contactos" className="hover:text-white">
              Contactos
            </Link>
            <Link href="/imoveis" className="hover:text-white">
              Ver catálogo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
