const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type SessionInfo = {
  email: string;
  role: string;
  valid: boolean;
  exp?: number;
};

export async function getSession(): Promise<SessionInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as SessionInfo;
  } catch {
    return null;
  }
}
