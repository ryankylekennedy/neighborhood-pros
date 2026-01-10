import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { AuthDialog } from '@/components/AuthDialog'
import { MobileMenu } from '@/components/MobileMenu'

export function Header() {
  const { user, profile, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Signed out",
      description: "Come back soon!",
    })
    navigate('/')
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {profile?.neighborhood?.name?.[0]?.toUpperCase() || 'N'}
                </span>
              </div>
              <span className="font-display font-semibold text-xl hidden sm:block">
                {profile?.neighborhood?.name ? `${profile.neighborhood.name} Collective` : 'Neighborhood Collective'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse
              </Link>
              {user && profile?.neighborhood_id && (
                <Link
                  to="/admin/invites"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User size={16} />
                      {profile?.full_name || 'Profile'}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setAuthMode('signin')
                      setAuthDialogOpen(true)
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setAuthMode('signup')
                      setAuthDialogOpen(true)
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          <MobileMenu
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            user={user}
            profile={profile}
            onSignOut={handleSignOut}
            onSignInClick={() => {
              setAuthMode('signin')
              setAuthDialogOpen(true)
            }}
            onSignUpClick={() => {
              setAuthMode('signup')
              setAuthDialogOpen(true)
            }}
          />
        </AnimatePresence>
      </header>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        initialMode={authMode}
      />
    </>
  )
}
