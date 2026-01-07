import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useInvite } from '@/hooks/useInvite'
import { useAuth } from '@/hooks/useAuth'

export function InviteWelcomePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { validateInvite, loading } = useInvite()

  const [inviteData, setInviteData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkInvite = async () => {
      if (!code) {
        setError('No invite code provided')
        return
      }

      const result = await validateInvite(code)

      if (result.success) {
        setInviteData(result.invite)
      } else {
        setError(result.error)
      }
    }

    checkInvite()
  }, [code])

  const handleGetStarted = () => {
    // Pass invite code to onboarding via URL params
    navigate(`/onboarding?code=${code}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-2xl font-bold">Invalid Invite</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - show welcome
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles size={18} />
              <span className="text-sm font-medium">You're Invited!</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Welcome to<br />
              <span className="text-primary">{inviteData?.neighborhoodName}</span> Collective
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Join your neighbors and discover trusted local professionals with exclusive deals just for your community.
            </p>
          </motion.div>

          {/* Benefits Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            {[
              {
                icon: '🏘️',
                title: 'Neighborhood Exclusivity',
                description: 'Access vetted professionals who serve your specific neighborhood'
              },
              {
                icon: '💰',
                title: 'Member Deals',
                description: 'Get special pricing and offers only available to neighbors'
              },
              {
                icon: '⭐',
                title: 'Trusted Reviews',
                description: 'See real recommendations from people in your community'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{benefit.icon}</div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ready to join?</h3>
                    <p className="text-muted-foreground">
                      Create your account and start exploring local professionals in your neighborhood.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="gap-2 whitespace-nowrap"
                  >
                    Get Started
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Invite Code Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">Your invite code</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted font-mono text-sm">
              <Check size={16} className="text-primary" />
              {inviteData?.code}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
