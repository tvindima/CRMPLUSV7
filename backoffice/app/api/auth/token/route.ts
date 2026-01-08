import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para obter token da sessão
 * Usado para fazer upload direto para Railway (bypass Vercel proxy devido limite de 4.5MB)
 */
export async function GET() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(SESSION_COOKIE);

  if (!tokenCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token: tokenCookie.value });
}
