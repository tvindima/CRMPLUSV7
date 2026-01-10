/**
 * API Helper centralizado para o Backoffice
 * CRITICAL: Inclui X-Tenant-Slug em todas as chamadas para isolamento multi-tenant
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';
export const SESSION_COOKIE = 'crmplus_staff_session';
export const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || '';

/**
 * Obtém o tenant slug - primeiro do cookie, depois da env var
 */
export function getTenantSlug(): string {
  // Client-side: tentar ler do cookie
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'tenant_slug' && value) {
        return value;
      }
    }
  }
  // Fallback para variável de ambiente (deploys dedicados)
  return TENANT_SLUG;
}

/**
 * Retorna os headers padrão para chamadas API incluindo X-Tenant-Slug
 */
export function getApiHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // CRITICAL: Sempre incluir X-Tenant-Slug para isolamento multi-tenant
  const tenantSlug = getTenantSlug();
  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Faz uma chamada GET à API com headers corretos
 */
export async function apiGet(endpoint: string, token?: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getApiHeaders(token),
    cache: 'no-store',
  });
  return response;
}

/**
 * Faz uma chamada POST à API com headers corretos
 */
export async function apiPost(endpoint: string, body: any, token?: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(token),
    body: JSON.stringify(body),
  });
  return response;
}

/**
 * Faz uma chamada PUT à API com headers corretos
 */
export async function apiPut(endpoint: string, body: any, token?: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: getApiHeaders(token),
    body: JSON.stringify(body),
  });
  return response;
}

/**
 * Faz uma chamada DELETE à API com headers corretos
 */
export async function apiDelete(endpoint: string, token?: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getApiHeaders(token),
  });
  return response;
}
