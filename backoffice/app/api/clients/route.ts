import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, TENANT_SLUG, SESSION_COOKIE } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients - Lista clientes do tenant atual
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Build URL with query params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/clients/${queryString ? '?' + queryString : ''}`;
    
    console.log("[Clients] Fetching from:", url);
    console.log("[Clients] Tenant slug:", TENANT_SLUG);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.value}`,
      'Content-Type': 'application/json',
    };
    
    // CRITICAL: Pass tenant slug for multi-tenancy isolation
    if (TENANT_SLUG) {
      headers['X-Tenant-Slug'] = TENANT_SLUG;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Clients] API error:", error);
      return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Clients] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST /api/clients - Criar novo cliente
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const url = `${API_BASE_URL}/clients/`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.value}`,
      'Content-Type': 'application/json',
    };
    
    if (TENANT_SLUG) {
      headers['X-Tenant-Slug'] = TENANT_SLUG;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Clients] Create error:", error);
      return NextResponse.json({ error: "Erro ao criar cliente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Clients] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
