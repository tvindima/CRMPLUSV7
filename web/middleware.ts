import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware para:
 * 1. Detectar o tenant a partir do hostname e definir cookie
 * 2. Proteger rotas /backoffice (legado)
 * 
 * Padrões de tenant suportados:
 * - {slug}.crmplus.trioto.tech → tenant = slug (trial domains)
 * - www.imoveismais.com → tenant = imoveismais (custom domain)
 * - luiscarlosgaspar.com → tenant = luiscarlosgaspar (custom domain)
 * - localhost:3002 → usa NEXT_PUBLIC_TENANT_SLUG ou 'imoveismais'
 */

// Mapeamento de domínios custom para slugs
const DOMAIN_TO_TENANT: Record<string, string> = {
  'www.imoveismais.com': 'imoveismais',
  'imoveismais.com': 'imoveismais',
  'www.luiscarlosgaspar.com': 'luiscarlosgaspar',
  'luiscarlosgaspar.com': 'luiscarlosgaspar',
  // Adicionar novos domínios custom aqui
};

// Domínios que devem usar wildcard pattern
const WILDCARD_BASE = '.crmplus.trioto.tech';

function extractTenantFromHost(host: string): string | null {
  // Remove porta se existir
  const hostname = host.split(':')[0];
  
  // 1. Verificar mapeamento de domínios custom
  if (DOMAIN_TO_TENANT[hostname]) {
    return DOMAIN_TO_TENANT[hostname];
  }
  
  // 2. Ignorar domínios do backoffice (*.bo.crmplus.trioto.tech)
  if (hostname.endsWith('.bo.crmplus.trioto.tech')) {
    return null; // Não é site público
  }
  
  // 3. Verificar padrão wildcard: {slug}.crmplus.trioto.tech
  if (hostname.endsWith(WILDCARD_BASE)) {
    const slug = hostname.replace(WILDCARD_BASE, '');
    if (slug && slug.length > 0) {
      return slug;
    }
  }
  
  // 4. Localhost ou ambiente de desenvolvimento
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_TENANT_SLUG || 'imoveismais';
  }
  
  // 5. Vercel preview URLs - usar tenant default
  if (hostname.includes('.vercel.app')) {
    return process.env.NEXT_PUBLIC_TENANT_SLUG || 'imoveismais';
  }
  
  return null;
}

// Backoffice protection (legado)
const STAFF_COOKIE = "crmplus_staff_session";
const LOGIN_PATH = "/backoffice/login";

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const { pathname } = req.nextUrl;
  
  // ===== TENANT DETECTION =====
  const tenantSlug = extractTenantFromHost(host);
  
  // Se não conseguiu detectar tenant, redireciona para landing page
  if (!tenantSlug) {
    // Permitir acesso local em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const response = NextResponse.next();
      response.cookies.set('tenant_slug', 'imoveismais', {
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
      });
      return response;
    }
    
    // Em produção, redirecionar para a landing page
    return NextResponse.redirect(new URL('https://crmplus.trioto.tech'));
  }
  
  // ===== BACKOFFICE PROTECTION (legado) =====
  if (pathname.startsWith("/backoffice") && !pathname.startsWith(LOGIN_PATH)) {
    if (process.env.BACKOFFICE_GUARD_DISABLED !== "true") {
      const hasStaffCookie = Boolean(req.cookies.get(STAFF_COOKIE)?.value);
      if (!hasStaffCookie) {
        const url = req.nextUrl.clone();
        url.pathname = "/backoffice/errors/forbidden";
        const rewriteResponse = NextResponse.rewrite(url);
        rewriteResponse.cookies.set('tenant_slug', tenantSlug, {
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        return rewriteResponse;
      }
    }
  }
  
  // ===== SET TENANT COOKIE =====
  const response = NextResponse.next();
  
  response.cookies.set('tenant_slug', tenantSlug, {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  // Header para server components
  response.headers.set('x-tenant-slug', tenantSlug);
  
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|icon.png|icon.svg|brand/|robots.txt|sitemap.xml).*)',
  ],
};
// Trigger redeploy Sat Jan 10 20:00:40 WET 2026
