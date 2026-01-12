import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, API_BASE_URL, getServerApiHeaders } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/proposals - Lista propostas do tenant atual
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Build URL with query params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = `/proposals/${queryString ? '?' + queryString : ''}`;
    
    console.log("[Proposals] Fetching:", endpoint);

    const res = await serverApiGet(endpoint, token);

    if (!res.ok) {
      const error = await res.text();
      console.error("[Proposals] API error:", error);
      return NextResponse.json({ error: "Erro ao buscar propostas" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Proposals] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST /api/proposals - Criar nova proposta
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const url = `${API_BASE_URL}/proposals/`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Proposals] Create error:", error);
      return NextResponse.json({ error: "Erro ao criar proposta" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[Proposals] Create exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
