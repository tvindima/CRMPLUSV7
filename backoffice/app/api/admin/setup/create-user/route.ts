import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, getServerApiHeaders, API_BASE_URL } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/setup/create-user - Create user with credentials
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();
    const body = await request.json();
    
    // Este endpoint pode não requerer auth em setup
    const headers = await getServerApiHeaders(token || undefined);

    const res = await fetch(`${API_BASE_URL}/admin/setup/create-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Erro ao criar utilizador" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Create User] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
