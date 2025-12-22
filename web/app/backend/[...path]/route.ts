import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL || 'https://crm-plus-production.up.railway.app').replace(/\/+$/, '');
const HOP_BY_HOP_HEADERS = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'content-length', 'host']);

type Params = { params: { path?: string[] } };

function sanitizeHeaders(source: Headers) {
  const result = new Headers();
  source.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      result.set(key, value);
    }
  });
  if (!result.has('accept')) {
    result.set('accept', 'application/json');
  }
  return result;
}

function buildBackendUrl(pathSegments: string[] = [], rawSearch?: string) {
  const basePath = pathSegments.length ? `/${pathSegments.join('/')}` : '';
  const trailingSlash = basePath.endsWith('/') ? '' : '/';
  const search = rawSearch ? `?${rawSearch}` : '';
  return `${BACKEND_URL}${basePath || '/'}${basePath ? trailingSlash : ''}${search}`;
}

async function proxyRequest(request: NextRequest, pathSegments: string[] = []) {
  const url = buildBackendUrl(pathSegments, request.nextUrl.searchParams.toString());
  const method = request.method.toUpperCase();
  const headers = sanitizeHeaders(request.headers);
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const response = await fetch(url, {
    method,
    headers,
    body: hasBody ? body : undefined,
    redirect: 'follow',
  });

  const responseHeaders = sanitizeHeaders(response.headers);
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

const createHandler =
  (method: string) =>
  async (request: NextRequest, { params }: Params) => {
    if (request.method.toUpperCase() !== method) {
      return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
    }
    try {
      return await proxyRequest(request, params.path);
    } catch (error) {
      console.error('Proxy error:', error);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
    }
  };

export const GET = createHandler('GET');
export const POST = createHandler('POST');
export const HEAD = createHandler('HEAD');
export const PUT = createHandler('PUT');
export const PATCH = createHandler('PATCH');
export const DELETE = createHandler('DELETE');
export const OPTIONS = createHandler('OPTIONS');
