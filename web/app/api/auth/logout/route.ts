import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "crmplus_staff_session";

export async function POST() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
