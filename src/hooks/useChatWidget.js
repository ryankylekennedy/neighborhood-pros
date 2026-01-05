import { useState, useEffect } from 'react'

/**
 * Custom hook for managing chat widget UI state
 * Handles open/close state, unread counts, and positioning
 */
export function useChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  // Toggle widget open/close
  const toggle = () => setIsOpen(prev => !prev)

  // Explicit open/close functions
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  // Reset unread count when widget is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      setHasNewMessage(false)
    }
  }, [isOpen])

  // Increment unread count (call this when new message arrives while closed)
  const incrementUnread = () => {
    if (!isOpen) {
      setUnreadCount(prev => prev + 1)
      setHasNewMessage(true)
    }
  }

  return {
    isOpen,
    toggle,
    open,
    close,
    unreadCount,
    hasNewMessage,
    incrementUnread
  }
}
