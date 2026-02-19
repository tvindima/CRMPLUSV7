import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, serverApiPost } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const { id } = await params;
  const payload = await request.json();
  const res = await serverApiPost(`/portals/properties/${id}/queue`, payload, token);
  const body = res.ok ? await res.json() : { error: await res.text() };
  return NextResponse.json(body, { status: res.status });
}
