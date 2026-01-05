import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Loader2 } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { ChatInput } from './ChatInput'
import { useChat } from '@/hooks/useChat'
import { useChatContext } from '@/hooks/useChatContext'

/**
 * Main chat interface component
 * Displays message history, handles user input, and manages chat state
 */
export function ChatInterface() {
  const { conversationType, isDetecting } = useChatContext()
  const {
    messages,
    isLoading,
    isStreaming,
    streamingMessage,
    sendMessage,
  } = useChat({ conversationType })

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingMessage])

  // Show loading while detecting user type
  if (isDetecting) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading chat...</p>
        </div>
      </div>
    )
  }

  // Empty state for new conversations
  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex flex-col h-full bg-white" data-testid="chat-interface">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        data-testid="chat-messages-container"
      >
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-6"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {conversationType === 'service_assistant'
                ? 'How can I help you today?'
                : 'Welcome to The Neighborhood Collective'}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm">
              {conversationType === 'service_assistant'
                ? 'Ask me anything about finding local professionals and services in your neighborhood.'
                : 'Let me help you get started on our platform. What questions do you have about becoming an Exclusive Neighborhood Favorite?'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
        )}

        {/* Streaming message with typing indicator */}
        {isStreaming && (
          <div className="flex flex-col gap-4">
            {streamingMessage ? (
              <MessageBubble
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingMessage,
                  created_at: new Date().toISOString(),
                }}
              />
            ) : (
              <TypingIndicator />
            )}
          </div>
        )}

        {/* Loading indicator for fetching messages */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming || isDetecting}
        placeholder={
          conversationType === 'service_assistant'
            ? 'Ask about local professionals...'
            : 'Ask about joining our platform...'
        }
      />
    </div>
  )
}
