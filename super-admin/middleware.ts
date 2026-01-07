import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não requerem autenticação
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

// Rotas que começam com estes prefixos são públicas
const PUBLIC_PREFIXES = ['/_next', '/api', '/favicon', '/static'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar rotas públicas e assets
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Verificar se é rota pública
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Se já está autenticado e tenta aceder ao login, redirecionar para dashboard
    const token = request.cookies.get('platform_token')?.value;
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  const token = request.cookies.get('platform_token')?.value;
  
  if (!token) {
    // Guardar URL original para redirect após login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se token está no formato JWT básico (header.payload.signature)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    // Token inválido, limpar cookie e redirecionar
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('platform_token');
    response.cookies.delete('super_admin');
    return response;
  }

  // Verificar expiração do token (decode payload)
  try {
    const payload = JSON.parse(atob(tokenParts[1]));
    const exp = payload.exp;
    
    if (exp && Date.now() >= exp * 1000) {
      // Token expirado
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('platform_token');
      response.cookies.delete('super_admin');
      return response;
    }
  } catch (e) {
    // Erro ao decodificar token
    console.error('Error decoding token:', e);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
