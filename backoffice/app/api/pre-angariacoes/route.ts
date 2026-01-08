import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const queryString = request.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/pre-angariacoes/${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      headers: getApiHeaders(token.value),
      cache: "no-store",
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error (pre-angariacoes):", error);
      return NextResponse.json({ error: "Erro ao carregar pré-angariações" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pre-angariações proxy error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
