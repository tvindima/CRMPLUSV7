import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, serverApiPost } from '@/lib/server-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await serverApiPost('/properties/', body, token);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API] Erro ao criar propriedade:', res.status, errorText);
      return NextResponse.json(
        { error: `Erro ao criar propriedade: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[API] Erro ao criar propriedade:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
