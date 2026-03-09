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

    // Tentar obter agent_id do payload (preferencial para ações administrativas)
    const rawAgentIdFromBody = body?.agent_id;
    const parsedAgentIdFromBody =
      rawAgentIdFromBody !== undefined && rawAgentIdFromBody !== null
        ? Number(rawAgentIdFromBody)
        : NaN;
    const agentIdFromBody = Number.isFinite(parsedAgentIdFromBody) ? parsedAgentIdFromBody : null;

    // Fallback: extrair agent_id do token JWT
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.decode(token) as { agent_id?: number } | null;
    const agentIdFromToken = decoded?.agent_id ?? null;

    const agentId = agentIdFromBody ?? agentIdFromToken;

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID em falta" }, { status: 400 });
    }

    // Backend requer agent_id como query parameter
    const url = `${API_BASE_URL}/clients/?agent_id=${agentId}`;
    const headers = await getServerApiHeaders(token);

    // Remover agent_id do corpo para não enviar campo extra ao backend
    if (body && typeof body === "object" && "agent_id" in body) {
      delete body.agent_id;
    }

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
