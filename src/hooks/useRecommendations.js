import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useRecommendations() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const addRecommendation = async (professionalId, note = '') => {
    if (!user) return { error: { message: 'Must be logged in to recommend' } }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recommendations')
        .insert({ 
          user_id: user.id, 
          professional_id: professionalId,
          note 
        })
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const removeRecommendation = async (professionalId) => {
    if (!user) return { error: { message: 'Must be logged in' } }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('user_id', user.id)
        .eq('professional_id', professionalId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const hasRecommended = useCallback(async (professionalId) => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('id')
        .eq('user_id', user.id)
        .eq('professional_id', professionalId)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }, [user])

  const getRecommendationsForProfessional = async (professionalId) => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          user:profiles(id, full_name, avatar_url)
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data }
    } catch (error) {
      return { error }
    }
  }

  return {
    loading,
    addRecommendation,
    removeRecommendation,
    hasRecommended,
    getRecommendationsForProfessional
  }
}
