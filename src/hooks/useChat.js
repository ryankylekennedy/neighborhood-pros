import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from './useToast'

/**
 * Custom hook for managing AI chat functionality
 * Handles conversations, messages, streaming, and API calls
 */
export function useChat({ conversationType }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const abortControllerRef = useRef(null)

  // Fetch all conversations for the user
  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_type', conversationType)
        .order('last_message_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      })
    }
  }, [user, conversationType])

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Send a message and stream the response
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isStreaming) return

    try {
      setIsStreaming(true)
      setStreamingMessage('')

      // Add user message to UI immediately (optimistic update)
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMessage])

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Call edge function with streaming
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: currentConversation?.id || null,
          message: content,
          conversationType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Handle streamed response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      let newConversationId = currentConversation?.id

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.text) {
                fullResponse += data.text
                setStreamingMessage(fullResponse)
              }

              if (data.done) {
                newConversationId = data.conversationId

                // Add assistant message to messages
                const assistantMessage = {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: fullResponse,
                  created_at: new Date().toISOString()
                }

                setMessages(prev => [...prev, assistantMessage])
                setStreamingMessage('')

                // If new conversation, update current conversation
                if (!currentConversation && newConversationId) {
                  fetchConversations() // Refresh conversation list
                  const { data } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('id', newConversationId)
                    .single()

                  if (data) {
                    setCurrentConversation(data)
                  }
                }
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      })

      // Remove optimistic user message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
    } finally {
      setIsStreaming(false)
    }
  }, [currentConversation, conversationType, isStreaming, fetchConversations])

  // Create a new conversation
  const createConversation = useCallback(() => {
    setCurrentConversation(null)
    setMessages([])
  }, [])

  // Select an existing conversation
  const selectConversation = useCallback(async (conversation) => {
    setCurrentConversation(conversation)
    await fetchMessages(conversation.id)
  }, [fetchMessages])

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      setConversations(prev => prev.filter(c => c.id !== conversationId))

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }

      toast({
        title: 'Conversation deleted',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive'
      })
    }
  }, [currentConversation])

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    streamingMessage,
    sendMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    fetchConversations
  }
}
