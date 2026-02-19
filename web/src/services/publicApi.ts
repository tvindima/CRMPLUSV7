/**
 * Public API service for fetching tenant-specific data
 * Works in both Server Components (SSR) and Client Components
 */
import { stripCloudinaryOverlayLayers } from "../lib/cloudinary";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';
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
 * Get tenant slug - MUST work in both server and client contexts
 * WITHOUT using next/headers (which breaks client components)
 */
async function getTenantSlug(): Promise<string> {
  // Server-side: dynamically import next/headers
  if (typeof window === 'undefined') {
    try {
      const { cookies, headers } = await import('next/headers');
      
      // Try cookie first
      try {
        const cookieStore = await cookies();
        const tenantCookie = cookieStore.get('tenant_slug');
        if (tenantCookie?.value) {
          return tenantCookie.value;
        }
      } catch (e) {}
      
      // Try headers
      try {
        const headersList = await headers();
        
        // x-tenant-slug header
        const tenantHeader = headersList.get('x-tenant-slug');
        if (tenantHeader) {
          return tenantHeader;
        }
        
        // Extract from host
        const host = headersList.get('host');
        if (host) {
          if (host.endsWith('.crmplus.trioto.tech') && !host.includes('.bo.')) {
            const slug = host.replace('.crmplus.trioto.tech', '').split(':')[0];
            if (slug) return slug;
          }
          if (host.includes('imoveismais')) return 'imoveismais';
          if (host.includes('luiscarlosgaspar') || host.includes('luisgaspar.pt')) return 'luisgaspar';
        }
      } catch (e) {}
    } catch (e) {
      // Dynamic import failed
    }
  }
  
  // Client-side: read from cookie
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/tenant_slug=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  
  // Fallback
  return process.env.NEXT_PUBLIC_TENANT_SLUG || 'imoveismais';
}

async function fetchJson<T>(path: string): Promise<T> {
  const tenantSlug = await getTenantSlug();
  const url = `${BACKEND_URL}${path}`;
  
  console.log(`[publicApi] Fetching ${path} for tenant: ${tenantSlug}`);
  
  const res = await fetch(url, { 
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': tenantSlug,
    },
  });
  
  if (!res.ok) {
    throw new Error(`Erro ao chamar ${path}: ${res.status}`);
  }
  return (await res.json()) as T;
}

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return stripCloudinaryOverlayLayers(url);
  if (url.startsWith("/media")) {
    return stripCloudinaryOverlayLayers(`${PUBLIC_MEDIA_BASE}${url}`);
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

export const API_BASE = BACKEND_URL;
