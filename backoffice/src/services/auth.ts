const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";

export type SessionInfo = {
  email: string;
  role: string;
  valid: boolean;
  exp?: number;
};

export async function getSession(): Promise<SessionInfo | null> {
  try {
    // Chama o endpoint local do Next.js que lê o cookie
    const res = await fetch('/api/auth/session', { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      email: data.email,
      role: data.role,
      valid: true,
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json().catch(() => null);
  // Opcional: podemos guardar o token no cookie httpOnly via backend.
  // Aqui devolvemos o access_token apenas para indicar sucesso.
  return data?.access_token || null;
}
