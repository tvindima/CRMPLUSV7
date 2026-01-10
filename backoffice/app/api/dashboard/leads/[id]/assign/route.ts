import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, getServerApiHeaders, API_BASE_URL } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const url = `${API_BASE_URL}/api/dashboard/leads/${id}/assign${queryString ? `?${queryString}` : ''}`;
    const headers = await getServerApiHeaders(token);
    
    const res = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error:", error);
      return NextResponse.json({ error: "Erro ao atribuir lead" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Assign lead error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
