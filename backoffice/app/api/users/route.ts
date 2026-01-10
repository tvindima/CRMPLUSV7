import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, serverApiGet, serverApiPost } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken()

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const is_active = searchParams.get('is_active')

    let endpoint = '/users/'
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    if (is_active) params.append('is_active', is_active)
    if (params.toString()) endpoint += `?${params.toString()}`

    const res = await serverApiGet(endpoint, token)

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
    const token = await getAuthToken()

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const res = await serverApiPost('/users/', body, token)

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
