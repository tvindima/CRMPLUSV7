import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RAILWAY_API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'dev_admin_key_change_in_production'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('crmplus_staff_session')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const res = await fetch(`${RAILWAY_API}/admin/setup/list-staff`, {
      headers: {
        'X-Admin-Key': ADMIN_SETUP_KEY,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error listing staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
