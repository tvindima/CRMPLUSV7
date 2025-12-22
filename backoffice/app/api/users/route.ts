import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const RAILWAY_API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crm-plus-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('crmplus_staff_session')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const is_active = searchParams.get('is_active')

    let url = `${RAILWAY_API}/users/`
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    if (is_active) params.append('is_active', is_active)
    if (params.toString()) url += `?${params.toString()}`

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
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
    const token = cookieStore.get('crmplus_staff_session')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    const res = await fetch(`${RAILWAY_API}/users/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
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
