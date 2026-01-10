import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// CRITICAL: Deve corresponder ao SESSION_COOKIE em lib/api.ts
const STAFF_COOKIE = "crmplus_staff_session";
const LOGIN_PATH = "/backoffice/login";
const ALLOWED_ROLES = new Set(["staff", "admin", "leader", "agent", "coordinator", "assistant"]);
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Domínios wildcard para multi-tenant (trials e novos tenants)
// Novo padrão: bo-slug.crmplus.trioto.tech
const WILDCARD_PATTERN = ".crmplus.trioto.tech";

// Domínios que NÃO são multi-tenant (deploys dedicados)
const DEDICATED_DOMAINS = [
  "backoffice.luisgaspar.pt",
  "backoffice.imoveismais.com",
  "backoffice.luiscarlosgaspar.com",
  "localhost",
];

/**
 * Extrai o slug do tenant a partir do hostname.
 * 
 * Exemplos:
 * - bo-nazareia.crmplus.trioto.tech → "nazareia"
 * - bo-pg-auto.crmplus.trioto.tech → "pg-auto"
 * - backoffice.luisgaspar.pt → null (domínio dedicado)
 * - localhost:3000 → null (desenvolvimento)
 */
function extractTenantSlug(host: string): string | null {
  // Remove porta se existir
  const hostname = host.split(":")[0];
  
  // Verificar se é domínio dedicado
  for (const dedicated of DEDICATED_DOMAINS) {
    if (hostname === dedicated || hostname.endsWith(dedicated)) {
      return null; // Usar configuração de ambiente
    }
  }
  
  // Verificar padrão: bo-slug.crmplus.trioto.tech
  if (hostname.endsWith(WILDCARD_PATTERN)) {
    // Extrair: bo-pg-auto.crmplus.trioto.tech → bo-pg-auto
    const subdomain = hostname.replace(WILDCARD_PATTERN, "");
    
    // Verificar se é backoffice (começa com "bo-")
    if (subdomain.startsWith("bo-")) {
      // Extrair slug: bo-pg-auto → pg-auto
      return subdomain.substring(3);
    }
  }
  
  return null;
}

async function verifyStaffToken(token: string) {
  const secret = process.env.CRMPLUS_AUTH_SECRET;
  // Primeiro tenta validar localmente. Se a secret não estiver definida ou falhar,
  // cai para verificação no backend (/auth/verify) para evitar false negatives de config.
  if (secret) {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    const role = payload.role as string | undefined;
    if (!role || !ALLOWED_ROLES.has(role)) {
      throw new Error("Role not allowed");
    }
    return payload;
  }

  // Fallback: pede verificação ao backend (usa a secret do servidor)
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const role = data?.role as string | undefined;
      if (role && ALLOWED_ROLES.has(role)) {
        return data;
      }
    }
  }

  throw new Error("Token inválido ou role não permitida");
}

export async function middleware(req: NextRequest) {
  if (process.env.BACKOFFICE_GUARD_DISABLED === "true") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  
  // Extrair tenant slug do subdomínio (se aplicável)
  const tenantSlug = extractTenantSlug(host);
  
  // Criar response com headers do tenant
  const response = NextResponse.next();
  
  // Se temos um tenant slug, adicionar aos headers para uso no frontend
  if (tenantSlug) {
    response.headers.set("x-tenant-slug", tenantSlug);
    // Também definir cookie para facilitar acesso client-side
    response.cookies.set("tenant_slug", tenantSlug, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  
  // Para rotas /api/*, apenas definir o cookie e deixar passar
  // A autenticação é feita internamente pelos endpoints
  if (pathname.startsWith("/api/")) {
    return response;
  }
  
  if (pathname.startsWith(LOGIN_PATH)) {
    return response;
  }

  const token =
    req.cookies.get(STAFF_COOKIE)?.value ||
    req.headers.get("authorization")?.replace(/bearer /i, "").trim();

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/backoffice/errors/forbidden";
    return NextResponse.rewrite(url);
  }

  try {
    await verifyStaffToken(token);
    return response;
  } catch (err) {
    const url = req.nextUrl.clone();
    url.pathname = "/backoffice/errors/forbidden";
    return NextResponse.rewrite(url);
  }
}

export const config = {
  // Protege todas as rotas /backoffice/* EXCETO /backoffice/login
  // TAMBÉM corre em /api/* para definir o cookie do tenant
  matcher: ["/backoffice/((?!login).*)", "/api/:path*"],
};

// Export para testes unitários
export const __test = { verifyStaffToken, extractTenantSlug };
