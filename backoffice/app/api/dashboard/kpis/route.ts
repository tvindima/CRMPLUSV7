import { NextResponse } from "next/server";
import { getAuthToken, serverApiGet, getTenantSlug } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

const EMPTY_KPIS = {
  propriedades_ativas: 0,
  novas_leads_7d: 0,
  propostas_abertas: 0,
  agentes_ativos: 0,
  escrituras_agendadas: 0,
  escrituras_docs_ok: 0,
  escrituras_docs_pendentes: 0,
  trends: {
    propriedades: "0%",
    propriedades_up: false,
    leads: "0%",
    leads_up: false,
    propostas: "0%",
    propostas_up: false,
  },
};

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
      console.error("[KPIs] Railway API error:", res.status, error);
      return NextResponse.json(EMPTY_KPIS);
    }

    const data = await res.json();
    console.log("[KPIs] Dados recebidos:", JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error("[KPIs] Exception:", error);
    return NextResponse.json(EMPTY_KPIS);
  }
}
