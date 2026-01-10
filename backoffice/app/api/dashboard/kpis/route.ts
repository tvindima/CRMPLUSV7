import { NextResponse } from "next/server";
import { getAuthToken, serverApiGet, getTenantSlug } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = await getAuthToken();
    const tenantSlug = await getTenantSlug();

    console.log("[KPIs] Token encontrado:", !!token);
    console.log("[KPIs] Tenant slug:", tenantSlug);

    if (!token) {
      console.log("[KPIs] Sem token - retornando 401");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Fazer request ao Railway backend com o token e tenant
    console.log("[KPIs] Chamando Railway: /api/dashboard/kpis");
    
    const res = await serverApiGet('/api/dashboard/kpis', token);

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
