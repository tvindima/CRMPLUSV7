import { NextResponse, NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

const API_BASE_URL = 'https://crmplusv7-production.up.railway.app';
const SESSION_COOKIE = 'crmplus_staff_session';

// Extrair tenant do hostname: petala-dourada.bo.crmplus.trioto.tech -> petala-dourada
function getTenantFromHost(host: string): string {
  if (host.endsWith('.bo.crmplus.trioto.tech')) {
    return host.replace('.bo.crmplus.trioto.tech', '');
  }
  // Domínios dedicados
  if (host.includes('imoveismais')) return 'imoveismais';
  if (host.includes('luisgaspar') || host.includes('luiscarlosgaspar')) return 'luisgaspar';
  return process.env.NEXT_PUBLIC_TENANT_SLUG || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extrair tenant do hostname
    const host = req.headers.get('host') || '';
    const tenantSlug = getTenantFromHost(host);
    
    // Headers para o backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }
    
    console.log("[Login] Host:", host, "Tenant:", tenantSlug);
    
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // Handle detail that could be string or object
      let errorMessage = "Falha na autenticação";
      if (data?.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (typeof data.detail === 'object' && data.detail.error) {
          errorMessage = data.detail.error;
        }
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const data = await res.json();
    const token = data?.access_token;
    if (!token) {
      return NextResponse.json({ error: "Token em falta" }, { status: 500 });
    }

    // Devolver também o token para o cliente guardar no localStorage
    const response = NextResponse.json({ 
      ok: true, 
      role: data?.role || "staff",
      access_token: token 
    });
    const hostNoPort = (host || '').split(':')[0];
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      domain: hostNoPort || undefined,
      maxAge: 60 * 60, // 1h
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}
