import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useRecommendations() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const addRecommendation = async (businessId, note = '') => {
    if (!user) return { error: { message: 'Must be logged in to recommend' } }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          user_id: user.id,
          business_id: businessId,
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

  const removeRecommendation = async (businessId) => {
    if (!user) return { error: { message: 'Must be logged in' } }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('user_id', user.id)
        .eq('business_id', businessId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const hasRecommended = useCallback(async (businessId) => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .maybeSingle()

      if (error) return false
      return !!data
    } catch {
      return false
    }
  }, [user])

  const getRecommendationsForBusiness = async (businessId) => {
    try {
      const { data: recommendationsData, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user profiles for the recommendations
      const userIds = recommendationsData?.map(rec => rec.user_id).filter(Boolean) || []
      let profilesMap = {}

      if (userIds.length > 0) {
        try {
          const { data: profilesData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds)

          if (!profileError && profilesData) {
            profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile
              return acc
            }, {})
          }
        } catch (profileErr) {
          console.error('Error fetching profiles:', profileErr)
          // Continue without profiles if fetch fails
        }
      }

      // Combine recommendations with user profiles
      const transformedData = recommendationsData?.map(rec => ({
        ...rec,
        user: profilesMap[rec.user_id] || null
      })) || []

      return { data: transformedData }
    } catch (error) {
      return { error }
    }
  }

  return {
    loading,
    addRecommendation,
    removeRecommendation,
    hasRecommended,
    getRecommendationsForBusiness
  }
}
