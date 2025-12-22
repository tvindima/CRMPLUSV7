import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

const RAILWAY_API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crm-plus-production.up.railway.app";
const COOKIE_NAME = "crmplus_staff_session";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Obter query params da request
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Fazer request ao Railway backend
    const url = `${RAILWAY_API}/properties/${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error:", error);
      return NextResponse.json({ error: "Erro ao buscar propriedades" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Properties error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
