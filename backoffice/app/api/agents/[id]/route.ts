import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiPut, serverApiDelete } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/agents/[id] - Get agent by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const res = await serverApiGet(`/agents/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao buscar agente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Agent GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/agents/[id] - Update agent
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const res = await serverApiPut(`/agents/${id}`, body, token);

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Erro ao atualizar agente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Agent PUT] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/agents/[id] - Delete agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const res = await serverApiDelete(`/agents/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao eliminar agente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Agent DELETE] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
