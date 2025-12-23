import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const RAILWAY_API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";
const COOKIE_NAME = "crmplus_staff_session";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const url = `${RAILWAY_API}/pre-angariacoes/${params.id}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
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
