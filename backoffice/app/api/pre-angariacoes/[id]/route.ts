import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const url = `${API_BASE_URL}/pre-angariacoes/${params.id}`;
    const res = await fetch(url, {
      headers: getApiHeaders(token.value),
      cache: "no-store",
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error (pre-angariacao detail):", error);
      return NextResponse.json({ error: "Erro ao carregar pré-angariação" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pre-angariação detail proxy error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const url = `${API_BASE_URL}/pre-angariacoes/${params.id}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: getApiHeaders(token.value),
      cache: "no-store",
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error (pre-angariacao delete):", error);
      return NextResponse.json({ error: "Erro ao cancelar pré-angariação" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pre-angariação delete proxy error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
