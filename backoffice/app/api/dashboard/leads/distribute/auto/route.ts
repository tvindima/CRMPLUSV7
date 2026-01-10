import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiPost } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const res = await serverApiPost('/api/dashboard/leads/distribute/auto', body, token);

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error:", error);
      return NextResponse.json({ error: "Erro ao distribuir leads" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Distribute leads error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
