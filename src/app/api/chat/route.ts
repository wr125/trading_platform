import { StreamingTextResponse, OpenAIStream, AnthropicStream } from 'ai'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

async function fetchPerplexityStream(messages: any[]) {
  const formattedMessages = messages.map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }))

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: formattedMessages,
      stream: true
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Perplexity API error: ${response.statusText}`, { cause: error })
  }

  // Use OpenAIStream since Perplexity follows OpenAI's format
  return OpenAIStream(response)
}

export const runtime = 'edge' // Use Edge Runtime

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !model) {
      return new Response(
        JSON.stringify({ error: 'Messages and model are required' }), 
        { status: 400 }
      )
    }

    let stream

    switch (model) {
      case 'gpt-4':
        const openaiResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: messages.map((m: any) => ({
            role: m.role,
            content: m.content
          })),
          temperature: 0.7,
          stream: true,
        })
        stream = OpenAIStream(openaiResponse)
        break

      case 'claude-3-sonnet':
        const anthropicResponse = await anthropic.messages.create({
          model: 'claude-3-sonnet',
          max_tokens: 4096,
          temperature: 0.7,
          system: "You are an AI trading assistant. Help users with market analysis, trading strategies, and portfolio management.",
          messages: messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          stream: true,
        })
        stream = AnthropicStream(anthropicResponse)
        break

      case 'sonar':
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: messages.map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content
            })),
            stream: true
          })
        })

        if (!perplexityResponse.ok) {
          throw new Error(`Perplexity API error: ${perplexityResponse.statusText}`)
        }

        stream = OpenAIStream(perplexityResponse)
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid model specified' }), 
          { status: 400 }
        )
    }

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({
        error: 'Error processing chat request',
        message: error.message,
        details: error.response?.data || error.cause || {}
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 