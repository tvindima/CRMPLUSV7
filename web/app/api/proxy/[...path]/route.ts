import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';

/**
 * Proxy API route that adds tenant header from cookie
 * This allows publicApi.ts to work in both client and server contexts
 */
async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = '/' + pathSegments.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}${path}${searchParams ? '?' + searchParams : ''}`;
  
  // Get tenant from cookie (set by middleware)
  const cookieStore = await cookies();
  const tenantSlug = cookieStore.get('tenant_slug')?.value || 'imoveismais';
  
  console.log(`[API Proxy] ${request.method} ${path} for tenant: ${tenantSlug}`);
  
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('X-Tenant-Slug', tenantSlug);
  
  // Forward authorization if present
  const auth = request.headers.get('Authorization');
  if (auth) {
    headers.set('Authorization', auth);
  }
  
  const response = await fetch(url, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
  });
  
  const data = await response.text();
  
  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}
