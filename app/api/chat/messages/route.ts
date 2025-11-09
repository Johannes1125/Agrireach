import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { connectToDatabase } from '@/server/lib/mongodb'
import { ChatMessage, ChatConversation } from '@/server/models/Chat'
import { User } from '@/server/models/User'
import { triggerPrivateMessage } from '@/lib/pusher-server'
import { jsonOk, jsonError } from '@/server/utils/api'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return jsonError('Unauthorized', 401)
    }

    const { recipient_id, content, message_type = 'text' } = await req.json()

    if (!recipient_id || !content) {
      return jsonError('Missing recipient_id or content', 400)
    }

    await connectToDatabase()

    // Verify recipient exists
    const recipient = await User.findById(recipient_id)
    if (!recipient) {
      return jsonError('Recipient not found', 404)
    }

    // Create message
    const message = new ChatMessage({
      sender_id: user.id,
      recipient_id,
      content,
      message_type,
    })

    await message.save()

    // Update or create conversation
    const participants = [user.id, recipient_id].sort()
    let conversation = await ChatConversation.findOne({
      participants: { $all: participants }
    })

    if (!conversation) {
      conversation = new ChatConversation({
        participants,
      })
    }

    conversation.last_message = message._id
    conversation.last_message_at = message.created_at
    conversation.updated_at = new Date()
    await conversation.save()

    // Trigger real-time event
    await triggerPrivateMessage(user.id, recipient_id, 'new-message', {
      id: message._id,
      sender_id: user.id,
      recipient_id,
      content,
      message_type,
      created_at: message.created_at,
      sender: {
        id: user.id,
        name: user.full_name,
        avatar: user.avatar_url,
      },
    })

    return jsonOk({
      message: {
        id: message._id.toString(),
        sender_id: user.id,
        recipient_id,
        content,
        message_type,
        created_at: message.created_at,
        sender: {
          id: user.id,
          name: user.full_name || user.email || 'Unknown',
          avatar: user.avatar_url,
          email: user.email,
        },
      }
    })
  } catch (error) {
    console.error('Send message error:', error)
    return jsonError('Failed to send message', 500)
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return jsonError('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const otherUserId = searchParams.get('user_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!otherUserId) {
      return jsonError('Missing user_id parameter', 400)
    }

    await connectToDatabase()

    // Verify other user exists
    const otherUser = await User.findById(otherUserId)
    if (!otherUser) {
      return jsonError('User not found', 404)
    }

    // Get messages between the two users
    const messages = await ChatMessage.find({
      $or: [
        { sender_id: user.id, recipient_id: otherUserId },
        { sender_id: otherUserId, recipient_id: user.id }
      ]
    })
    .populate('sender_id', 'full_name avatar_url email')
    .populate('recipient_id', 'full_name avatar_url email')
    .sort({ created_at: -1 })
    .limit(limit)
    .skip((page - 1) * limit)

    // Mark messages as read
    await ChatMessage.updateMany(
      {
        sender_id: otherUserId,
        recipient_id: user.id,
        read_at: { $exists: false }
      },
      { read_at: new Date() }
    )

    // Format messages properly - ensure sender_id is a string and sender object is included
    const formattedMessages = messages.reverse().map((msg: any) => {
      const senderId = typeof msg.sender_id === 'object' && msg.sender_id?._id 
        ? msg.sender_id._id.toString() 
        : msg.sender_id?.toString() || msg.sender_id
      
      const sender = typeof msg.sender_id === 'object' && msg.sender_id
        ? {
            id: msg.sender_id._id.toString(),
            name: msg.sender_id.full_name || msg.sender_id.email || 'Unknown',
            avatar: msg.sender_id.avatar_url,
            email: msg.sender_id.email,
          }
        : undefined

      return {
        id: msg._id.toString(),
        sender_id: senderId,
        recipient_id: typeof msg.recipient_id === 'object' && msg.recipient_id?._id
          ? msg.recipient_id._id.toString()
          : msg.recipient_id?.toString() || msg.recipient_id,
        content: msg.content,
        message_type: msg.message_type,
        created_at: msg.created_at,
        read_at: msg.read_at,
        sender,
      }
    })

    return jsonOk({
      messages: formattedMessages,
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return jsonError('Failed to get messages', 500)
  }
}