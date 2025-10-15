import Pusher from 'pusher'
import { getCurrentUser } from './auth-server'

// Server-side Pusher configuration
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Helper function to generate private channel name for two users
export function getPrivateChannelName(userId1: string, userId2: string): string {
  // Sort user IDs to ensure consistent channel naming regardless of order
  const sortedIds = [userId1, userId2].sort()
  return `private-chat-${sortedIds[0]}-${sortedIds[1]}`
}

// Helper function to trigger a message to a private channel
export async function triggerPrivateMessage(
  senderId: string,
  recipientId: string,
  event: string,
  data: any
) {
  const channelName = getPrivateChannelName(senderId, recipientId)
  await pusherServer.trigger(channelName, event, data)
}

// Pusher authentication endpoint handler
export async function authenticateChannel(socketId: string, channel: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // For private channels, verify the user is part of the conversation
    if (channel.startsWith('private-chat-')) {
      const userIds = channel.replace('private-chat-', '').split('-')
      if (!userIds.includes(user.id)) {
        throw new Error('Unauthorized to access this channel')
      }
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel)
    return authResponse
  } catch (error) {
    console.error('Pusher auth error:', error)
    throw new Error('Authentication failed')
  }
}
