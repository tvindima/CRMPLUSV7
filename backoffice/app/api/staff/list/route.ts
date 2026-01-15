import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, serverApiGet, SESSION_COOKIE } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

function getTokenFromRequest(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value
  if (cookieToken) return cookieToken

  const rawCookie = req.headers.get('cookie') || ''
  const match = rawCookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req) || await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Usa /users com filtro de ativos; backend já faz isolamento por X-Tenant-Slug via serverApiGet
    const res = await serverApiGet('/users?limit=200&is_active=true', token)
    if (!res.ok) {
      const detail = await res.text()
      console.error('[staff/list] backend error', res.status, detail)
      return NextResponse.json({ error: 'Erro ao carregar staff' }, { status: res.status })
    }

    const users = await res.json()
    const staff = (users || []).filter((u: any) => {
      const role = (u.role || '').toLowerCase()
      return ['staff', 'admin', 'leader', 'coordinator', 'assistant', 'agent'].includes(role)
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('[staff/list] exception', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
