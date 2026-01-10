import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * POST /api/branding/upload-logo - Upload logo
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE);
    const tenantSlug = cookieStore.get('tenant_slug')?.value || process.env.NEXT_PUBLIC_TENANT_SLUG || '';

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await request.formData();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.value}`,
    };
    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }

    const res = await fetch(`${API_BASE_URL}/admin/settings/branding/upload-logo`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Erro ao carregar logo" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Logo Upload] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
