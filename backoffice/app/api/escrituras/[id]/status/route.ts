import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/escrituras/[id]/status - Update escritura status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    if (!status) {
      return NextResponse.json({ error: "Status é obrigatório" }, { status: 400 });
    }

    const url = `${API_BASE_URL}/escrituras/${id}/status?status=${status}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: getApiHeaders(token.value),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao atualizar status" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Escritura Status PATCH] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
