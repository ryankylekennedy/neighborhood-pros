import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useInvite } from '@/hooks/useInvite'

export function useOnboarding() {
  const { signUpWithInvite } = useAuth()
  const { redeemInvite } = useInvite()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    address: ''
  })

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      email: '',
      password: '',
      fullName: '',
      address: ''
    })
    setError(null)
  }

  const submitOnboarding = async (inviteCode, neighborhoodId) => {
    try {
      setLoading(true)
      setError(null)

      // Validate all fields
      if (!formData.email || !formData.password || !formData.fullName || !formData.address) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Call the signUpWithInvite function from useAuth
      const result = await signUpWithInvite(
        formData.email,
        formData.password,
        formData.fullName,
        neighborhoodId,
        formData.address,
        inviteCode
      )

      if (result.error) {
        throw result.error
      }

      return {
        success: true,
        user: result.data
      }
    } catch (err) {
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    step,
    formData,
    loading,
    error,
    updateFormData,
    nextStep,
    prevStep,
    resetForm,
    submitOnboarding
  }
}
