import { getProperties, Property } from "../src/services/publicApi";
import { LeadForm } from "../components/LeadForm";
import { getPropertyCover, getPlaceholderImage } from "../src/utils/placeholders";
import { HeroCarousel } from "../components/HeroCarousel";
import { HomePageWrapper } from "../components/HomePageWrapper";
import { RailSection, ContactSection } from "../components/HomePageSections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RailConfig = {
  title: string;
  filter: (items: Property[]) => Property[];
  showRanking?: boolean;
  filterQuery?: string;
  maxItems?: number;
};

const railConfigs: RailConfig[] = [
  {
    title: "Novidades",
    filter: (items) =>
      [...items]
        .filter((p) => {
          const status = (p.status || "").toUpperCase();
          const isAvailable = status === "" || status === "AVAILABLE";
          return isAvailable && (p.is_published ?? 1) === 1;
        })
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }),
    filterQuery: "",
    maxItems: 15,
  },
  {
    title: "Mais Vistos da Semana",
    filter: (items) =>
      [...items].sort((a, b) => {
        const viewsA = a.view_count_7d ?? a.views_last_7_days ?? a.weekly_views ?? 0;
        const viewsB = b.view_count_7d ?? b.views_last_7_days ?? b.weekly_views ?? 0;
        if (viewsB !== viewsA) return viewsB - viewsA;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }),
    showRanking: true,
    filterQuery: "",
    maxItems: 10,
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

const MAX_ITEMS_PER_RAIL = 10;

const getRailData = (properties: Property[]) =>
  railConfigs.map((config) => {
    let items = config.filter(properties);
    const totalItems = items.length;
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

export default async function Home() {
  const properties = await getProperties(500);
  console.log('Total properties loaded:', properties.length);
  
  const propertiesWithVideo = properties
    .filter(p => p.video_url && p.is_published)
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  
  let heroProperties = propertiesWithVideo.slice(0, 4);

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
  
  const usedIds = new Set(heroProperties.map(p => p.id));
  const availableForRails = properties.filter(p => !usedIds.has(p.id));
  
  const rails = getRailData(availableForRails);
  console.log('Rails generated:', rails.length);
  rails.forEach(r => console.log(`  ${r.title}: ${r.items.length} items`));

  return (
    <HomePageWrapper>
      <main className="space-y-12 pb-16">
        <HeroCarousel properties={heroProperties} />

        <section className="space-y-12">
          {rails.map(
            (rail) =>
              rail.items.length > 0 && (
                <RailSection
                  key={rail.title}
                  title={rail.title}
                  showRanking={rail.showRanking}
                  filterQuery={rail.filterQuery}
                  items={rail.items}
                  totalItems={rail.totalItems}
                  maxItemsPerRail={MAX_ITEMS_PER_RAIL}
                />
              )
          )}
        </section>

        <ContactSection>
          <LeadForm source="homepage" title="Quero ser contactado" cta="Pedir contacto" />
        </ContactSection>
      </main>
    </HomePageWrapper>
  );
}
