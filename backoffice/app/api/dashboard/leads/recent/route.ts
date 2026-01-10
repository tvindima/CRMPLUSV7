import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const endpoint = `/api/dashboard/leads/recent${queryString ? `?${queryString}` : ''}`;
    const res = await serverApiGet(endpoint, token);

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error:", error);
      return NextResponse.json({ error: "Erro ao buscar leads" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Recent leads error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
