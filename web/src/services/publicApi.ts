/**
 * Public API service for fetching tenant-specific data
 * Uses internal proxy route to handle tenant headers server-side
 */

// Use internal proxy in production, direct API in development
const API_BASE = typeof window !== 'undefined' 
  ? '/api/proxy'  // Client-side: use internal proxy
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app');

const PUBLIC_MEDIA_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";

export type Property = {
  id: number;
  title: string;
  price: number | null;
  location: string | null;
  status: string | null;
  agent_id: number | null;
  area: number | null;
  reference?: string | null;
  business_type?: string | null;
  property_type?: string | null;
  typology?: string | null;
  usable_area?: number | null;
  condition?: string | null;
  description?: string | null;
  observations?: string | null;
  images?: string[] | null;
  video_url?: string | null;
  municipality?: string | null;
  parish?: string | null;
  energy_certificate?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  is_published?: boolean;
  is_featured?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Agent = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  team?: string | null;
  avatar?: string | null;
  photo?: string | null;
  license_ami?: string | null;
  bio?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  whatsapp?: string | null;
};

/**
 * Get tenant slug from cookie (client-side only)
 */
function getTenantSlugFromCookie(): string {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/tenant_slug=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return 'imoveismais';
}

/**
 * Build headers for API requests
 * On client-side, include tenant header (proxy will also add it server-side)
 */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Client-side: add tenant header
  if (typeof window !== 'undefined') {
    headers['X-Tenant-Slug'] = getTenantSlugFromCookie();
  }
  
  return headers;
}

async function fetchJson<T>(path: string): Promise<T> {
  // For SSR, we need to use the proxy route with full URL
  const baseUrl = typeof window !== 'undefined' 
    ? '/api/proxy' 
    : `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/proxy`;
  
  const url = `${baseUrl}${path}`;
  
  const res = await fetch(url, { 
    next: { revalidate: 30 },
    headers: buildHeaders(),
  });
  
  if (!res.ok) {
    throw new Error(`Erro ao chamar ${path}: ${res.status}`);
  }
  return (await res.json()) as T;
}

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/media")) {
    return `${PUBLIC_MEDIA_BASE}${url}`;
  }
  return url;
};

const normalizeVideoUrl = (url?: string | null): string | null => {
  if (!url) return null;
  
  const studioMatch = url.match(/studio\.youtube\.com\/video\/([a-zA-Z0-9_-]+)/);
  if (studioMatch) {
    return `https://www.youtube.com/watch?v=${studioMatch[1]}`;
  }
  
  return resolveImageUrl(url);
};

const normalizeProperty = (property: Property): Property => {
  const images = property.images
    ?.map((img) => resolveImageUrl(img))
    .filter((img): img is string => Boolean(img));
  
  const video_url = normalizeVideoUrl(property.video_url);
  
  let bedrooms = property.bedrooms;
  if (bedrooms === undefined && property.typology) {
    const match = property.typology.match(/T(\d+)/);
    if (match) {
      bedrooms = parseInt(match[1], 10);
    }
  }
  
  const area = property.area ?? property.usable_area ?? null;
  
  return { 
    ...property, 
    images,
    video_url,
    bedrooms,
    area,
  };
};

export async function getProperties(limit = 500): Promise<Property[]> {
  try {
    const pageSize = Math.max(1, Math.min(limit, 500));
    const results: Property[] = [];
    let skip = 0;

    while (true) {
      const data = await fetchJson<Property[]>(`/properties/?is_published=1&skip=${skip}&limit=${pageSize}`);
      if (!Array.isArray(data) || data.length === 0) break;
      results.push(...data.map(normalizeProperty));
      if (data.length < pageSize) break;
      skip += pageSize;
    }

    console.log(`[API] Successfully fetched ${results.length} published properties`);
    return results;
  } catch (error) {
    console.error("[API] Backend connection failed:", error);
    return [];
  }
}

export async function getPropertyByReference(reference: string): Promise<Property | null> {
  const list = await getProperties(500);
  const match = list.find((p) => 
    (p.reference?.toLowerCase() === reference.toLowerCase()) ||
    (p.title?.toLowerCase() === reference.toLowerCase())
  );
  return match || null;
}

export async function getAgents(limit = 50): Promise<Agent[]> {
  try {
    const data = await fetchJson<Agent[]>(`/agents/?limit=${limit}`);
    return data;
  } catch (error) {
    console.error("[API] Failed to fetch agents:", error);
    return [];
  }
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  works_for_agent_id: number | null;
}

export async function getStaff(): Promise<StaffMember[]> {
  try {
    const data = await fetchJson<StaffMember[]>(`/agents/staff`);
    return data;
  } catch (error) {
    console.error("[API] Failed to fetch staff:", error);
    return [];
  }
}

export async function getAgentById(id: number): Promise<Agent | null> {
  try {
    const data = await fetchJson<Agent>(`/agents/${id}`);
    return data;
  } catch (error) {
    console.error(`[getAgentById] Agent ${id} not found:`, error);
    return null;
  }
}

export async function getAgentProperties(agentId: number, limit = 200): Promise<Property[]> {
  const all = await getProperties(limit);
  return all.filter((p) => p.agent_id === agentId);
}

export { API_BASE };
