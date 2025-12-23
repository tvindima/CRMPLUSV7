import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgents, getProperties, Property } from "../../../src/services/publicApi";
import { HeroCarousel } from "../../../components/HeroCarousel";
import { CarouselHorizontal } from "../../../components/CarouselHorizontal";
import { LeadForm } from "../../../components/LeadForm";
import { SafeImage } from "../../../components/SafeImage";
import { getPropertyCover } from "../../../src/utils/placeholders";
import Image from "next/image";
import { optimizeAvatarUrl } from "../../../src/lib/cloudinary";

type Props = { params: { slug: string } };

// Generate static params for all agents at build time
export async function generateStaticParams() {
  try {
    const agents = await getAgents(50);
    console.log(`[generateStaticParams] Gerando páginas para ${agents.length} agentes`);
    
    // Gerar slugs baseados no NOME do agente (não depende de slug do banco)
    const params = agents.map((agent) => {
      const slug = normalizeSlug(agent.name);
      console.log(`  → /agentes/${slug} (${agent.name}, ID: ${agent.id})`);
      return { slug };
    });
    
    return params;
  } catch (error) {
    console.error('[generateStaticParams] Error:', error);
    // Return common agent slugs as fallback
    return [
      { slug: 'marisa-barosa' },
      { slug: 'nelson-neto' },
      { slug: 'tiago-vindima' },
      { slug: 'joao-rodrigues' },
      { slug: 'pedro-olaio' },
      { slug: 'joao-olaio' },
      { slug: 'joao-paiva' },
    ];
  }
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Normalize name for URL slug
function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

type RailConfig = {
  title: string;
  filter: (items: Property[]) => Property[];
  showRanking?: boolean;
  filterQuery?: string;
};

const MAX_ITEMS_PER_RAIL = 10;

function RailCard({ property, index, showRanking }: { property: Property; index: number; showRanking?: boolean }) {
  const price = property.price ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) : "Preço sob consulta";
  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative min-w-[160px] sm:min-w-[200px] md:min-w-[220px] snap-start overflow-hidden rounded-xl md:rounded-2xl bg-[#101012] transition hover:-translate-y-1"
    >
      <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden">
        <SafeImage
          src={getPropertyCover(property)}
          alt={property.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 40vw, 240px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {showRanking && (
          <span className="absolute left-2 sm:left-3 top-2 sm:top-3 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white/30 drop-shadow-lg">{index + 1}</span>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
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

function SpotlightCardVertical({ property }: { property: Property }) {
  const price = property.price ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) : "Preço sob consulta";
  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative block overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-b from-white/5 to-transparent transition hover:-translate-y-1"
    >
      <div className="relative h-80 w-full overflow-hidden">
        <SafeImage
          src={getPropertyCover(property)}
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
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <h3 className="text-xl font-semibold text-white line-clamp-2">{property.title || property.reference}</h3>
        <div className="mt-2 space-y-1 text-sm text-[#C5C5C5]">
          <p>{property.typology || property.property_type || "Tipologia —"}</p>
          <p className="font-semibold text-white">{price}</p>
          <p className="text-xs">{property.location || property.municipality || "Localização reservada"}</p>
        </div>
      </div>
    </Link>
  );
}

// ✅ DEFINIÇÃO DE EQUIPAS - partilha de carteira de imóveis
const TEAMS = {
  "Pedro Olaio": {
    teamLeader: 40, // Pedro Olaio
    members: [40, 41, 39], // Pedro Olaio, João Olaio, Nuno Faria
  },
  "João Olaio": {
    teamLeader: 40, // Pedro Olaio (chefe)
    members: [40, 41, 39], // Mesma equipa
  },
  "Nuno Faria": {
    teamLeader: 40, // Pedro Olaio (chefe)
    members: [40, 41, 39], // Mesma equipa
  },
};

export default async function AgentPage({ params }: Props) {
  const agents = await getAgents(50);
  const allProperties = await getProperties(500);

  const normalizedSlug = normalizeSlug(decodeURIComponent(params.slug));
  const agent = agents.find((a) => normalizeSlug(a.name) === normalizedSlug);

  if (!agent) notFound();

  // ✅ Filter properties: se faz parte de equipa, mostra imóveis de TODA a equipa
  const teamConfig = TEAMS[agent.name as keyof typeof TEAMS];
  const properties = teamConfig
    ? allProperties.filter((p) => teamConfig.members.includes(p.agent_id ?? 0))
    : allProperties.filter((p) => p.agent_id === agent.id);

  // Staff members (support team) - matching structure from /agentes page
  const allStaffMembers = [
    { id: 19, name: "Ana Vindima", role: "Assistente de Tiago Vindima", phone: "918 503 014", avatar: "/avatars/19.png", isAgent: false, supportFor: "Tiago Vindima" },
    { id: 20, name: "Maria Olaio", role: "Diretora Financeira", phone: "244 001 003", avatar: "/avatars/20.png", isAgent: false },
    { id: 21, name: "Andreia Borges", role: "Assistente Administrativa", phone: "244 001 004", avatar: "/avatars/21.png", isAgent: false },
    { id: 22, name: "Sara Ferreira", role: "Assistente Administrativa", phone: "244 001 002", avatar: "/avatars/22.png", isAgent: false },
    { id: 23, name: "Cláudia Libânio", role: "Assistente de Bruno Libânio", phone: "912 118 911", avatar: "/avatars/23.png", isAgent: false, supportFor: "Bruno Libânio" },
  ];

  // Build team members list: only staff directly supporting this agent (or generic staff if no specific support)
  const teamMembers = [
    // Staff members that support this specific agent or general staff
    ...allStaffMembers
      .filter(staff => {
        // Include if staff supports this specific agent
        if ('supportFor' in staff && staff.supportFor === agent.name) return true;
        // Include general staff (no supportFor property or supportFor is empty)
        if (!('supportFor' in staff) || !staff.supportFor) return true;
        return false;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'))
  ];

  // Rail configurations (same as homepage but filtered)
  const railConfigs: RailConfig[] = [
    {
      title: "Novidades",
      // Últimas 10 propriedades criadas pelo agente/equipa
      filter: (items) => [...items].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }),
      filterQuery: "",
    },
    {
      title: "Mais Vistos da Semana",
      // Top 10 mais visualizados (placeholder: ordenar por área útil)
      filter: (items) => [...items].sort((a, b) => (b.usable_area ?? 0) - (a.usable_area ?? 0)),
      showRanking: true,
      filterQuery: "",
    },
    {
      title: "Imóveis com Rendimento",
      filter: (items) =>
        items.filter((p) => {
          const description = `${p.description ?? ""}${p.observations ?? ""}`.toLowerCase();
          return (
            (p.business_type ?? "").toLowerCase().includes("invest") ||
            description.includes("rendimento") ||
            (p.price ?? 0) > 450000
          );
        }),
      filterQuery: "?negocio=investimento",
    },
    {
      title: "Imóveis para Arrendamento",
      filter: (items) => items.filter((p) => (p.business_type ?? "").toLowerCase().includes("arrend")),
      filterQuery: "?negocio=arrendamento",
    },
    {
      title: "Apartamentos",
      filter: (items) =>
        items.filter(
          (p) =>
            (p.property_type ?? "").toLowerCase().includes("apart") ||
            (p.typology ?? "").toLowerCase().startsWith("t")
        ),
      filterQuery: "?tipo=apartamento",
    },
    {
      title: "Moradias",
      filter: (items) =>
        items.filter(
          (p) =>
            (p.property_type ?? "").toLowerCase().includes("moradia") ||
            (p.property_type ?? "").toLowerCase().includes("villa") ||
            (p.title ?? "").toLowerCase().includes("moradia")
        ),
      filterQuery: "?tipo=moradia",
    },
  ];

  const getRailData = (properties: Property[]) =>
    railConfigs.map((config) => {
      let items = config.filter(properties);
      const totalItems = items.length;
      
      // Limit to MAX_ITEMS_PER_RAIL (10)
      items = items.slice(0, MAX_ITEMS_PER_RAIL);
      
      return {
        title: config.title,
        showRanking: config.showRanking,
        filterQuery: config.filterQuery || "",
        items,
        totalItems, // Total before limiting
      };
    });

  // ✅ HERO: Últimas 4 propriedades COM VÍDEO do agente/equipa (ordenadas por created_at)
  const propertiesWithVideo = properties
    .filter(p => p.video_url && p.is_published)
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Mais recente primeiro
    });
  
  const heroProperties = propertiesWithVideo.slice(0, 4);
  
  console.log(`\n[🎬 Agent ${agent.name}] Análise de Vídeos:`);
  console.log(`  Total propriedades do agente: ${properties.length}`);
  console.log(`  Propriedades com vídeo: ${propertiesWithVideo.length}`);
  
  if (heroProperties.length > 0) {
    console.log(`  ✅ Hero carousel vai mostrar ${heroProperties.length} vídeos:`);
    heroProperties.forEach((p, i) => {
      console.log(`    ${i + 1}. ${p.reference}: ${p.video_url}`);
    });
  } else {
    console.log(`  ⚠️ Nenhum vídeo disponível - Hero vai usar imagens estáticas`);
  }
  
  // IDs already shown in hero
  const usedIds = new Set(heroProperties.map(p => p.id));
  
  // Filter out already shown properties before creating rails
  const availableForRails = properties.filter(p => !usedIds.has(p.id));
  
  const rails = getRailData(availableForRails);

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      {/* Agent Header Banner */}
      <div className="relative border-b border-[#111113] bg-gradient-to-br from-[#E10600]/10 via-[#0B0B0D] to-[#050506]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link
            href="/agentes"
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#C5C5C5] transition hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar à equipa
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-[#E10600]/30">
              <Image
                src={optimizeAvatarUrl(agent.photo) || agent.avatar || `/avatars/${normalizeSlug(agent.name)}.png`}
                alt={agent.name}
                fill
                className="object-cover"
                sizes="96px"
                priority
              />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">Microsite Pessoal</p>
              <h1 className="text-xl font-semibold md:text-3xl">{agent.name}</h1>
              {/* Botão Ver Perfil */}
              <Link
                href={`/agentes/${normalizeSlug(agent.name)}/perfil`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#C5C5C5] transition hover:text-[#E10600]"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ver Perfil Completo
              </Link>
              <p className="mt-2 text-sm text-[#C5C5C5]">
                <Link 
                  href={teamConfig ? `/imoveis?team=${encodeURIComponent(teamConfig.members.join(','))}` : `/imoveis?agent_id=${agent.id}`}
                  className="font-semibold text-[#E10600] hover:underline"
                >
                  {properties.length} imóveis
                </Link>
                {agent.team && ` • Equipa ${agent.team}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone.replace(/\s/g, "")}`}
                    className="text-xs font-semibold text-[#E10600] hover:underline"
                  >
                    {agent.phone}
                  </a>
                )}
                <span className="text-[#2A2A2E]">•</span>
                <a
                  href={`mailto:${agent.email}`}
                  className="text-xs text-[#C5C5C5] hover:text-white"
                >
                  {agent.email}
                </a>
              </div>
              {/* Botões de Ação */}
              <div className="mt-4 flex flex-wrap gap-3">
                {agent.whatsapp ? (
                  <a
                    href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}?text=Olá ${agent.name.split(' ')[0]}, vi o seu perfil no site Imóveis Mais e gostaria de mais informações.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#20BD5A]"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                ) : (
                  <a
                    href={`mailto:${agent.email}?subject=Contacto via Imóveis Mais`}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#B80500]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar Mensagem
                  </a>
                )}
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E10600] px-4 py-2 text-xs font-semibold text-[#E10600] transition hover:bg-[#E10600]/10"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Ligar Agora
                  </a>
                )}
                {/* Redes Sociais */}
                {agent.instagram && (
                  <a
                    href={agent.instagram.startsWith('http') ? agent.instagram : `https://instagram.com/${agent.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white transition hover:scale-110"
                    title="Instagram"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {agent.facebook && (
                  <a
                    href={agent.facebook.startsWith('http') ? agent.facebook : `https://facebook.com/${agent.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] text-white transition hover:scale-110"
                    title="Facebook"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {agent.linkedin && (
                  <a
                    href={agent.linkedin.startsWith('http') ? agent.linkedin : `https://linkedin.com/in/${agent.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A66C2] text-white transition hover:scale-110"
                    title="LinkedIn"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
              </div>
              {/* Bio do Agente */}
              {agent.bio && (
                <p className="mt-4 max-w-xl text-sm text-[#C5C5C5] line-clamp-2">
                  {agent.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="space-y-12 pb-16">
        <HeroCarousel properties={heroProperties} />

        {/* ✅ Seção de Membros da Equipa */}
        {teamConfig && (
          <section className="mx-auto max-w-6xl space-y-6 px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">
                Equipa {agents.find(a => a.id === teamConfig.teamLeader)?.name.split(' ')[0]}
              </p>
              <h2 className="text-xl font-semibold md:text-3xl">
                Consultores da Equipa
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents
                .filter(a => teamConfig.members.includes(a.id) && a.id !== agent.id)
                .map((member) => (
                  <Link
                    key={member.id}
                    href={`/agentes/${normalizeSlug(member.name)}`}
                    className="flex items-center gap-4 rounded-xl border border-[#2A2A2E] bg-[#151518] p-4 transition hover:border-[#E10600]/50"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#E10600]/30">
                      <Image
                        src={member.avatar || `/avatars/${normalizeSlug(member.name)}.png`}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{member.name}</p>
                      {member.id === teamConfig.teamLeader && (
                        <p className="text-xs text-[#E10600]">Chefe de Equipa</p>
                      )}
                      <p className="text-xs text-[#C5C5C5]">{member.phone || member.email}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <section className="space-y-12">
          {rails.map(
            (rail) =>
              rail.items.length > 0 && (
                <div key={rail.title} className="space-y-4 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">{rail.title.includes("Top") ? "Top 10" : "Coleção"}</p>
                      <h3 className="text-lg font-semibold md:text-2xl">
                        {rail.title} <span className="text-sm text-[#666]">({rail.totalItems} imóveis)</span>
                      </h3>
                    </div>
                    {rail.totalItems > MAX_ITEMS_PER_RAIL && (
                      <Link
                        href={teamConfig 
                          ? `/imoveis?team=${encodeURIComponent(teamConfig.members.join(','))}${rail.filterQuery ? '&' + rail.filterQuery.slice(1) : ''}`
                          : `/imoveis?agent_id=${agent.id}${rail.filterQuery ? '&' + rail.filterQuery.slice(1) : ''}`
                        }
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

        {teamMembers.length > 0 && (
          <section className="mx-auto max-w-6xl space-y-6 px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">
                Equipa Imóveis Mais
              </p>
              <h2 className="text-xl font-semibold md:text-3xl">
                Consultores e Equipa de Apoio
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {teamMembers.map((member) => (
                <Link
                  key={member.id}
                  href={member.isAgent ? `/agentes/${normalizeSlug(member.name)}` : '#'}
                  className={`flex items-center gap-4 rounded-xl border border-[#2A2A2E] bg-[#151518] p-4 transition ${
                    member.isAgent ? 'hover:border-[#E10600]/50' : 'cursor-default'
                  }`}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={member.avatar || "/avatars/placeholder.png"}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{member.name}</h4>
                    <p className="text-sm text-[#E10600]">{member.role}</p>
                    {member.phone && (
                      <p className="text-sm text-[#C5C5C5]">{member.phone}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 rounded-3xl border border-[#2A2A2E] bg-gradient-to-br from-[#0F0F10] to-[#070708] p-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">Contacto direto</p>
              <h2 className="text-xl font-semibold md:text-3xl">Fale com {agent.name.split(" ")[0]}</h2>
              <p className="text-sm text-[#C5C5C5]">
                Tem questões sobre um imóvel ou pretende agendar uma visita? 
                Preencha o formulário e entrarei em contacto consigo brevemente.
              </p>
            </div>
            <LeadForm source={`agent-${agent.name}`} title="Quero ser contactado" cta="Enviar mensagem" />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#111113] bg-[#050506] px-6 py-8 text-sm text-[#C5C5C5]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">Microsite de {agent.name}</p>
            <p>Imóveis Mais • Powered by CRM PLUS</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/contactos" className="hover:text-white">Contactos</Link>
            <Link href="/imoveis" className="hover:text-white">Ver todos os imóveis</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
