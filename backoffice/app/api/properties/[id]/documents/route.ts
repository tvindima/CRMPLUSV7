import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

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
