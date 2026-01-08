import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, SESSION_COOKIE, getApiHeaders } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const is_active = searchParams.get('is_active')

    let url = `${API_BASE_URL}/users/`
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    if (is_active) params.append('is_active', is_active)
    if (params.toString()) url += `?${params.toString()}`

    const res = await fetch(url, {
      headers: getApiHeaders(token.value),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    const res = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: getApiHeaders(token.value),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json()
      return NextResponse.json(error, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
