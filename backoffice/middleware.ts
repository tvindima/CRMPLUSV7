import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const STAFF_COOKIE = "crmplus_staff_session";
const LOGIN_PATH = "/backoffice/login";
const ALLOWED_ROLES = new Set(["staff", "admin", "leader"]);
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function verifyStaffToken(token: string) {
  const secret = process.env.CRMPLUS_AUTH_SECRET;
  // Primeiro tenta validar localmente. Se a secret não estiver definida ou falhar,
  // cai para verificação no backend (/auth/verify) para evitar false negatives de config.
  if (secret) {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    const role = payload.role as string | undefined;
    if (!role || !ALLOWED_ROLES.has(role)) {
      throw new Error("Role not allowed");
    }
    return payload;
  }

  // Fallback: pede verificação ao backend (usa a secret do servidor)
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const role = data?.role as string | undefined;
      if (role && ALLOWED_ROLES.has(role)) {
        return data;
      }
    }
  }

  throw new Error("Token inválido ou role não permitida");
}

export async function middleware(req: NextRequest) {
  if (process.env.BACKOFFICE_GUARD_DISABLED === "true") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith(LOGIN_PATH)) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get(STAFF_COOKIE)?.value ||
    req.headers.get("authorization")?.replace(/bearer /i, "").trim();

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/backoffice/errors/forbidden";
    return NextResponse.rewrite(url);
  }

  try {
    await verifyStaffToken(token);
    return NextResponse.next();
  } catch (err) {
    const url = req.nextUrl.clone();
    url.pathname = "/backoffice/errors/forbidden";
    return NextResponse.rewrite(url);
  }
}

export const config = {
  // Protege todas as rotas /backoffice/* EXCETO /backoffice/login
  // NÃO protege /api/* (endpoints da API precisam validar auth internamente)
  matcher: ["/backoffice/((?!login).*)"],
};

// Export para testes unitários
export const __test = { verifyStaffToken };
