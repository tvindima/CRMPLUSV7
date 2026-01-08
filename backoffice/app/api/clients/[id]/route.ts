import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/[id] - Get client by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const url = `${API_BASE_URL}/clients/${id}`;

    const res = await fetch(url, {
      headers: getApiHeaders(token.value),
    });

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
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const url = `${API_BASE_URL}/clients/${id}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: getApiHeaders(token.value),
      body: JSON.stringify(body),
    });

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
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const url = `${API_BASE_URL}/clients/${id}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: getApiHeaders(token.value),
    });

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
