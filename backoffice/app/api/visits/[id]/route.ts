import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, API_BASE_URL, getServerApiHeaders } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/visits/[id] - Buscar visita por ID
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

    const headers = await getServerApiHeaders(token);
    const res = await fetch(`${API_BASE_URL}/mobile/visits/${id}`, { headers });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Visits] Get error:", error);
      return NextResponse.json({ error: "Visita não encontrada" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Visits] Get exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/visits/[id] - Atualizar visita
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
    const url = `${API_BASE_URL}/mobile/visits/${id}`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Visits] Update error:", error);
      return NextResponse.json({ error: "Erro ao atualizar visita" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Visits] Update exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PATCH /api/visits/[id] - Atualizar status da visita
 */
export async function PATCH(
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
    const url = `${API_BASE_URL}/mobile/visits/${id}/status`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Visits] Status update error:", error);
      return NextResponse.json({ error: "Erro ao atualizar status" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Visits] Status update exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
