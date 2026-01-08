import { NextResponse } from "next/server";
import { SESSION_COOKIE } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  
  // Remove cookie
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0, // Expire imediatamente
  });
  
  return response;
}
