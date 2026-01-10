/**
 * Server-side API helpers para API routes do Next.js
 * CRITICAL: Este ficheiro é para uso EXCLUSIVO em API routes (server-side)
 * Para código client-side, usar lib/api.ts
 */

import { cookies } from 'next/headers';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';
export const SESSION_COOKIE = 'crmplus_staff_session';
export const TENANT_COOKIE = 'tenant_slug';

/**
 * Obtém o token de autenticação do cookie
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

/**
 * Obtém o tenant slug do cookie (definido pelo middleware)
 * Fallback para variável de ambiente (deploys dedicados)
 */
export async function getTenantSlug(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(TENANT_COOKIE)?.value || process.env.NEXT_PUBLIC_TENANT_SLUG || '';
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
