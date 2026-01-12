import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, API_BASE_URL, getServerApiHeaders } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/[id] - Buscar oportunidade por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const res = await serverApiGet(`/opportunities/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      console.error("[Opportunities] Get error:", error);
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Opportunities] Get exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/opportunities/[id] - Atualizar oportunidade
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const url = `${API_BASE_URL}/opportunities/${id}`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Opportunities] Update error:", error);
      return NextResponse.json({ error: "Erro ao atualizar oportunidade" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Opportunities] Update exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/opportunities/[id] - Eliminar oportunidade
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const url = `${API_BASE_URL}/opportunities/${id}`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Opportunities] Delete error:", error);
      return NextResponse.json({ error: "Erro ao eliminar oportunidade" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Opportunities] Delete exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
