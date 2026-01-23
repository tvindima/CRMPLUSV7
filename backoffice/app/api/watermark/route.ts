import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiPut, SESSION_COOKIE } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * Helper para obter token de múltiplas fontes
 */
function getTokenFromRequest(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const rawCookie = req.headers.get('cookie') || '';
  const match = rawCookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * GET /api/watermark - Get watermark settings
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || await getAuthToken();
    console.log("[Watermark GET] Token present:", !!token);

    if (!token) {
      console.log("[Watermark GET] No token - returning 401");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const res = await serverApiGet('/admin/settings/watermark', token);
    console.log("[Watermark GET] Backend response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.log("[Watermark GET] Backend error:", errorText);
      return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Watermark GET] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT /api/watermark - Update watermark settings
 */
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || await getAuthToken();
    console.log("[Watermark PUT] Token present:", !!token);

    if (!token) {
      console.log("[Watermark PUT] No token - returning 401");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[Watermark PUT] Body:", JSON.stringify(body));
    
    const res = await serverApiPut('/admin/settings/watermark', body, token);
    console.log("[Watermark PUT] Backend response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.log("[Watermark PUT] Backend error:", errorText);
      return NextResponse.json({ error: "Erro ao guardar" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Watermark PUT] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
