import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiPost } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/leads - List leads
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
    const endpoint = `/leads/${queryString ? `?${queryString}` : ''}`;

    const res = await serverApiGet(endpoint, token);

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar leads" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Leads GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST /api/leads - Create new lead
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const res = await serverApiPost('/leads/', body, token);

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Erro ao criar lead" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Leads POST] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
