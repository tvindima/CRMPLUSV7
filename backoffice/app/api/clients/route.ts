import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, getTenantSlug, API_BASE_URL, getServerApiHeaders } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients - Lista clientes do tenant atual
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    const tenantSlug = await getTenantSlug();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Build URL with query params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = `/clients/${queryString ? '?' + queryString : ''}`;
    
    console.log("[Clients] Fetching:", endpoint);
    console.log("[Clients] Tenant slug:", tenantSlug);

    const res = await serverApiGet(endpoint, token);

    if (!res.ok) {
      const error = await res.text();
      console.error("[Clients] API error:", error);
      return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Clients] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST /api/clients - Criar novo cliente
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    
    // Extrair agent_id do token JWT
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.decode(token) as { agent_id?: number } | null;
    const agentId = decoded?.agent_id;
    
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID não encontrado no token" }, { status: 400 });
    }
    
    // Backend requer agent_id como query parameter
    const url = `${API_BASE_URL}/clients/?agent_id=${agentId}`;
    const headers = await getServerApiHeaders(token);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Clients] Create error:", error);
      return NextResponse.json({ error: "Erro ao criar cliente" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Clients] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
