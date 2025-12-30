import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";
const COOKIE_NAME = "crmplus_staff_session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data?.detail || "Falha na autenticação" }, { status: res.status });
    }

    const data = await res.json();
    const token = data?.access_token;
    if (!token) {
      return NextResponse.json({ error: "Token em falta" }, { status: 500 });
    }

    // Devolver também o token para o cliente guardar no localStorage
    const response = NextResponse.json({ 
      ok: true, 
      role: data?.role || "staff",
      access_token: token 
    });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60, // 1h
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}
