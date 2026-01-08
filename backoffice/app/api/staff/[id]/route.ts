import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, SESSION_COOKIE, TENANT_SLUG } from '@/lib/api'

export const dynamic = 'force-dynamic'

const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'dev_admin_key_change_in_production'

function getAdminHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Admin-Key': ADMIN_SETUP_KEY,
  }
  if (TENANT_SLUG) {
    headers['X-Tenant-Slug'] = TENANT_SLUG
  }
  return headers
}

export async function GET(
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

    const res = await fetch(`${API_BASE_URL}/admin/setup/get-user/${id}`, {
      headers: getAdminHeaders(),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    const res = await fetch(`${API_BASE_URL}/admin/setup/update-user/${id}`, {
      method: 'PUT',
      headers: {
        ...getAdminHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const res = await fetch(`${API_BASE_URL}/admin/setup/delete-user/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
