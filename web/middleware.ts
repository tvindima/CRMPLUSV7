import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Simple guard for all /backoffice routes.
// Expects a staff session cookie (placeholder name). Replace with real auth when available.
const STAFF_COOKIE = "crmplus_staff_session";
const LOGIN_PATH = "/backoffice/login";

export function middleware(req: NextRequest) {
  // Allow explicit bypass in non-prod environments if needed
  if (process.env.BACKOFFICE_GUARD_DISABLED === "true") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith(LOGIN_PATH)) {
    return NextResponse.next();
  }

  const isProtected = pathname.startsWith("/backoffice");

  const hasStaffCookie = Boolean(req.cookies.get(STAFF_COOKIE)?.value);
  if (hasStaffCookie) {
    return NextResponse.next();
  }

  // Not authenticated: rewrite to forbidden page inside backoffice.
  const url = req.nextUrl.clone();
  url.pathname = "/backoffice/errors/forbidden";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/backoffice/((?!login).*)"],
};
