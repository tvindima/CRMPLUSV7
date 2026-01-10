import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, serverApiPut } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const token = await getAuthToken()

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const res = await serverApiPut('/users/me/password', body, token)

    if (!res.ok) {
      const error = await res.json()
      return NextResponse.json(error, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
