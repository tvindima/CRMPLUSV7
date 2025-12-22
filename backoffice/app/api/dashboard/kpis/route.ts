import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

const RAILWAY_API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";
const COOKIE_NAME = "crmplus_staff_session";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME);

    console.log("[KPIs] Token encontrado:", !!token?.value);

    if (!token?.value) {
      console.log("[KPIs] Sem token - retornando 401");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Fazer request ao Railway backend com o token
    const url = `${RAILWAY_API}/api/dashboard/kpis`;
    console.log("[KPIs] Chamando Railway:", url);
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("[KPIs] Railway respondeu com status:", res.status);

    if (!res.ok) {
      const error = await res.text();
      console.error("[KPIs] Railway API error:", error);
      return NextResponse.json({ error: "Erro ao buscar KPIs" }, { status: res.status });
    }

    const data = await res.json();
    console.log("[KPIs] Dados recebidos:", JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error("[KPIs] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
