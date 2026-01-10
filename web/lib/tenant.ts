/**
 * Utility functions for tenant detection in the public site (web)
 */

/**
 * Get tenant slug from cookie (client-side)
 */
export function getTenantSlugFromCookie(): string {
  if (typeof document === 'undefined') {
    return 'imoveismais'; // SSR fallback
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'tenant_slug' && value) {
      return decodeURIComponent(value);
    }
  }
  
  return 'imoveismais'; // Default fallback
}

/**
 * Get API URL with tenant header
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';
}

/**
 * Create fetch headers with tenant identification
 */
export function createTenantHeaders(additionalHeaders?: HeadersInit): Headers {
  const headers = new Headers(additionalHeaders);
  const tenantSlug = getTenantSlugFromCookie();
  
  headers.set('X-Tenant-Slug', tenantSlug);
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  return headers;
}

/**
 * Fetch wrapper that automatically includes tenant identification
 */
export async function tenantFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = getApiUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;
  
  const headers = createTenantHeaders(options.headers);
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Server-side: Get tenant slug from cookies in server components
 * Must be used with next/headers
 */
export async function getServerTenantSlug(): Promise<string> {
  // Dynamic import to avoid issues in client components
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('tenant_slug')?.value || 'imoveismais';
}
