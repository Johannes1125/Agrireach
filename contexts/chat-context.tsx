'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { pusherClient, subscribeToPrivateChannel, unsubscribeFromPrivateChannel } from '@/lib/pusher'
import { useAuth } from '@/hooks/use-auth'

export interface ChatUser {
  id: string
  name: string
  avatar?: string
  email?: string
}

export interface ChatMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: 'text' | 'image' | 'file'
  created_at: string
  read_at?: string
  sender?: ChatUser
}

export interface ChatConversation {
  id: string
  other_user: ChatUser
  last_message?: ChatMessage
  last_message_at?: string
  created_at: string
}

interface ChatState {
  conversations: ChatConversation[]
  currentConversation: ChatConversation | null
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  isConnected: boolean
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: ChatConversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: ChatConversation | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'REPLACE_MESSAGE'; payload: { oldId: string; newMessage: ChatMessage } }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'UPDATE_CONVERSATION'; payload: ChatConversation }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  isConnected: false,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'ADD_MESSAGE':
      // Prevent duplicate messages by checking if message with same ID already exists
      const messageExists = state.messages.some(msg => {
        const msgId = msg.id?.toString() || (msg as any)._id?.toString()
        const newMsgId = action.payload.id?.toString() || (action.payload as any)._id?.toString()
        return msgId === newMsgId
      })
      if (messageExists) {
        return state
      }
      return { ...state, messages: [...state.messages, action.payload] }
    case 'REPLACE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.oldId ? action.payload.newMessage : msg
        ),
      }
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      }
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
      }
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload }
    default:
      return state
  }
}

interface ChatContextType {
  state: ChatState
  sendMessage: (recipientId: string, content: string, messageType?: 'text' | 'image' | 'file') => Promise<void>
  loadConversations: () => Promise<void>
  loadMessages: (userId: string) => Promise<void>
  selectConversation: (conversation: ChatConversation) => void
  searchUsers: (query: string) => Promise<ChatUser[]>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { user } = useAuth()

  // Initialize Pusher connection
  useEffect(() => {
    if (!user) return

    pusherClient.connection.bind('connected', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true })
    })

    pusherClient.connection.bind('disconnected', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false })
    })

    pusherClient.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Connection error' })
    })

    return () => {
      pusherClient.disconnect()
    }
  }, [user])

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !state.currentConversation) return

    const channel = subscribeToPrivateChannel(user.id, state.currentConversation.other_user.id)
    
    channel.bind('new-message', (data: ChatMessage) => {
      dispatch({ type: 'ADD_MESSAGE', payload: data })
      
      // Update conversation with new message
      const updatedConversation = {
        ...state.currentConversation!,
        last_message: data,
        last_message_at: data.created_at,
      }
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation })
    })

    return () => {
      unsubscribeFromPrivateChannel(user.id, state.currentConversation!.other_user.id)
    }
  }, [user, state.currentConversation])

  const sendMessage = useCallback(async (
    recipientId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ) => {
    if (!user) return

    // Create optimistic message immediately
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name || user.email || "You",
        avatar: user.avatar,
        email: user.email,
      },
    }

    // Add message optimistically (show immediately)
    dispatch({ type: 'ADD_MESSAGE', payload: tempMessage })

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          content,
          message_type: messageType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()
      const realMessage = result.data.message
      
      // Replace temp message with real message from server
      dispatch({ type: 'REPLACE_MESSAGE', payload: { oldId: tempMessage.id, newMessage: realMessage } })
      
      // If this is a new conversation (temp conversation), add it to conversations list
      if (state.currentConversation?.id?.startsWith('temp-')) {
        // Check if conversation already exists in the list
        const existingConv = state.conversations.find(
          conv => conv.other_user.id === recipientId
        )
        
        if (!existingConv) {
          // Create new conversation object from the message response
          const newConversation: ChatConversation = {
            id: result.data.conversation_id || `conv-${recipientId}`,
            other_user: state.currentConversation.other_user,
            last_message: realMessage,
            last_message_at: realMessage.created_at,
            created_at: new Date().toISOString(),
          }
          
          // Add to conversations list
          dispatch({ type: 'SET_CONVERSATIONS', payload: [newConversation, ...state.conversations] })
          
          // Update current conversation with real ID
          dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: newConversation })
        } else {
          // Update existing conversation
          const updatedConversation = {
            ...existingConv,
            last_message: realMessage,
            last_message_at: realMessage.created_at,
          }
          dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation })
          dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: updatedConversation })
        }
      } else {
        // Update existing conversation's last message
        if (state.currentConversation) {
          const updatedConversation = {
            ...state.currentConversation,
            last_message: realMessage,
            last_message_at: realMessage.created_at,
          }
          dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation })
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      // Remove failed message
      dispatch({ type: 'REMOVE_MESSAGE', payload: tempMessage.id })
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' })
    }
  }, [user, state.currentConversation, state.conversations])

  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await fetch('/api/chat/conversations')
      if (!response.ok) {
        throw new Error('Failed to load conversations')
      }

      const result = await response.json()
      dispatch({ type: 'SET_CONVERSATIONS', payload: result.data.conversations })
    } catch (error) {
      console.error('Load conversations error:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversations' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user])

  const loadMessages = useCallback(async (userId: string) => {
    if (!user) return

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await fetch(`/api/chat/messages?user_id=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }

      const result = await response.json()
      dispatch({ type: 'SET_MESSAGES', payload: result.data.messages })
    } catch (error) {
      console.error('Load messages error:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user])

  const selectConversation = useCallback((conversation: ChatConversation) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation })
    // Don't clear messages here - let ChatWindow handle loading
    // This prevents flickering and allows ChatWindow to manage its own loading state
    // ChatWindow will detect the conversation change and load messages
  }, [])

  const searchUsers = useCallback(async (query: string): Promise<ChatUser[]> => {
    if (!user || !query.trim()) return []

    try {
      const response = await fetch(`/api/chat/users?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search users')
      }

      const result = await response.json()
      return result.data.users
    } catch (error) {
      console.error('Search users error:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to search users' })
      return []
    }
  }, [user])

  const value: ChatContextType = {
    state,
    sendMessage,
    loadConversations,
    loadMessages,
    selectConversation,
    searchUsers,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
