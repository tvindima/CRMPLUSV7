const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type DashboardKPIs = {
  propriedades_ativas: number;
  novas_leads_7d: number;
  propostas_abertas: number;
  agentes_ativos: number;
  visitas_agendadas?: number; // Opcional para dashboard de agente
  trends: {
    propriedades: string;
    propriedades_up: boolean;
    leads: string;
    leads_up: boolean;
    propostas: string;
    propostas_up: boolean;
  };
};

export type DistributionItem = {
  label: string;
  value: number;
  color?: string;
};

export type AgentRanking = {
  id: number;
  name: string;
  avatar: string;
  role: string;
  leads: number;
  propostas: number;
  visitas: number;
  performance: number;
  rank: number;
};

export type RecentLead = {
  id: number;
  cliente: string;
  tipo: string;
  status: string;
  responsavel: string | null;
  responsavel_id: number | null;
  tempo: string;
  timestamp: string;
};

export type Task = {
  id: number;
  tipo: string;
  titulo: string;
  responsavel: string;
  hora: string;
  urgente: boolean;
};

export type Activity = {
  id: string;
  user: string;
  avatar: string;
  acao: string;
  tipo: string;
  time: string;
  timestamp: string;
};

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  // Chama o proxy local do Next.js que vai fazer a chamada ao Railway
  const res = await fetch('/api/dashboard/kpis', {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard KPIs");
  return res.json();
}

export async function getPropertiesByConcelho(): Promise<DistributionItem[]> {
  const res = await fetch('/api/dashboard/distribution/concelho', {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch properties by concelho");
  return res.json();
}

export async function getPropertiesByTipologia(): Promise<DistributionItem[]> {
  const res = await fetch('/api/dashboard/distribution/tipologia', {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch properties by tipologia");
  return res.json();
}

export async function getPropertiesByStatus(): Promise<DistributionItem[]> {
  const res = await fetch('/api/dashboard/distribution/status', {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch properties by status");
  return res.json();
}

export async function getAgentsRanking(): Promise<AgentRanking[]> {
  const res = await fetch('/api/dashboard/agents/ranking', {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch agents ranking");
  return res.json();
}

export async function getRecentLeads(limit: number = 10): Promise<RecentLead[]> {
  const res = await fetch(`/api/dashboard/leads/recent?limit=${limit}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch recent leads");
  return res.json();
}

export async function assignLeadToAgent(leadId: number, agentId: number): Promise<any> {
  const res = await fetch(`/api/dashboard/leads/${leadId}/assign?agent_id=${agentId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to assign lead");
  return res.json();
}

export async function distributeLeadsAuto(
  strategy: "round-robin" | "performance-based" | "workload-balanced" = "round-robin",
  leadIds?: number[]
): Promise<any> {
  const body: any = { strategy };
  if (leadIds) body.lead_ids = leadIds;
  
  const res = await fetch('/api/dashboard/leads/distribute/auto', {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to distribute leads");
  return res.json();
}

export async function getTodayTasks(): Promise<Task[]> {
  const res = await fetch('/api/dashboard/tasks/today', {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch today's tasks");
  return res.json();
}

export async function getRecentActivities(limit: number = 10): Promise<Activity[]> {
  const res = await fetch(`/api/dashboard/activities/recent?limit=${limit}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch recent activities");
  return res.json();
}

// ==================== AGENT-SPECIFIC FUNCTIONS ====================

export async function getAgentKPIs(): Promise<DashboardKPIs> {
  const res = await fetch(`/api/dashboard/agent/kpis`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch agent KPIs");
  return res.json();
}

export async function getAgentLeads(limit: number = 10): Promise<RecentLead[]> {
  const res = await fetch(`/api/dashboard/agent/leads?limit=${limit}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch agent leads");
  return res.json();
}

export async function getAgentTasks(): Promise<Task[]> {
  const res = await fetch(`/api/dashboard/agent/tasks`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch agent tasks");
  return res.json();
}

export async function getAgentActivities(limit: number = 10): Promise<Activity[]> {
  const res = await fetch(`/api/dashboard/agent/activities?limit=${limit}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch agent activities");
  return res.json();
}
