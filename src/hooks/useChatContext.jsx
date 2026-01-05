import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

const ChatContext = createContext({})

/**
 * Custom hook to access chat context
 * Must be used within ChatProvider
 */
export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}

/**
 * Chat Context Provider
 * Provides global chat state and auto-detects user type
 */
export function ChatProvider({ children }) {
  const { user, profile } = useAuth()
  const [conversationType, setConversationType] = useState(null)
  const [isDetecting, setIsDetecting] = useState(true)

  // Auto-detect user type based on business ownership
  useEffect(() => {
    async function detectUserType() {
      if (!user) {
        setConversationType(null)
        setIsDetecting(false)
        return
      }

      try {
        // Check if user owns a business
        const { data: businesses, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (error) throw error

        // If user has a business, they get sales assistant
        // Otherwise, they get service assistant
        const type = businesses && businesses.length > 0
          ? 'sales_assistant'
          : 'service_assistant'

        setConversationType(type)
      } catch (error) {
        console.error('Error detecting user type:', error)
        // Default to service assistant on error
        setConversationType('service_assistant')
      } finally {
        setIsDetecting(false)
      }
    }

    detectUserType()
  }, [user])

  const value = {
    conversationType,
    isDetecting,
    setConversationType
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
