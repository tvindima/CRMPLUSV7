import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL, SESSION_COOKIE } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE);
  const tenantSlug = cookieStore.get('tenant_slug')?.value || process.env.NEXT_PUBLIC_TENANT_SLUG || '';

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    
    // Build headers with tenant slug (no Content-Type for FormData)
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.value}`,
    };
    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }
    
    const res = await fetch(`${API_BASE_URL}/properties/${id}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API] Erro ao fazer upload de imagens:', res.status, errorText);
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
