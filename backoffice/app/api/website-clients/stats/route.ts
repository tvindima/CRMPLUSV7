import { NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/website-clients/stats - Get website clients stats
 */
export async function GET() {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const res = await serverApiGet('/website/clients/stats', token);

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
