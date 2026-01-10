import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiPut } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * GET /api/watermark - Get watermark settings
 */
export async function GET() {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const res = await serverApiGet('/admin/settings/watermark', token);

    if (!res.ok) {
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
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const res = await serverApiPut('/admin/settings/watermark', body, token);

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao guardar" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Watermark PUT] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
