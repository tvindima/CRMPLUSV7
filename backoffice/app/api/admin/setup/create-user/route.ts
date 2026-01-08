import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from "@/lib/api";

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/setup/create-user - Create user with credentials
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE);

    // Este endpoint pode não requerer auth em setup
    const body = await request.json();
    const url = `${API_BASE_URL}/admin/setup/create-user`;

    const headers = token?.value 
      ? getApiHeaders(token.value) 
      : getApiHeaders();

    const res = await fetch(url, {
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
