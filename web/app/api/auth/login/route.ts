import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";
const COOKIE_NAME = "crmplus_staff_session";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const detail = error?.detail || "Falha na autenticação";
    return NextResponse.json({ error: detail }, { status: res.status });
  }

  const data = (await res.json()) as { access_token: string; expires_at?: string };

  const expiresAt = data.expires_at ? new Date(data.expires_at) : undefined;

  cookies().set({
    name: COOKIE_NAME,
    value: data.access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.json({ ok: true });
}
