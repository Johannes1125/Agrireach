'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Bot } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Simple markdown renderer for basic formatting
function renderMarkdown(text: string) {
  if (!text) return null
  
  // Split by lines to handle paragraphs and lists
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: string[] = []
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="ml-2">{renderInlineMarkdown(item.trim())}</li>
          ))}
        </ul>
      )
      listItems = []
      inList = false
    }
  }
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    
    // Handle list items
    if (trimmed.match(/^[-*]\s/)) {
      if (!inList) {
        flushList()
        inList = true
      }
      listItems.push(trimmed.substring(2))
      return
    }
    
    // Handle numbered lists
    if (trimmed.match(/^\d+\.\s/)) {
      if (!inList) {
        flushList()
        inList = true
      }
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
      return
    }
    
    // Flush list if we hit a non-list line
    if (inList) {
      flushList()
    }
    
    // Handle empty lines (paragraph breaks)
    if (trimmed === '') {
      if (elements.length > 0 && elements[elements.length - 1] !== null) {
        elements.push(null) // Paragraph break
      }
      return
    }
    
    // Handle headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${idx}`} className="font-semibold text-base mt-3 mb-2">
          {renderInlineMarkdown(trimmed.substring(4))}
        </h3>
      )
      return
    }
    
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${idx}`} className="font-semibold text-lg mt-4 mb-2">
          {renderInlineMarkdown(trimmed.substring(3))}
        </h2>
      )
      return
    }
    
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${idx}`} className="font-bold text-xl mt-4 mb-3">
          {renderInlineMarkdown(trimmed.substring(2))}
        </h1>
      )
      return
    }
    
    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="mb-2 last:mb-0">
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  })
  
  flushList()
  
  // Filter out nulls and add paragraph breaks
  const result: React.ReactNode[] = []
  elements.forEach((el, idx) => {
    if (el === null && idx > 0) {
      result.push(<br key={`br-${idx}`} />)
    } else if (el !== null) {
      result.push(el)
    }
  })
  
  return result.length > 0 ? <>{result}</> : <p>{text}</p>
}

// Render inline markdown (bold, italic, code)
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let currentIndex = 0
  
  // Pattern for **bold**, *italic*, `code`, and links
  const patterns = [
    { 
      regex: /\*\*(.+?)\*\*/g, 
      render: (content: string) => <strong key={`bold-${currentIndex++}`}>{content}</strong> 
    },
    { 
      regex: /\*(.+?)\*/g, 
      render: (content: string) => <em key={`italic-${currentIndex++}`}>{content}</em> 
    },
    { 
      regex: /`(.+?)`/g, 
      render: (content: string) => (
        <code key={`code-${currentIndex++}`} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
          {content}
        </code>
      ) 
    },
    { 
      regex: /\[([^\]]+)\]\(([^)]+)\)/g, 
      render: (linkText: string, url: string) => (
        <a 
          key={`link-${currentIndex++}`} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary underline hover:text-primary/80"
        >
          {linkText}
        </a>
      ) 
    },
  ]
  
  let lastIndex = 0
  const matches: Array<{ index: number; length: number; render: React.ReactNode }> = []
  
  patterns.forEach(({ regex, render }) => {
    let match
    regex.lastIndex = 0
    while ((match = regex.exec(text)) !== null) {
      // For links, match[1] is text, match[2] is URL
      // For others, match[1] is content
      let renderResult: React.ReactNode
      if (match.length === 3) {
        // Link pattern
        renderResult = (render as (linkText: string, url: string) => React.ReactNode)(match[1], match[2])
      } else {
        // Other patterns (bold, italic, code)
        renderResult = (render as (content: string) => React.ReactNode)(match[1])
      }
      
      matches.push({
        index: match.index,
        length: match[0].length,
        render: renderResult
      })
    }
  })
  
  // Sort matches by index
  matches.sort((a, b) => a.index - b.index)
  
  // Remove overlapping matches (keep first)
  const filteredMatches: Array<{ index: number; length: number; render: React.ReactNode }> = []
  matches.forEach(match => {
    const overlaps = filteredMatches.some(fm => 
      (match.index >= fm.index && match.index < fm.index + fm.length) ||
      (fm.index >= match.index && fm.index < match.index + match.length)
    )
    if (!overlaps) {
      filteredMatches.push(match)
    }
  })
  
  // Build result
  filteredMatches.forEach((match) => {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    // Add rendered match
    parts.push(match.render)
    lastIndex = match.index + match.length
  })
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  return parts.length > 0 ? <>{parts}</> : text
}

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
    <div className="flex flex-col h-full bg-card overflow-hidden">
      <div className="flex-1 overflow-hidden min-h-0">
        <div 
          className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin p-4"
        >
          {messages.map((message) => {
            // Only show loading indicator if message is empty and we're still loading
            const showLoading = !message.content && isLoading && message.role === 'assistant'
            
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
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
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                        {message.role === 'assistant' ? renderMarkdown(message.content) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      {message.createdAt && (
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'opacity-80' : 'opacity-70'}`}>
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
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
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
      </div>

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

