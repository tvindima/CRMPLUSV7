import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, SESSION_COOKIE, TENANT_SLUG } from '@/lib/api'

export const dynamic = 'force-dynamic'

const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'dev_admin_key_change_in_production'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_SETUP_KEY,
    }
    if (TENANT_SLUG) {
      headers['X-Tenant-Slug'] = TENANT_SLUG
    }

    const res = await fetch(`${API_BASE_URL}/admin/setup/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: parseInt(id),
        new_password: body.new_password
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
