import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, TENANT_SLUG, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    console.log("[KPIs] Token encontrado:", !!token?.value);
    console.log("[KPIs] Tenant slug:", TENANT_SLUG);

    if (!token?.value) {
      console.log("[KPIs] Sem token - retornando 401");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Fazer request ao Railway backend com o token e tenant
    const url = `${API_BASE_URL}/api/dashboard/kpis`;
    console.log("[KPIs] Chamando Railway:", url);
    
    const res = await fetch(url, {
      headers: getApiHeaders(token.value),
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
