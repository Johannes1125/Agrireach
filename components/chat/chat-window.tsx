"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@/contexts/chat-context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatWindowProps {
  onBackToConversations?: () => void;
}

export function ChatWindow({ onBackToConversations }: ChatWindowProps = {} as ChatWindowProps) {
  const { state, sendMessage, loadMessages } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedConversationIdRef = useRef<string | null>(null);

  const currentConversation = state.currentConversation;

  // Deduplicate messages by ID before rendering
  const uniqueMessages = useMemo(() => {
    const seenIds = new Set<string>()
    return state.messages.filter((message) => {
      const msgId = message.id?.toString() || (message as any)._id?.toString() || ''
      if (!msgId || seenIds.has(msgId)) {
        return false
      }
      seenIds.add(msgId)
      return true
    })
  }, [state.messages])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      const conversationUserId = currentConversation.other_user.id?.toString() || currentConversation.other_user.id;
      const loadedUserId = loadedConversationIdRef.current?.toString() || loadedConversationIdRef.current;
      
      if (conversationUserId !== loadedUserId) {
        loadedConversationIdRef.current = conversationUserId;
        // Clear messages first to avoid showing old messages from previous conversation
        // The loadMessages function will set loading state
        loadMessages(currentConversation.other_user.id);
      }
    } else {
      // Reset when no conversation is selected
      loadedConversationIdRef.current = null;
    }
  }, [currentConversation, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentConversation || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(currentConversation.other_user.id, messageText.trim());
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center max-w-sm">
          <div className="text-muted-foreground mb-4">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">
            Select a conversation
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden md:inline">
              Choose a conversation from the sidebar to start messaging
            </span>
            <span className="md:hidden">
              Tap the message button to view conversations
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Enhanced Chat Header */}
      <div className="p-3 sm:p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          {/* Mobile: Back button */}
          {onBackToConversations && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToConversations}
              className="md:hidden flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border flex-shrink-0">
            <AvatarImage src={currentConversation.other_user.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {currentConversation.other_user.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
              {currentConversation.other_user.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {currentConversation.other_user.email}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                state.isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {state.isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div 
          ref={scrollAreaRef}
          className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin p-4"
        >
          {state.messages.length === 0 && !state.loading ? (
            <div className="text-center text-sm text-muted-foreground mt-6">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueMessages.map((message, i) => {
              const messageData = message as any;
              // Handle both string IDs and ObjectId comparisons
              const rawSenderId = messageData?.sender_id;
              const messageSenderId =
                rawSenderId && typeof rawSenderId === "object" && "_id" in rawSenderId
                  ? rawSenderId._id?.toString()
                  : rawSenderId?.toString?.() ?? rawSenderId;
              const currentUserId = user?.id?.toString() || user?.id
              const isOwnMessage = messageSenderId === currentUserId
              
              // Use message ID as key (messages are now deduplicated)
              const messageId = message.id?.toString() || (message as any)._id?.toString() || `temp-${i}-${message.created_at || Date.now()}`
              
              return (
                <div
                  key={messageId}
                  className={`flex items-end gap-3 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.sender?.avatar || currentConversation.other_user.avatar} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {message.sender?.name?.charAt(0).toUpperCase() || currentConversation.other_user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[75%] sm:max-w-xs lg:max-w-md border-2 ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground border-primary/30 shadow-sm"
                        : "bg-muted/70 dark:bg-muted/50 text-foreground border-border"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-1.5 ${
                        isOwnMessage
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Message Input */}
      <div className="p-3 sm:p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
              className="h-10 sm:h-11 text-sm bg-background border-border"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            size="sm"
            className="px-3 sm:px-4 h-10 sm:h-11 bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
