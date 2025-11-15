'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatProvider, useChat } from '@/contexts/chat-context'
import { ChatList } from './chat-list'
import { ChatWindow } from './chat-window'
import { ChatbotWindow } from './chatbot-window'
import { UserSearchModal } from './user-search-modal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Bot, X, ChevronDown, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatWidgetContentProps {
  onClose: () => void
}

function ChatWidgetContent({ onClose }: ChatWidgetContentProps) {
  const { state } = useChat()
  const [activeTab, setActiveTab] = useState<'chats' | 'chatbot'>('chats')
  const [isMinimized, setIsMinimized] = useState(false)
  const [showChatWindow, setShowChatWindow] = useState(false)

  // Show chat window when a conversation is selected
  useEffect(() => {
    if (state.currentConversation) {
      setShowChatWindow(true)
    }
  }, [state.currentConversation])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
      }}
      style={{
        height: isMinimized ? 64 : undefined,
        maxHeight: isMinimized ? undefined : '600px',
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 right-0 md:bottom-4 md:right-4 z-50 w-full h-full md:w-96 md:h-[600px] bg-card border md:rounded-lg shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header - only show when not in chat window */}
      {!showChatWindow && (
        <div className="flex items-center justify-between p-3 border-b bg-card flex-shrink-0">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => {
              setActiveTab(v as 'chats' | 'chatbot')
              setShowChatWindow(false)
            }} 
            className="flex-1"
          >
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="chats" className="flex items-center gap-2 text-xs">
                <MessageSquare className="h-4 w-4" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="flex items-center gap-2 text-xs">
                <Bot className="h-4 w-4" />
                Chatbot
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
              aria-label={isMinimized ? "Expand" : "Minimize"}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isMinimized && "rotate-180")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {!isMinimized && (
          <motion.div
            key={showChatWindow ? 'chat-window' : activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {showChatWindow && state.currentConversation ? (
              <>
                <div className="flex items-center gap-2 p-3 border-b bg-card flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChatWindow(false)}
                    className="h-8 w-8 p-0"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {state.currentConversation.other_user.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  <ChatWindow />
                </div>
              </>
            ) : activeTab === 'chats' ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-hidden min-h-0">
                  <ChatList onSelectConversation={() => setShowChatWindow(true)} />
                </div>
                <div className="p-2 border-t bg-card flex-shrink-0">
                  <UserSearchModal />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                <ChatbotWindow />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </motion.div>
    )
  }

  return (
    <ChatProvider>
      <ChatWidgetContent onClose={() => setIsOpen(false)} />
    </ChatProvider>
  )
}
