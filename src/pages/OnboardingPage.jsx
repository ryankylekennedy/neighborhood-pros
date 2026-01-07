import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ProgressStepper } from '@/components/ProgressStepper'
import { AddressInput } from '@/components/AddressInput'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useInvite } from '@/hooks/useInvite'
import { toast } from '@/hooks/useToast'

export function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get('code')

  const {
    step,
    formData,
    loading,
    error,
    updateFormData,
    nextStep,
    prevStep,
    submitOnboarding
  } = useOnboarding()

  const { validateInvite } = useInvite()

  const [inviteData, setInviteData] = useState(null)
  const [validatingInvite, setValidatingInvite] = useState(true)
  const [fieldErrors, setFieldErrors] = useState({})

  const steps = ['Account', 'Personal Info', 'Address']

  // Validate invite code on mount
  useEffect(() => {
    const checkInvite = async () => {
      if (!inviteCode) {
        toast({
          title: 'No invite code',
          description: 'Please use a valid invite link',
          variant: 'destructive'
        })
        navigate('/')
        return
      }

      const result = await validateInvite(inviteCode)

      if (!result.success) {
        toast({
          title: 'Invalid invite',
          description: result.error,
          variant: 'destructive'
        })
        navigate('/')
        return
      }

      setInviteData(result.invite)
      setValidatingInvite(false)
    }

    checkInvite()
  }, [inviteCode])

  // Validate current step before allowing next
  const validateStep = () => {
    const errors = {}

    if (step === 1) {
      if (!formData.email) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email'
      }

      if (!formData.password) {
        errors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      }
    }

    if (step === 2) {
      if (!formData.fullName || formData.fullName.trim().length === 0) {
        errors.fullName = 'Full name is required'
      }
    }

    if (step === 3) {
      if (!formData.address || formData.address.trim().length === 0) {
        errors.address = 'Address is required'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      nextStep()
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    const result = await submitOnboarding(inviteCode, inviteData.neighborhoodId)

    if (result.success) {
      toast({
        title: 'Welcome!',
        description: `You've joined ${inviteData.neighborhoodName} Collective`,
        variant: 'success'
      })
      navigate('/')
    } else {
      toast({
        title: 'Signup failed',
        description: result.error || 'An unknown error occurred',
        variant: 'destructive'
      })
    }
  }

  if (validatingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-display font-bold mb-2">
              Join {inviteData?.neighborhoodName}
            </h1>
            <p className="text-muted-foreground">
              Create your account to get started
            </p>
          </motion.div>

          {/* Progress Stepper */}
          <ProgressStepper currentStep={step} totalSteps={3} steps={steps} />

          {/* Form Card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
              <CardDescription>
                {step === 1 && 'Create your account credentials'}
                {step === 2 && 'Tell us your name'}
                {step === 3 && 'Verify your neighborhood address'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {/* Step 1: Account */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        aria-invalid={fieldErrors.email ? 'true' : 'false'}
                      />
                      {fieldErrors.email && (
                        <p className="text-sm text-destructive">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        aria-invalid={fieldErrors.password ? 'true' : 'false'}
                      />
                      {fieldErrors.password && (
                        <p className="text-sm text-destructive">{fieldErrors.password}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Must be at least 6 characters
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Personal Info */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => updateFormData('fullName', e.target.value)}
                        aria-invalid={fieldErrors.fullName ? 'true' : 'false'}
                      />
                      {fieldErrors.fullName && (
                        <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Address */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Street Address</label>
                      <AddressInput
                        value={formData.address}
                        onChange={(value) => updateFormData('address', value)}
                        error={fieldErrors.address}
                        placeholder={`Address in ${inviteData?.neighborhoodName}`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1 || loading}
                  className="gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>

                {step < 3 ? (
                  <Button onClick={handleNext} className="gap-2">
                    Next
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Signup
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
