import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/escrituras/proximas - Get upcoming escrituras
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dias = searchParams.get('dias') || '60';
    
    const endpoint = `/escrituras/proximas?dias=${dias}`;
    const res = await serverApiGet(endpoint, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao buscar escrituras" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Escrituras Proximas GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
