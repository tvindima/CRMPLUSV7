import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, serverApiGet } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const res = await serverApiGet('/portals/providers', token);
  const body = res.ok ? await res.json() : { error: await res.text() };
  return NextResponse.json(body, { status: res.status });
}
