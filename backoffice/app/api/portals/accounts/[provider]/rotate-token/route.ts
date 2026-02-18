import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, serverApiPost } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export async function POST(_: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const { provider } = await params;
  const res = await serverApiPost(`/portals/accounts/${provider}/rotate-token`, {}, token);
  const body = res.ok ? await res.json() : { error: await res.text() };
  return NextResponse.json(body, { status: res.status });
}
