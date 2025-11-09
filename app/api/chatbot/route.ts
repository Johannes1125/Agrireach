import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getCurrentUser } from '@/lib/auth-server'

export async function POST(req: Request) {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Try to get user, but don't fail if not authenticated (optional auth for chatbot)
    let user = null
    try {
      user = await getCurrentUser()
    } catch (authError) {
      console.warn('Auth check failed (continuing anyway):', authError)
      // Continue without auth - chatbot can work for unauthenticated users
    }

    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing chatbot request with', messages.length, 'messages')

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      maxTokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for AgriReach, a platform connecting rural agricultural workers with opportunities. 
          Help users with questions about farming, job opportunities, marketplace, learning resources, and platform features.
          Be friendly, professional, and knowledgeable about agriculture.`,
        },
        ...messages,
      ],
    } as any)

    console.log('Stream text result created successfully')
    console.log('Available methods on result:', Object.keys(result))
    
    // Manual streaming implementation for AI SDK v5
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Try different streaming methods
          const textStream = (result as any).textStream
          const fullStream = (result as any).fullStream
          
          if (textStream && typeof textStream === 'function') {
            // Use textStream() method
            for await (const chunk of textStream()) {
              const data = `0:${JSON.stringify({ type: 'text-delta', textDelta: chunk })}\n`
              controller.enqueue(encoder.encode(data))
            }
          } else if (fullStream && typeof fullStream === 'function') {
            // Use fullStream() method
            for await (const chunk of fullStream()) {
              if (chunk.type === 'text-delta') {
                const data = `0:${JSON.stringify({ type: 'text-delta', textDelta: chunk.textDelta })}\n`
                controller.enqueue(encoder.encode(data))
              }
            }
          } else {
            // Fallback: stream the text word by word
            const text = await (result as any).text
            const words = text.split(' ')
            for (let i = 0; i < words.length; i++) {
              const chunk = (i === 0 ? '' : ' ') + words[i]
              const data = `0:${JSON.stringify({ type: 'text-delta', textDelta: chunk })}\n`
              controller.enqueue(encoder.encode(data))
              // Small delay for streaming effect
              await new Promise(resolve => setTimeout(resolve, 20))
            }
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chatbot error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error && error.stack ? error.stack.split('\n')[0] : ''
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

