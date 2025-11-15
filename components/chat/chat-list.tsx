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
    
    // Always call onSelectConversation if provided (for widget)
    if (onSelectConversation) {
      onSelectConversation()
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Enhanced Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Messages
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {state.loading && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Loading conversations...
            </div>
          )}
          {!state.loading && filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          )}
          {filteredConversations.map((conversation) => {
            const isSelected = state.currentConversation?.id === conversation.id
            return (
              <button
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`w-full p-3 rounded-lg mb-2 text-left transition-all duration-200 border-2 ${
                  isSelected
                    ? 'bg-primary/10 border-primary/50 shadow-sm'
                    : 'bg-muted/50 border-border hover:bg-muted/70 dark:hover:bg-card/50 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src={conversation.other_user.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {conversation.other_user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversation.other_user.name}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.last_message?.text || 'No messages yet'}
                    </p>
                    {conversation.last_message?.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
