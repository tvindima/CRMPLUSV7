import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiPut, serverApiDelete } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/escrituras/[id] - Get escritura by ID
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
    const res = await serverApiGet(`/escrituras/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao buscar escritura" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Escritura GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/escrituras/[id] - Update escritura
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
    const res = await serverApiPut(`/escrituras/${id}`, body, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao atualizar escritura" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Escritura PUT] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/escrituras/[id] - Delete escritura
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
    const res = await serverApiDelete(`/escrituras/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao eliminar escritura" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Escritura DELETE] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
