import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/website-clients - List website clients
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Forward query params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/website/clients/${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      headers: getApiHeaders(token.value),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Website Clients] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
