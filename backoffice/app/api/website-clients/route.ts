import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/website-clients - List website clients
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Forward query params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = `/website/clients/${queryString ? `?${queryString}` : ''}`;

    const res = await serverApiGet(endpoint, token);

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
