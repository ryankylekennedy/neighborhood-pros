import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileMenu({
  isOpen,
  onClose,
  user,
  profile,
  onSignOut,
  onSignInClick,
  onSignUpClick
}) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="md:hidden border-t bg-background"
    >
      <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
        <Link
          to="/"
          className="px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          onClick={onClose}
        >
          Browse Professionals
        </Link>
        {user && profile?.neighborhood_id && (
          <Link
            to="/admin/invites"
            className="px-4 py-3 rounded-lg hover:bg-muted transition-colors"
            onClick={onClose}
          >
            Manage Invites
          </Link>
        )}
        <div className="border-t my-2" />
        {user ? (
          <>
            <Link
              to="/profile"
              className="px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              onClick={onClose}
            >
              <User size={18} />
              {profile?.full_name || 'Profile'}
            </Link>
            <button
              className="px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-left w-full"
              onClick={() => {
                onSignOut()
                onClose()
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button
              className="px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
              onClick={() => {
                onSignInClick()
                onClose()
              }}
            >
              Sign In
            </button>
            <Button
              className="mx-4"
              onClick={() => {
                onSignUpClick()
                onClose()
              }}
            >
              Get Started
            </Button>
          </>
        )}
      </div>
    </motion.div>
  )
}
