'use client'

import React, { useState, useEffect } from 'react'
import { useChat } from '@/contexts/chat-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, MessageCircle, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChatListProps {
  onSelectConversation?: () => void
}

export function ChatList({ onSelectConversation }: ChatListProps = {}) {
  const { state, loadConversations, selectConversation } = useChat()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const filteredConversations = state.conversations.filter(conv =>
    conv.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectConversation = (conversation: any) => {
    selectConversation(conversation)
    onSelectConversation?.()
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <h2 className="text-sm font-medium flex items-center gap-2 text-card-foreground">
          <MessageCircle className="h-4 w-4" />
          Messages
        </h2>
        <div className="mt-2 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-sm bg-background border-input"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {state.loading ? (
          <div className="p-3 text-center text-sm text-muted-foreground">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="p-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  state.currentConversation?.id === conversation.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conversation.other_user.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {conversation.other_user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-xs truncate text-card-foreground">
                        {conversation.other_user.name}
                      </h3>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground ml-1">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    
                    {conversation.last_message ? (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conversation.last_message.content}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No messages yet</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
