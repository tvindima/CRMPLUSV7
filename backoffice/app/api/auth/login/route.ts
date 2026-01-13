import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE } from "@/lib/api";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extrair tenant slug do hostname da request
    const host = req.headers.get('host') || '';
    let tenantSlug = '';
    
    // Padrão: slug.bo.crmplus.trioto.tech
    if (host.endsWith('.bo.crmplus.trioto.tech')) {
      tenantSlug = host.replace('.bo.crmplus.trioto.tech', '');
    }
    
    // Fallback: cookie
    if (!tenantSlug) {
      try {
        const cookieStore = await cookies();
        tenantSlug = cookieStore.get('tenant_slug')?.value || '';
      } catch (e) {
        // Ignorar erro de cookies
      }
    }
    
    // Fallback: header
    if (!tenantSlug) {
      tenantSlug = req.headers.get('x-tenant-slug') || '';
    }
    
    // Fallback: env var
    if (!tenantSlug) {
      tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || '';
    }
    
    // Construir headers com tenant
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }
    
    console.log("[Login API Route] Host:", host);
    console.log("[Login API Route] Tenant slug:", tenantSlug || "(empty)");
    console.log("[Login API Route] Calling backend:", `${API_BASE_URL}/auth/login`);
    
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
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60, // 1h
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}
// Trigger redeploy Tue Jan 13 00:11:46 WET 2026
