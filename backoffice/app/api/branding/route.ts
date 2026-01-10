import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiPut, getTenantSlug, API_BASE_URL } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/branding - Get public branding settings
 */
export async function GET() {
  try {
    const tenantSlug = await getTenantSlug();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }

    const res = await fetch(`${API_BASE_URL}/public/branding`, {
      headers,
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar branding" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Branding GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/branding - Update branding settings
 */
export async function PUT(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const res = await serverApiPut('/admin/settings/branding', body, token);

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Erro ao guardar" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Branding PUT] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
