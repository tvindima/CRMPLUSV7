import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiPost } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/escrituras - List all escrituras
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/escrituras${queryString ? `?${queryString}` : ''}`;

    const res = await serverApiGet(endpoint, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao buscar escrituras" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Escrituras GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST /api/escrituras - Create new escritura
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const res = await serverApiPost('/escrituras', body, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao criar escritura" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Escrituras POST] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
