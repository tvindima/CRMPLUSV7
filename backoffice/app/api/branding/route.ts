import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders, TENANT_SLUG } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/branding - Get public branding settings
 */
export async function GET() {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (TENANT_SLUG) {
      headers['X-Tenant-Slug'] = TENANT_SLUG;
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
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${API_BASE_URL}/admin/settings/branding`, {
      method: 'PUT',
      headers: getApiHeaders(token.value),
      body: JSON.stringify(body),
    });

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
