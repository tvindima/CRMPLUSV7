import { NextResponse } from "next/server";
import { getAuthToken, serverApiGet, serverApiDelete } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const res = await serverApiGet(`/pre-angariacoes/${id}`, token);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const res = await serverApiDelete(`/pre-angariacoes/${id}`, token);

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
