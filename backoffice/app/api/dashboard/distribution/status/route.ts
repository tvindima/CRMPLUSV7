import { NextResponse } from "next/server";
import { getAuthToken, serverApiGet } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const res = await serverApiGet('/api/dashboard/distribution/status', token);

    if (!res.ok) {
      const error = await res.text();
      console.error("Railway API error (distribution/status):", res.status, error);
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Distribuição status error:", error);
    return NextResponse.json([]);
  }
}
