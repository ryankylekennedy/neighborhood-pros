import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useChatWidget } from '@/hooks/useChatWidget'
import { useAuth } from '@/hooks/useAuth'
import { ChatInterface } from './ChatInterface'

/**
 * Floating chat widget
 * Bottom-right positioned button that toggles chat interface
 * Only visible to authenticated users
 */
export function ChatWidget() {
  const { user } = useAuth()
  const { isOpen, toggle, unreadCount, hasNewMessage } = useChatWidget()

  // Only show to authenticated users
  if (!user) {
    return null
  }

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200"
            data-testid="chat-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">Chat Assistant</h3>
              </div>
              <button
                onClick={toggle}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                data-testid="chat-close-button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat interface */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 sm:right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors flex items-center justify-center z-40"
        data-testid="chat-widget-button"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {/* Unread badge */}
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
            {/* New message indicator (pulsing dot) */}
            {hasNewMessage && unreadCount === 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"
              />
            )}
          </>
        )}
      </motion.button>
    </>
  )
}
