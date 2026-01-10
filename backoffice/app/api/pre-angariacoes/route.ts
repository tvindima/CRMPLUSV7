import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const queryString = request.nextUrl.searchParams.toString();
    const endpoint = `/pre-angariacoes/${queryString ? `?${queryString}` : ""}`;

    const res = await serverApiGet(endpoint, token);

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
