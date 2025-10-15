import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { connectToDatabase } from '@/server/lib/mongodb'
import { User } from '@/server/models/User'
import { jsonOk, jsonError } from '@/server/utils/api'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return jsonError('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    await connectToDatabase()

    // Search users by name or email
    const users = await User.find({
      _id: { $ne: user.id }, // Exclude current user
      $or: [
        { full_name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('full_name avatar_url email')
    .limit(limit)

    const formattedUsers = users.map(u => ({
      id: u._id,
      name: u.full_name,
      avatar: u.avatar_url,
      email: u.email,
    }))

    return jsonOk({ users: formattedUsers })
  } catch (error) {
    console.error('Search users error:', error)
    return jsonError('Failed to search users', 500)
  }
}
