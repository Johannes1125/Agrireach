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

  return (
    <div className="flex h-full gap-4">
      {/* Desktop: Sidebar with conversations */}
      <div className="hidden md:flex w-80 lg:w-96 flex-shrink-0 bg-card border rounded-lg flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatList />
        </div>
        <div className="p-4 border-t bg-card">
          <UserSearchModal />
        </div>
      </div>

      {/* Mobile: Sheet for conversations list */}
      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetTrigger asChild className="md:hidden fixed bottom-4 right-4 z-50">
          <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-96 p-0">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <ChatList onSelectConversation={() => setMobileListOpen(false)} />
            </div>
            <div className="p-4 border-t bg-card">
              <UserSearchModal />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main chat area - full width on mobile, flex-1 on desktop */}
      <div className="flex-1 bg-card border rounded-lg overflow-hidden">
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