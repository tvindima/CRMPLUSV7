/**
 * Server-side API helpers para API routes do Next.js
 * CRITICAL: Este ficheiro é para uso EXCLUSIVO em API routes (server-side)
 * Para código client-side, usar lib/api.ts
 */

import { cookies, headers } from 'next/headers';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';
export const SESSION_COOKIE = 'crmplus_staff_session';
export const TENANT_COOKIE = 'tenant_slug';

const WILDCARD_PATTERN = ".bo.crmplus.trioto.tech";
const DEDICATED_DOMAIN_MAPPING: Record<string, string> = {
  "backoffice.luisgaspar.pt": "luisgaspar",
  "backoffice.luiscarlosgaspar.com": "luisgaspar",
  "backoffice.imoveismais.com": "imoveismais",
  "app.imoveismais.com": "imoveismais",
};

function extractTenantFromHost(hostValue: string | null): string | null {
  if (!hostValue) return null;
  const hostname = hostValue.split(",")[0].trim().split(":")[0];
  if (!hostname) return null;

  if (DEDICATED_DOMAIN_MAPPING[hostname]) {
    return DEDICATED_DOMAIN_MAPPING[hostname];
  }

  if (hostname.endsWith(WILDCARD_PATTERN)) {
    const slug = hostname.replace(WILDCARD_PATTERN, "");
    if (slug) return slug;
  }

  return null;
}

/**
 * Obtém o token de autenticação do cookie
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback: parse raw cookie header if cookies() is empty in this context
  const rawCookie = (await headers()).get('cookie') || '';
  const match = rawCookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Obtém o tenant slug do cookie (definido pelo middleware)
 * Fallback para variável de ambiente (deploys dedicados)
 */
export async function getTenantSlug(): Promise<string> {
  const cookieStore = await cookies();
  const cookieTenant = cookieStore.get(TENANT_COOKIE)?.value;
  if (cookieTenant) return cookieTenant;

  const reqHeaders = await headers();
  const hostTenant =
    extractTenantFromHost(reqHeaders.get("x-forwarded-host")) ||
    extractTenantFromHost(reqHeaders.get("host"));

  if (hostTenant) return hostTenant;

  return process.env.NEXT_PUBLIC_TENANT_SLUG || '';
}

/**
 * Constrói headers para chamadas ao backend Railway
 * CRITICAL: Sempre inclui X-Tenant-Slug para isolamento multi-tenant
 */
export async function getServerApiHeaders(token?: string): Promise<Record<string, string>> {
  const tenantSlug = await getTenantSlug();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // CRITICAL: Sempre incluir tenant para isolamento de dados
  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Faz uma chamada GET ao backend com headers corretos
 */
export async function serverApiGet(endpoint: string, token?: string): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getServerApiHeaders(token);
  
  return fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
}

/**
 * Faz uma chamada POST ao backend com headers corretos
 */
export async function serverApiPost(endpoint: string, body: any, token?: string): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getServerApiHeaders(token);
  
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Faz uma chamada PUT ao backend com headers corretos
 */
export async function serverApiPut(endpoint: string, body: any, token?: string): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getServerApiHeaders(token);
  
  return fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Faz uma chamada PATCH ao backend com headers corretos
 */
export async function serverApiPatch(endpoint: string, body: any, token?: string): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getServerApiHeaders(token);
  
  return fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Faz uma chamada PATCH ao backend SEM body (para query params)
 */
export async function serverApiPatchNoBody(endpoint: string, token?: string): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getServerApiHeaders(token);
  
  return fetch(url, {
    method: 'PATCH',
    headers,
  });
}

/**
 * Faz uma chamada DELETE ao backend com headers corretos
 */
export async function serverApiDelete(endpoint: string, token?: string): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getServerApiHeaders(token);
  
  return fetch(url, {
    method: 'DELETE',
    headers,
  });
}
