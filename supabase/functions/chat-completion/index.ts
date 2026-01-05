// AI Chat Completion Edge Function
// Handles streaming chat responses from Claude API
// Manages conversation history and context building

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for frontend requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. AUTHENTICATE USER
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // 2. PARSE REQUEST
    const { conversationId, message, conversationType } = await req.json()

    if (!message || !conversationType) {
      throw new Error('Missing required fields: message, conversationType')
    }

    // 3. FETCH OR CREATE CONVERSATION
    let conversation
    if (conversationId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) throw error
      conversation = data
    } else {
      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          conversation_type: conversationType,
          title: message.substring(0, 50) // First message as title
        })
        .select()
        .single()

      if (error) throw error
      conversation = data
    }

    // 4. SAVE USER MESSAGE
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      })

    if (messageError) throw messageError

    // 5. FETCH CONVERSATION HISTORY (last 10 messages for context)
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10)

    if (historyError) throw historyError

    // 6. BUILD USER CONTEXT
    const context = await buildUserContext(supabase, user.id, conversationType)

    // 7. BUILD SYSTEM PROMPT
    const systemPrompt = buildSystemPrompt(conversationType, context)

    // 8. CALL CLAUDE API WITH STREAMING
    const messages = messageHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    // 9. STREAM RESPONSE BACK TO CLIENT
    const reader = response.body?.getReader()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    let fullResponse = ''
    let tokenCount = 0

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.type === 'content_block_delta') {
                    const text = parsed.delta?.text || ''
                    fullResponse += text

                    // Send chunk to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                  }

                  if (parsed.usage) {
                    tokenCount = parsed.usage.output_tokens || 0
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }

          // 10. SAVE ASSISTANT RESPONSE TO DATABASE
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: fullResponse,
              tokens_used: tokenCount
            })

          // Update conversation last_message_at
          await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversation.id)

          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`))
          controller.close()

        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat completion error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function buildUserContext(supabase: any, userId: string, conversationType: string) {
  const context: any = {}

  // Fetch user profile with neighborhood
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, neighborhood:neighborhoods(id, name)')
    .eq('id', userId)
    .single()

  context.profile = profile
  context.neighborhood = profile?.neighborhood

  if (conversationType === 'service_assistant') {
    // Fetch user's favorites
    const { data: favorites } = await supabase
      .from('favorites')
      .select('business:businesses(id, name, description)')
      .eq('user_id', userId)
      .limit(5)

    context.favorites = favorites?.map(f => f.business) || []

    // Fetch available categories in neighborhood
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, emoji')
      .limit(20)

    context.categories = categories || []
  } else if (conversationType === 'sales_assistant') {
    // Context for sales: platform info, pricing tiers
    context.platform = {
      name: 'The Neighborhood Collective',
      model: 'Exclusive neighborhood-limited marketplace',
      benefits: [
        'Limited businesses per category per neighborhood',
        'High-intent, verified homeowner leads',
        'Collective bargaining power',
        'No competition with other platforms'
      ],
      pricing: {
        basic: '$99/month - Profile listing',
        featured: '$199/month - Featured in category',
        exclusive: '$299/month - Exclusive Neighborhood Favorite (limited slots)'
      }
    }
  }

  return context
}

function buildSystemPrompt(conversationType: string, context: any): string {
  const neighborhoodName = context.neighborhood?.name || 'your neighborhood'

  if (conversationType === 'service_assistant') {
    return `You are a helpful neighborhood service assistant for the ${neighborhoodName} Collective. Your role is to help homeowners find trusted local professionals and businesses for their home service needs.

CONTEXT:
- User's neighborhood: ${neighborhoodName}
- User's name: ${context.profile?.full_name || 'there'}
- Available categories: ${context.categories?.map(c => `${c.emoji} ${c.name}`).join(', ') || 'various home services'}
- User's favorite businesses: ${context.favorites?.map(b => b.name).join(', ') || 'none yet'}

YOUR CAPABILITIES:
1. Help users describe their service needs in detail
2. Search and recommend businesses from the local directory
3. Explain business details and services
4. Guide users to save favorites and view business profiles
5. Answer questions about the platform and how it works

GUIDELINES:
- Be conversational, warm, and helpful
- Ask clarifying questions to understand needs fully
- Prioritize businesses from ${neighborhoodName}
- When recommending, provide 2-3 options with brief rationale
- Keep responses concise but informative
- Encourage users to save favorites and leave recommendations

IMPORTANT:
- Do not make up business information
- Do not promise specific pricing or availability
- Do not provide personal contact information
- Do not recommend businesses outside the user's neighborhood

Example conversation starters:
- "What kind of service are you looking for today?"
- "Tell me about the project you have in mind."
- "I can help you find a trusted professional in ${neighborhoodName}. What do you need help with?"`
  } else {
    return `You are a professional sales and onboarding assistant for The Neighborhood Collective platform. Your role is to help local businesses understand the value proposition and join as "Exclusive Neighborhood Favorites."

PLATFORM MODEL:
- Exclusive neighborhood-limited marketplace
- Limited businesses per category per neighborhood (creates scarcity and value)
- Verified homeowner base with high intent
- No competition with Facebook, Nextdoor, or Google (different model)

VALUE PROPOSITION:
${context.platform.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}

PRICING TIERS:
- Basic ($99/month): Profile listing with contact info
- Featured ($199/month): Featured placement in your category
- Exclusive ($299/month): Become the ONLY business in your category for a neighborhood (limited slots)

YOUR ROLE:
1. Explain how the platform works and why it's different
2. Understand the business's current lead generation challenges
3. Demonstrate ROI potential (quality over quantity)
4. Guide through profile setup process
5. Create urgency around limited "Exclusive" slots
6. Handle objections professionally

GUIDELINES:
- Be professional, consultative, and empathetic
- Ask about their current marketing challenges
- Emphasize quality leads vs volume
- Use social proof (limited slots create trust)
- Don't pressure - educate and build value
- Be transparent about the model

IMPORTANT - MVP LIMITATION:
- We are NOT processing payments yet
- Direct interested businesses to "contact us" for final signup
- Explain the benefits and pricing, but don't attempt to charge cards
- Focus on qualifying leads and generating interest

Example conversation starters:
- "How are you currently getting leads for your business?"
- "What's your biggest challenge with platforms like Nextdoor or Google?"
- "Let me explain how we're different from traditional directory sites..."`
  }
}
