import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function AuthDialog({ open, onOpenChange, initialMode = 'signin' }) {
  const { signIn, signUp } = useAuth()
  const [authMode, setAuthMode] = useState(initialMode)
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
      if (authMode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`
        })
        if (error) throw error
        toast({
          title: "Check your email",
          description: "We sent you a password reset link.",
          variant: "success"
        })
        onOpenChange(false)
      } else if (authMode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) throw error
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete signup.",
          variant: "success"
        })
        onOpenChange(false)
      } else {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
        toast({
          title: "Welcome back!",
          description: "You're now signed in.",
          variant: "success"
        })
        onOpenChange(false)
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

  const getDialogTitle = () => {
    switch (authMode) {
      case 'reset': return 'Reset password'
      case 'signup': return 'Create an account'
      default: return 'Welcome back'
    }
  }

  const getDialogDescription = () => {
    switch (authMode) {
      case 'reset': return "Enter your email and we'll send you a password reset link."
      case 'signup': return 'Join your neighborhood and discover trusted local pros.'
      default: return 'Sign in to save favorites and recommend professionals.'
    }
  }

  const getSubmitText = () => {
    if (authLoading) return 'Loading...'
    switch (authMode) {
      case 'reset': return 'Send Reset Link'
      case 'signup': return 'Create Account'
      default: return 'Sign In'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
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
          {authMode !== 'reset' && (
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
              {authMode === 'signin' && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setAuthMode('reset')}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={authLoading}>
            {getSubmitText()}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {authMode === 'reset' ? (
            <>
              Remember your password?{' '}
              <button
                className="text-primary hover:underline"
                onClick={() => setAuthMode('signin')}
              >
                Sign in
              </button>
            </>
          ) : authMode === 'signin' ? (
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
  )
}
