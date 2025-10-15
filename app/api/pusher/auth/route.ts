import { NextRequest, NextResponse } from 'next/server'
import { authenticateChannel } from '@/lib/pusher-server'

export async function POST(req: NextRequest) {
  try {
    // Pusher sends data as form-urlencoded, not JSON
    const formData = await req.formData()
    const socket_id = formData.get('socket_id') as string
    const channel_name = formData.get('channel_name') as string

    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 })
    }

    const authResponse = await authenticateChannel(socket_id, channel_name)
    
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}