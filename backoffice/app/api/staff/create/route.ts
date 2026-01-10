import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, SESSION_COOKIE } from '@/lib/api'

export const dynamic = 'force-dynamic'

const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'dev_admin_key_change_in_production'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)
    const tenantSlug = cookieStore.get('tenant_slug')?.value || process.env.NEXT_PUBLIC_TENANT_SLUG || ''

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_SETUP_KEY,
    }
    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug
    }

    // Chamar endpoint do backend com X-Admin-Key
    const res = await fetch(`${API_BASE_URL}/admin/setup/create-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
