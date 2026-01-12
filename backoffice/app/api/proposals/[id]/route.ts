import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, API_BASE_URL, getServerApiHeaders } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/proposals/[id] - Buscar proposta por ID
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

    const res = await serverApiGet(`/proposals/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      console.error("[Proposals] Get error:", error);
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Proposals] Get exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/proposals/[id] - Atualizar proposta
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
    const url = `${API_BASE_URL}/proposals/${id}`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Proposals] Update error:", error);
      return NextResponse.json({ error: "Erro ao atualizar proposta" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Proposals] Update exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/proposals/[id] - Eliminar proposta
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

    const url = `${API_BASE_URL}/proposals/${id}`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Proposals] Delete error:", error);
      return NextResponse.json({ error: "Erro ao eliminar proposta" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Proposals] Delete exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
