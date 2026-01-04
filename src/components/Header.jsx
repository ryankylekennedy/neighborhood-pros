import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/useToast'

export function Header() {
  const { user, profile, signIn, signUp, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin') // 'signin' or 'signup'
  const [authLoading, setAuthLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthLoading(true)

    try {
      if (authMode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) throw error
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete signup.",
          variant: "success"
        })
        setAuthDialogOpen(false)
      } else {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
        toast({
          title: "Welcome back!",
          description: "You're now signed in.",
          variant: "success"
        })
        setAuthDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setAuthLoading(false)
    }
  }

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
          {mobileMenuOpen && (
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
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse Professionals
                </Link>
                <div className="border-t my-2" />
                {user ? (
                  <>
                    <Link 
                      to="/profile" 
                      className="px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={18} />
                      {profile?.full_name || 'Profile'}
                    </Link>
                    <button 
                      className="px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-left w-full"
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
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
                        setAuthMode('signin')
                        setAuthDialogOpen(true)
                        setMobileMenuOpen(false)
                      }}
                    >
                      Sign In
                    </button>
                    <Button 
                      className="mx-4"
                      onClick={() => {
                        setAuthMode('signup')
                        setAuthDialogOpen(true)
                        setMobileMenuOpen(false)
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {authMode === 'signin' ? 'Welcome back' : 'Create an account'}
            </DialogTitle>
            <DialogDescription>
              {authMode === 'signin' 
                ? 'Sign in to save favorites and recommend professionals.'
                : 'Join your neighborhood and discover trusted local pros.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required={authMode === 'signup'}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {authMode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button 
                  className="text-primary hover:underline"
                  onClick={() => setAuthMode('signup')}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  className="text-primary hover:underline"
                  onClick={() => setAuthMode('signin')}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
