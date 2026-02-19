import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, getAuthToken, getTenantSlug, serverApiGet } from "@/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const res = await serverApiGet(`/properties/${id}/documents`, token);

    // Legacy-safe behavior: many tenants do not have this endpoint yet.
    // Return an empty list so UI does not enter a retry/error loop.
    if (res.status === 404) {
      return NextResponse.json([]);
    }

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Erro ao buscar documentos: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API] Erro ao buscar documentos da propriedade:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const tenantSlug = await getTenantSlug();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (tenantSlug) {
      headers["X-Tenant-Slug"] = tenantSlug;
    }

    const res = await fetch(`${API_BASE_URL}/properties/${id}/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `Erro ao fazer upload de documentos: ${text}` },
        { status: res.status }
      );
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("[API] Erro ao fazer upload de documentos da propriedade:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
