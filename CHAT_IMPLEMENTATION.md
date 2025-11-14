# Pusher Chat Implementation

This implementation provides a complete real-time chat system using Pusher for your AgriReach web application.

## Features

- **Real-time messaging** using Pusher WebSockets
- **Private user-to-user conversations**
- **Message history and persistence**
- **User search functionality**
- **Responsive chat interface**
- **Authentication integration**

## Setup Instructions

### 1. Environment Variablesssssssss

Add these variables to your `.env.local` file:

```env
# Pusher Configuration
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=ap1

NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```

### 2. Pusher Account Setup

1. Create a Pusher account at [pusher.com](https://pusher.com)
2. Create a new app in your Pusher dashboard
3. Copy the credentials to your environment variables
4. Enable private channels in your Pusher app settings

### 3. Database Models

The chat system uses two MongoDB collections:

- **ChatMessage**: Stores individual messages
- **ChatConversation**: Stores conversation metadata

## API Endpoints

### Authentication
- `POST /api/pusher/auth` - Pusher channel authentication

### Chat Messages
- `POST /api/chat/messages` - Send a new message
- `GET /api/chat/messages?user_id={id}` - Get messages with a specific user

### Conversations
- `GET /api/chat/conversations` - Get all user conversations

### User Search
- `GET /api/chat/users?q={query}` - Search users by name or email

## Components

### Core Components
- `ChatInterface` - Main chat container
- `ChatList` - Sidebar with conversations
- `ChatWindow` - Main chat area
- `UserSearchModal` - Modal for starting new conversations

### Context
- `ChatProvider` - React context for chat state management
- `useChat` - Hook for accessing chat functionality qweqweqweqwe

## Usage

### Basic Implementation

```tsx
import { ChatInterface } from '@/components/chat/chat-interface'

export default function ChatPage() {
  return (
    <div className="container mx-auto py-6">
      <h1>Messages</h1>
      <ChatInterface />
    </div>
  )
}
```

### Using Chat Context

```tsx
import { useChat } from '@/contexts/chat-context'

function MyComponent() {
  const { state, sendMessage, loadConversations } = useChat()
  
  const handleSendMessage = async () => {
    await sendMessage('user-id', 'Hello!')
  }
  
  return (
    <div>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  )
}
```

## Real-time Features

### Message Broadcasting
When a user sends a message:
1. Message is saved to the database
2. Pusher triggers a `new-message` event
3. All connected users in the conversation receive the message instantly

### Private Channels
Each conversation uses a private Pusher channel named:
```
private-chat-{user1-id}-{user2-id}
```

### Authentication
Private channels require authentication via `/api/pusher/auth` endpoint.

## Security Features

- **Authentication required** for all chat operations
- **Private channel authentication** via Pusher
- **User verification** before starting conversations
- **Message ownership validation**

## Styling

The chat interface uses Tailwind CSS and follows your app's design system:
- Responsive design for mobile and desktop
- Dark/light theme support
- Consistent with existing UI components

## Navigation Integration

The chat is integrated into your app's sidebar navigation:
- Added "Messages" item to the main navigation
- Accessible at `/chat` route
- Protected by authentication middleware

## File Structure

```
app/
├── api/
│   ├── pusher/
│   │   └── auth/route.ts
│   └── chat/
│       ├── messages/route.ts
│       ├── conversations/route.ts
│       └── users/route.ts
├── chat/
│   ├── page.tsx
│   └── layout.tsx

components/
└── chat/
    ├── chat-interface.tsx
    ├── chat-list.tsx
    ├── chat-window.tsx
    └── user-search-modal.tsx

contexts/
└── chat-context.tsx

lib/
├── pusher.ts
└── pusher-server.ts

server/
└── models/
    └── Chat.ts
```

## Testing

To test the chat functionality:

1. **Start your development server**: `npm run dev`
2. **Open two browser windows** with different user accounts
3. **Navigate to `/chat`** in both windows
4. **Search for a user** and start a conversation
5. **Send messages** and verify real-time updates

## Troubleshooting

### Common Issues

1. **Pusher connection fails**
   - Check environment variables
   - Verify Pusher app credentials
   - Ensure private channels are enabled

2. **Messages not appearing**
   - Check browser console for errors
   - Verify authentication is working
   - Check database connection

3. **User search not working**
   - Ensure users exist in the database
   - Check API endpoint responses
   - Verify authentication

### Debug Mode

Enable Pusher debug mode by adding to your environment:
```env
NEXT_PUBLIC_PUSHER_DEBUG=true
```

## Future Enhancements

Potential improvements:
- File/image sharing
- Message reactions
- Typing indicators
- Message status (sent/delivered/read)
- Group conversations
- Message search
- Push notifications
