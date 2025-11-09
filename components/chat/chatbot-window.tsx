'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Bot } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
}

export function ChatbotWindow() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AgriReach assistant. How can I help you today?',
      createdAt: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to get response'
        let errorDetails = ''
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          errorDetails = errorData.details || ''
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        
        const fullError = errorDetails 
          ? `${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`
          : errorMessage
        
        console.error('Chatbot API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          details: errorDetails
        })
        
        throw new Error(fullError)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let assistantMessage = ''

      const assistantMessageId = (Date.now() + 1).toString()
      // Create empty message immediately for streaming
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        },
      ])

      let buffer = ''
      let hasReceivedContent = false
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('0:')) {
            const data = line.slice(2)
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'text-delta' && parsed.textDelta) {
                assistantMessage += parsed.textDelta
                hasReceivedContent = true
              } else if (typeof parsed === 'string') {
                assistantMessage += parsed
                hasReceivedContent = true
              }
            } catch {
              // If not JSON, treat as plain text
              assistantMessage += data
              hasReceivedContent = true
            }
            
            // Update message in real-time as content streams
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: assistantMessage }
                  : msg
              )
            )
          }
        }
      }
      
      // Set loading to false once streaming is complete
      setIsLoading(false)
    } catch (error) {
      console.error('Chatbot error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Sorry, I encountered an error. Please try again.'
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorMessage.includes('OpenAI API key') 
            ? 'The chatbot is not configured. Please contact the administrator to set up the OpenAI API key.'
            : errorMessage,
          createdAt: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            // Only show loading indicator if message is empty and we're still loading
            const showLoading = !message.content && isLoading && message.role === 'assistant'
            
            return (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.content ? (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.createdAt && (
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      )}
                    </>
                  ) : showLoading ? (
                    <div className="flex gap-1 py-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-70" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-70" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-70" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : null}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

