import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { connectToDatabase } from '@/server/lib/mongodb'
import { ChatConversation } from '@/server/models/Chat'
import { User } from '@/server/models/User'
import { jsonOk, jsonError } from '@/server/utils/api'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return jsonError('Unauthorized', 401)
    }

    await connectToDatabase()

    // Get all conversations for the current user
    const conversations = await ChatConversation.find({
      participants: user.id
    })
    .populate('participants', 'full_name avatar_url email')
    .populate('last_message')
    .sort({ last_message_at: -1 })

    // Format conversations with participant info
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        (p: any) => p._id.toString() !== user.id
      )

      return {
        id: conv._id,
        other_user: {
          id: otherParticipant._id,
          name: otherParticipant.full_name,
          avatar: otherParticipant.avatar_url,
          email: otherParticipant.email,
        },
        last_message: conv.last_message ? {
          id: conv.last_message._id,
          content: conv.last_message.content,
          message_type: conv.last_message.message_type,
          created_at: conv.last_message.created_at,
        } : null,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
      }
    })

    return jsonOk({ conversations: formattedConversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return jsonError('Failed to get conversations', 500)
  }
}
