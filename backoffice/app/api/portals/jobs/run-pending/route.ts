import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, serverApiPost } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const bodyIn = await request.json().catch(() => ({}));
  const limit = Number(bodyIn?.limit || 50);
  const res = await serverApiPost(`/portals/jobs/run-pending?limit=${Number.isFinite(limit) ? limit : 50}`, {}, token);
  const body = res.ok ? await res.json() : { error: await res.text() };
  return NextResponse.json(body, { status: res.status });
}
