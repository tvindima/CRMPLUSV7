import { getAgents, getStaff } from "../../src/services/publicApi";
import { TeamMember } from "../../components/TeamCarousel";
import { TeamPageClient } from "../../components/TeamPageClient";
import { optimizeAvatarUrl, optimizeStaffAvatarUrl } from "../../src/lib/cloudinary";

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

export default async function EquipaPage() {
  const [agents, staffData] = await Promise.all([
    getAgents(50),
    getStaff()
  ]);

  // Converter agentes da API para o formato TeamMember e ordenar alfabeticamente
  const agentMembers: TeamMember[] = agents
    .filter((a) => a.name !== "Imóveis Mais Leiria") // Excluir a agência
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: "Consultor", // Será ajustado no cliente baseado no sector
      phone: agent.phone,
      avatar: optimizeAvatarUrl(agent.photo) || agent.avatar || `/avatars/${normalizeForFilename(agent.name)}.png`,
      email: agent.email,
      isAgent: true,
      team: agent.team,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')); // Ordenar por nome alfabeticamente

  // Converter staff da API para o formato TeamMember (com remoção de fundo automática)
  const staffMembers: TeamMember[] = staffData.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    phone: s.phone || undefined,
    avatar: optimizeStaffAvatarUrl(s.avatar_url) || `/avatars/${s.id}.png`,
    email: s.email || undefined,
    isAgent: false,
  }));

  return <TeamPageClient agentMembers={agentMembers} staffMembers={staffMembers} />;
}
  );
}
