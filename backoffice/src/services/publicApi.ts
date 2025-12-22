const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
import { mockProperties } from "../mocks/properties";
import { mockAgents } from "../mocks/agents";

export type Property = {
  id: number;
  title: string;
  price: number | null;
  area: number | null;
  location: string | null;
  status: string | null;
  reference?: string | null;
  business_type?: string | null;
  property_type?: string | null;
  typology?: string | null;
  usable_area?: number | null;
  condition?: string | null;
  images?: string[] | null;
  municipality?: string | null;
  parish?: string | null;
  energy_certificate?: string | null;
};

export type Agent = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  team?: string | null;
  avatar?: string | null;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) {
    throw new Error(`Erro ao chamar ${path}: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getProperties(limit = 100): Promise<Property[]> {
  try {
    const data = await fetchJson<Property[]>(`/properties/?limit=${limit}`);
    return data;
  } catch (error) {
    console.warn("Fallback para mocks de propriedades", error);
    return mockProperties;
  }
}

export async function getPropertyByTitle(title: string): Promise<Property | null> {
  const list = await getProperties(200);
  const match = list.find((p) => p.title.toLowerCase() === title.toLowerCase());
  return match || null;
}

export async function getAgents(limit = 50): Promise<Agent[]> {
  try {
    const data = await fetchJson<Agent[]>(`/agents/?limit=${limit}`);
    return data;
  } catch (error) {
    console.warn("Fallback para mocks de agentes", error);
    return mockAgents;
  }
}

export { API_BASE };
