import Pusher from 'pusher-js'

// Client-side Pusher configuration
export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: '/api/pusher/auth',
  auth: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
})

export function getPrivateChannelName(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort()
  return `private-chat-${sortedIds[0]}-${sortedIds[1]}`
}

export function subscribeToPrivateChannel(userId1: string, userId2: string) {
  const channelName = getPrivateChannelName(userId1, userId2)
  return pusherClient.subscribe(channelName)
}

export function unsubscribeFromPrivateChannel(userId1: string, userId2: string) {
  const channelName = getPrivateChannelName(userId1, userId2)
  pusherClient.unsubscribe(channelName)
}
