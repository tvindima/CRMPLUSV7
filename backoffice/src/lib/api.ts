/**
 * Configuração centralizada para chamadas à API
 * Garante que o tenant slug é passado em todas as requests
 */

// API base URL - cada deploy tem a sua própria URL de backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';

// Tenant slug - OBRIGATÓRIO em cada deploy da Vercel
// Imóveis Mais: NEXT_PUBLIC_TENANT_SLUG=imoveismais
// Luis Gaspar: NEXT_PUBLIC_TENANT_SLUG=luisgaspar
export const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || '';

// Cookie name for session
export const SESSION_COOKIE = 'crmplus_staff_session';

/**
 * Get headers for API calls including tenant slug
 */
export function getApiHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // CRITICAL: Always include tenant slug for multi-tenancy isolation
  if (TENANT_SLUG) {
    headers['X-Tenant-Slug'] = TENANT_SLUG;
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Fetch with tenant headers - for server-side API routes
 */
export async function fetchWithTenant(
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const headers = getApiHeaders(token);
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

/**
 * Build full API URL
 */
export function buildApiUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const baseUrl = `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  
  if (!params) return baseUrl;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
