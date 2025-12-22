import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Força Node.js runtime e desativa cache estático
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = "crmplus_staff_session";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME);

    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Decodificar o JWT sem validar (já foi validado no login pelo backend)
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.decode(token.value) as {
      sub?: string;
      email?: string;
      role?: string;
      name?: string;
    } | null;

    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    return NextResponse.json({
      email: decoded.email || decoded.sub || "",
      role: decoded.role || "staff",
      name: decoded.name || decoded.email || "",
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Erro ao processar sessão" }, { status: 500 });
  }
}
