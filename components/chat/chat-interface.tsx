'use client'

import React, { useState, useEffect } from 'react'
import { ChatProvider, useChat } from '@/contexts/chat-context'
import { ChatList } from './chat-list'
import { ChatWindow } from './chat-window'
import { UserSearchModal } from './user-search-modal'
import { Button } from '@/components/ui/button'
import { MessageSquare, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface ChatInterfaceProps {
  conversationId?: string
}

function ChatInterfaceContent({ conversationId }: ChatInterfaceProps) {
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const { state, loadConversations, selectConversation } = useChat()

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (conversationId && state.conversations.length > 0) {
      const conversation = state.conversations.find(c => c.id === conversationId)
      if (conversation) {
        selectConversation(conversation)
      }
    }
  }, [conversationId, state.conversations, selectConversation])

  // On mobile, show list if no conversation is selected
  const showMobileList = !state.currentConversation

  return (
    <div className="flex h-full gap-4">
      {/* Desktop: Sidebar with conversations */}
      <div className="hidden md:flex w-80 lg:w-96 flex-shrink-0 bg-card border-2 rounded-lg flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-hidden">
          <ChatList />
        </div>
        <div className="p-4 border-t border-border bg-muted/30">
          <UserSearchModal />
        </div>
      </div>

      {/* Mobile: Show conversation list when no conversation is selected */}
      {showMobileList ? (
        <div className="md:hidden w-full bg-card border-2 rounded-lg flex-col overflow-hidden shadow-sm flex">
          <div className="flex-1 overflow-hidden">
            <ChatList onSelectConversation={() => {}} />
          </div>
          <div className="p-4 border-t border-border bg-muted/30">
            <UserSearchModal />
          </div>
        </div>
      ) : (
        /* Mobile: Show chat window when conversation is selected */
        <div className="md:hidden w-full bg-card border-2 rounded-lg overflow-hidden shadow-sm flex flex-col">
          <ChatWindow onBackToConversations={() => selectConversation(null)} />
        </div>
      )}
      
      {/* Desktop: Main chat area */}
      <div className="hidden md:flex flex-1 bg-card border-2 rounded-lg overflow-hidden shadow-sm">
        <ChatWindow />
      </div>
    </div>
  )
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  return (
    <ChatProvider>
      <ChatInterfaceContent conversationId={conversationId} />
    </ChatProvider>
  )
}