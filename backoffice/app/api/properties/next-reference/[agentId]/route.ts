import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

const RAILWAY_API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";
const COOKIE_NAME = "crmplus_staff_session";

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const res = await fetch(`${RAILWAY_API}/properties/utils/next-reference/${params.agentId}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });

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
