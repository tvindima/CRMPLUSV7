import { NextResponse } from "next/server";

const COOKIE_NAME = "crmplus_staff_session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  
  // Remove cookie
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0, // Expire imediatamente
  });
  
  return response;
}
