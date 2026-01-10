import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, serverApiGet, serverApiPut, serverApiDelete } from '@/lib/server-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET single property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const res = await serverApiGet(`/properties/${id}`, token);

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Erro ao buscar propriedade: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Erro ao buscar propriedade:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT update property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const res = await serverApiPut(`/properties/${id}`, body, token);

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Erro ao atualizar propriedade: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Erro ao atualizar propriedade:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const res = await serverApiDelete(`/properties/${id}`, token);

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Erro ao deletar propriedade: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Erro ao deletar propriedade:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
