import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiPut, serverApiDelete } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/[id] - Get client by ID
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
    const res = await serverApiGet(`/clients/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao buscar cliente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Client GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/clients/[id] - Update client
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
    const res = await serverApiPut(`/clients/${id}`, body, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao atualizar cliente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Client PUT] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id] - Delete client
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
    const res = await serverApiDelete(`/clients/${id}`, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao eliminar cliente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Client DELETE] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
