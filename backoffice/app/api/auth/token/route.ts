import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = "crmplus_staff_session";

/**
 * Endpoint para obter token da sessão
 * Usado para fazer upload direto para Railway (bypass Vercel proxy devido limite de 4.5MB)
 */
export async function GET() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(COOKIE_NAME);

  if (!tokenCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token: tokenCookie.value });
}
