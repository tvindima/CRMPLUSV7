import { getAgents } from "../../src/services/publicApi";
import TeamCarousel, { TeamMember } from "../../components/TeamCarousel";
import { optimizeAvatarUrl } from "../../src/lib/cloudinary";

// Revalidar esta página a cada 60 segundos
export const revalidate = 60;

// Função para normalizar nome (remover acentos e caracteres especiais)
function normalizeForFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "-"); // Espaços por hífens
}

// Staff members (não são agentes, não têm página individual)
// Last updated: 2025-12-16 15:20 - Forcing rebuild for avatar deployment
const staffMembers: TeamMember[] = [
  {
    id: 19,
    name: "Ana Vindima",
    role: "Assistente de Tiago Vindima",
    phone: "918 503 014",
    avatar: "/avatars/19.png",
    isAgent: false,
  },
  {
    id: 20,
    name: "Maria Olaio",
    role: "Diretora Financeira",
    phone: "244 001 003",
    avatar: "/avatars/20.png",
    isAgent: false,
  },
  {
    id: 21,
    name: "Andreia Borges",
    role: "Assistente Administrativa",
    phone: "244 001 004",
    avatar: "/avatars/21.png",
    isAgent: false,
  },
  {
    id: 22,
    name: "Sara Ferreira",
    role: "Assistente Administrativa",
    phone: "244 001 002",
    avatar: "/avatars/22.png",
    isAgent: false,
  },
  {
    id: 23,
    name: "Cláudia Libânio",
    role: "Assistente de Bruno Libânio",
    phone: "912 118 911",
    avatar: "/avatars/23.png",
    isAgent: false,
  },
];

export default async function EquipaPage() {
  const agents = await getAgents(50);

  // Converter agentes da API para o formato TeamMember e ordenar alfabeticamente
  const agentMembers: TeamMember[] = agents
    .filter((a) => a.name !== "Imóveis Mais Leiria") // Excluir a agência
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: "Consultor Imobiliário",
      phone: agent.phone,
      avatar: optimizeAvatarUrl(agent.photo) || agent.avatar || `/avatars/${normalizeForFilename(agent.name)}.png`,
      email: agent.email,
      isAgent: true,
      team: agent.team,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')); // Ordenar por nome alfabeticamente

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[#E10600]">A Nossa Equipa</p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-5xl">
          Profissionais dedicados ao seu sucesso
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[#C5C5C5]">
          Conheça os consultores e colaboradores que fazem da Imóveis Mais uma referência no mercado imobiliário.
          Cada membro da nossa equipa está comprometido em proporcionar-lhe a melhor experiência.
        </p>
      </section>

      {/* Consultores Carousel */}
      <TeamCarousel
        eyebrow="Consultores"
        title="Os nossos agentes imobiliários"
        members={agentMembers}
      />

      {/* Staff Carousel */}
      <TeamCarousel
        eyebrow="Backoffice"
        title="Equipa de suporte"
        members={staffMembers}
      />

      {/* CTA Section */}
      <section className="rounded-3xl border border-[#2A2A2E] bg-gradient-to-br from-[#151518] to-[#0B0B0D] p-8 text-center md:p-12">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          Quer fazer parte da nossa equipa?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[#C5C5C5]">
          Estamos sempre à procura de talentos para se juntarem à família Imóveis Mais.
          Se tem paixão pelo imobiliário, entre em contacto connosco.
        </p>
        <a
          href="/contactos"
          className="mt-6 inline-block rounded-full bg-[#E10600] px-6 py-2.5 font-semibold text-white transition hover:bg-[#C10500] md:px-8 md:py-3"
        >
          Contacte-nos
        </a>
      </section>
    </div>
  );
}
