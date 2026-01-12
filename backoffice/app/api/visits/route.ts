import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, API_BASE_URL, getServerApiHeaders } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/visits - Lista visitas do tenant atual
 * Usa o endpoint /mobile/visits do backend
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
    const endpoint = `/mobile/visits${queryString ? '?' + queryString : ''}`;
    
    console.log("[Visits] Fetching:", endpoint);
    
    const headers = await getServerApiHeaders(token);
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Visits] API error:", error);
      return NextResponse.json({ error: "Erro ao buscar visitas" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Visits] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST /api/visits - Criar nova visita
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const url = `${API_BASE_URL}/mobile/visits`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Visits] Create error:", error);
      return NextResponse.json({ error: "Erro ao criar visita" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[Visits] Create exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
