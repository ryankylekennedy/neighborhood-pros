import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Bookmark, MapPin, ChevronDown } from 'lucide-react'
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
  const [authMode, setAuthMode] = useState('signin')
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

  const neighborhoodName = profile?.neighborhood?.name

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-warm-200/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xl">🏘️</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-lg text-warm-900">
                  Neighborhood Pros
                </span>
                {neighborhoodName && (
                  <span className="flex items-center gap-1 text-xs text-warm-500">
                    <MapPin size={10} />
                    {neighborhoodName}
                  </span>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/">
                <Button variant="ghost" className="text-warm-600 hover:text-warm-900 hover:bg-warm-100">
                  Find Pros
                </Button>
              </Link>
              {user && (
                <Link to="/favorites">
                  <Button variant="ghost" className="text-warm-600 hover:text-warm-900 hover:bg-warm-100">
                    <Bookmark size={18} className="mr-1.5" />
                    Saved
                  </Button>
                </Link>
              )}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-warm-100 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Link to="/profile">
                    <Button variant="ghost" className="gap-2 text-warm-700">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <User size={16} className="text-green-600" />
                      </div>
                      <span className="max-w-[120px] truncate">
                        {profile?.full_name || 'Profile'}
                      </span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleSignOut}
                    className="text-warm-400 hover:text-warm-600"
                  >
                    <LogOut size={18} />
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      setAuthMode('signin')
                      setAuthDialogOpen(true)
                    }}
                    className="text-warm-600"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => {
                      setAuthMode('signup')
                      setAuthDialogOpen(true)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white btn-press"
                  >
                    Join Your Neighbors
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
              className="md:hidden border-t border-warm-100 bg-white"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-lg">🔍</span>
                  <span className="font-medium text-warm-800">Find Pros</span>
                </Link>
                
                {user && (
                  <Link 
                    to="/favorites" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bookmark size={20} className="text-warm-500" />
                    <span className="font-medium text-warm-800">Saved Pros</span>
                  </Link>
                )}
                
                <div className="border-t border-warm-100 my-2" />
                
                {user ? (
                  <>
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <User size={16} className="text-green-600" />
                      </div>
                      <div>
                        <span className="font-medium text-warm-800 block">
                          {profile?.full_name || 'Profile'}
                        </span>
                        {neighborhoodName && (
                          <span className="text-xs text-warm-500">{neighborhoodName}</span>
                        )}
                      </div>
                    </Link>
                    <button 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors w-full text-left"
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                    >
                      <LogOut size={20} className="text-warm-400" />
                      <span className="text-warm-600">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setAuthMode('signin')
                        setAuthDialogOpen(true)
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-center"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => {
                        setAuthMode('signup')
                        setAuthDialogOpen(true)
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-center bg-green-600 hover:bg-green-700"
                    >
                      Join Your Neighbors
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md border-0 shadow-xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
              <span className="text-2xl">🏘️</span>
            </div>
            <DialogTitle className="text-2xl">
              {authMode === 'signin' ? 'Welcome back' : 'Join your neighbors'}
            </DialogTitle>
            <DialogDescription className="text-warm-500">
              {authMode === 'signin' 
                ? 'Sign in to save favorites and recommend pros.'
                : 'Discover trusted local professionals in your community.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-warm-700">Full Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required={authMode === 'signup'}
                  className="h-12"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-warm-700">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-warm-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
                className="h-12"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-base btn-press" 
              disabled={authLoading}
            >
              {authLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-warm-500">
            {authMode === 'signin' ? (
              <>
                New to the neighborhood?{' '}
                <button 
                  className="text-green-600 hover:text-green-700 font-medium"
                  onClick={() => setAuthMode('signup')}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  className="text-green-600 hover:text-green-700 font-medium"
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
