import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAgents, getProperties } from "../../../src/services/publicApi";
import { BrandImage } from "../../../components/BrandImage";
import { CarouselHorizontal } from "../../../components/CarouselHorizontal";
import { LeadForm } from "../../../components/LeadForm";
import { getPropertyCover } from "../../../src/utils/placeholders";
import { optimizeAvatarUrl } from "../../../src/lib/cloudinary";

type Props = { params: { slug: string } };

// Função para normalizar nome (remover acentos e caracteres especiais)
function normalizeForFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "-"); // Espaços por hífens
}

// Staff assistentes relacionados com agentes
const assistantMap: Record<string, { name: string; role: string; phone: string; avatar: string }> = {
  "tiago-vindima": {
    name: "Ana Vindima",
    role: "Assistente",
    phone: "918 503 014",
    avatar: "/avatars/ana-vindima.png",
  },
  "bruno-libanio": {
    name: "Cláudia Libânio",
    role: "Assistente",
    phone: "912 118 911",
    avatar: "/avatars/claudia-libanio.png",
  },
};

// Função para obter as iniciais do nome do agente (ex: "Tiago Vindima" -> "TV")
function getAgentInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

// Função para filtrar propriedades do agente pelas iniciais da referência
function filterAgentProperties(properties: any[], agentName: string): any[] {
  const initials = getAgentInitials(agentName);
  return properties.filter((p) => {
    const ref = (p.reference || "").toUpperCase();
    return ref.startsWith(initials);
  });
}

export default async function AgentMiniSite({ params }: Props) {
  const agents = await getAgents(50);
  const properties = await getProperties(500);

  // Normalizar o slug recebido para comparação
  const normalizedSlug = normalizeForFilename(decodeURIComponent(params.slug));

  // Encontrar agente pelo slug normalizado
  const agent = agents.find((a) => normalizeForFilename(a.name) === normalizedSlug);

  if (!agent) notFound();

  // Filtrar propriedades do agente pelo agent_id (não por iniciais)
  const agentProperties = properties.filter((p) => p.agent_id === agent.id);

  // Verificar se tem assistente (usando slug normalizado sem acentos)
  const slugKey = normalizeForFilename(agent.name);
  const assistant = assistantMap[slugKey];

  // Encontrar membros da equipa (se o agente tiver equipa)
  const teamMembers = agent.team
    ? agents.filter((a) => a.team === agent.team && a.id !== agent.id)
    : [];

  return (
    <div className="min-h-screen bg-[#050506]">
      {/* Agent Header Banner */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E10600]/20 via-[#0B0B0D] to-[#0B0B0D]" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-12">
          <Link
            href="/agentes"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#C5C5C5] transition hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar à equipa
          </Link>

          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            {/* Agent Avatar */}
            <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-[#E10600]/30 md:h-56 md:w-56">
              <Image
                src={optimizeAvatarUrl(agent.photo) || agent.avatar_url || `/avatars/${normalizeForFilename(agent.name)}.png`}
                alt={agent.name}
                fill
                className="object-cover"
                sizes="224px"
                priority
              />
            </div>

            {/* Agent Info */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#E10600]">Consultor Imobiliário</p>
                <h1 className="text-4xl font-bold text-white md:text-5xl">{agent.name}</h1>
                {agent.team && (
                  <p className="mt-2 text-[#C5C5C5]">Equipa {agent.team}</p>
                )}
              </div>

              {/* Contact buttons */}
              <div className="flex flex-wrap gap-3">
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 rounded-full bg-[#E10600] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C10500]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {agent.phone}
                  </a>
                )}
                {agent.phone && (
                  <a
                    href={`https://wa.me/351${agent.phone.replace(/\D/g, "").replace(/^351/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-green-500 px-5 py-2.5 text-sm font-semibold text-green-500 transition hover:bg-green-500 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-2 rounded-full border border-[#2A2A2E] px-5 py-2.5 text-sm font-semibold text-[#C5C5C5] transition hover:border-white hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {agent.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-12">
        {/* Properties Section */}
        {agentProperties.length > 0 && (
          <section className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">Portefólio</p>
              <h2 className="text-2xl font-semibold text-white">Imóveis de {agent.name.split(" ")[0]}</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agentProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/imovel/${encodeURIComponent(property.reference || property.title || "")}`}
                  className="group overflow-hidden rounded-2xl border border-[#2A2A2E] bg-[#151518] transition hover:border-[#E10600]/50"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={getPropertyCover(property)}
                      alt={property.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute left-3 top-3 flex gap-2">
                      {property.typology && (
                        <span className="rounded-full bg-[#E10600] px-3 py-1 text-xs font-semibold text-white">
                          {property.typology}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="font-semibold text-white transition group-hover:text-[#E10600]">
                      {property.title || property.reference}
                    </h3>
                    <p className="text-sm text-[#C5C5C5]">
                      {property.location || property.municipality || "Localização não disponível"}
                    </p>
                    <p className="text-lg font-bold text-[#E10600]">
                      {property.price
                        ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
                        : "Sob consulta"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Team Section */}
        {(assistant || teamMembers.length > 0) && (
          <section className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">Equipa</p>
              <h2 className="text-2xl font-semibold text-white">
                A equipa de {agent.name.split(" ")[0]}
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Assistant */}
              {assistant && (
                <div className="flex items-center gap-4 rounded-xl border border-[#2A2A2E] bg-[#151518] p-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={assistant.avatar}
                      alt={assistant.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{assistant.name}</h4>
                    <p className="text-sm text-[#E10600]">{assistant.role}</p>
                    <a
                      href={`tel:${assistant.phone.replace(/\s/g, "")}`}
                      className="text-sm text-[#C5C5C5] hover:text-white"
                    >
                      {assistant.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Team members */}
              {teamMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/agentes/${member.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-4 rounded-xl border border-[#2A2A2E] bg-[#151518] p-4 transition hover:border-[#E10600]/50"
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
                    <p className="text-sm text-[#E10600]">Consultor</p>
                    {member.phone && (
                      <p className="text-sm text-[#C5C5C5]">{member.phone}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Contact Form */}
        <section className="grid gap-8 rounded-3xl border border-[#2A2A2E] bg-gradient-to-br from-[#151518] to-[#0B0B0D] p-6 md:grid-cols-2 md:p-10">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#E10600]">Contacto Direto</p>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
              Fale diretamente com {agent.name.split(" ")[0]}
            </h2>
            <p className="text-[#C5C5C5]">
              Tem questões sobre um imóvel ou pretende agendar uma visita? 
              Preencha o formulário e entrarei em contacto consigo brevemente.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#E10600]">
                <Image
                  src={agent.avatar || `/avatars/${normalizeForFilename(agent.name)}.png`}
                  alt={agent.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <p className="font-semibold text-white">{agent.name}</p>
                <p className="text-sm text-[#C5C5C5]">Consultor Imobiliário</p>
              </div>
            </div>
          </div>
          <LeadForm 
            source={`agent-${agent.name}`} 
            title="Enviar mensagem" 
            cta="Enviar" 
          />
        </section>
      </div>

      {/* Footer with branding */}
      <footer className="border-t border-[#2A2A2E] bg-[#0B0B0D] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center">
          <div className="flex items-center gap-3">
            <BrandImage
              src="/brand/agency-logo.svg"
              alt="Imóveis Mais"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div>
              <p className="text-sm font-semibold text-white">Imóveis Mais</p>
              <p className="text-xs text-[#7A7A7A]">Powered by CRM PLUS</p>
            </div>
          </div>
          <p className="text-sm text-[#7A7A7A]">
            Microsite de {agent.name} • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
