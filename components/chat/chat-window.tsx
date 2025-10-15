'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useChat } from '@/contexts/chat-context'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function ChatWindow() {
  const { state, sendMessage } = useChat()
  const { user } = useAuth()
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentConversation = state.currentConversation

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentConversation || isSending) return

    setIsSending(true)
    try {
      await sendMessage(currentConversation.other_user.id, messageText.trim())
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center max-w-sm">
          <div className="text-muted-foreground mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">Select a conversation</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden md:inline">Choose a conversation from the sidebar to start messaging</span>
            <span className="md:hidden">Tap the message button to view conversations</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Chat Header */}
      <div className="p-2 sm:p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={currentConversation.other_user.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {currentConversation.other_user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-card-foreground truncate">{currentConversation.other_user.name}</h3>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{currentConversation.other_user.email}</p>
          </div>
          <div className="ml-auto">
            <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-2 sm:p-3">
        {state.loading ? (
          <div className="text-center text-sm text-muted-foreground">Loading messages...</div>
        ) : state.messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[75%] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isOwnMessage && (
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarImage src={message.sender?.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {message.sender?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`rounded-md px-2 py-1.5 ${
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-0.5 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-2 sm:p-4 border-t border-border/30 bg-card">
        <div className="flex gap-1 sm:gap-2">
          <div className="flex-1 relative">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
              className="pr-16 sm:pr-20 h-9 sm:h-10 text-sm bg-background border-input"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-0.5 sm:gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0 hidden sm:flex">
                <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0 hidden sm:flex">
                <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            size="sm"
            className="px-2 sm:px-3 h-9 sm:h-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
