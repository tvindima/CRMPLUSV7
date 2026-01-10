import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { agentId } = await params;
    const res = await serverApiGet(`/properties/utils/next-reference/${agentId}`, token);

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error:", error);
      return NextResponse.json({ error: "Erro ao buscar referência" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Next reference error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
