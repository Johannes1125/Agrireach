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

// Helper function to get notification channel name for a user
export function getNotificationChannelName(userId: string): string {
  return `private-notifications-${userId}`
}

// Helper function to trigger a notification to a user
export async function triggerNotification(
  userId: string,
  notification: any
) {
  const channelName = getNotificationChannelName(userId)
  await pusherServer.trigger(channelName, 'new-notification', notification)
}

// Pusher authentication endpoint handler
export async function authenticateChannel(socketId: string, channel: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // For private chat channels, verify the user is part of the conversation
    if (channel.startsWith('private-chat-')) {
      const userIds = channel.replace('private-chat-', '').split('-')
      if (!userIds.includes(user.id)) {
        throw new Error('Unauthorized to access this channel')
      }
    }

    // For notification channels, verify the user owns the channel
    if (channel.startsWith('private-notifications-')) {
      const channelUserId = channel.replace('private-notifications-', '')
      if (channelUserId !== user.id) {
        throw new Error('Unauthorized to access this notification channel')
      }
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel)
    return authResponse
  } catch (error) {
    console.error('Pusher auth error:', error)
    throw new Error('Authentication failed')
  }
}
