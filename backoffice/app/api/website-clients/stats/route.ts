import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/website-clients/stats - Get website clients stats
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const res = await fetch(`${API_BASE_URL}/website/clients/stats`, {
      headers: getApiHeaders(token.value),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Website Stats] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
