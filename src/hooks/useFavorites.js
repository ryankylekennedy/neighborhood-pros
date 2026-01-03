import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)

  const fetchFavorites = useCallback(async (showLoading = true) => {
    if (!user) {
      setFavorites([])
      setFavoriteIds(new Set())
      setLoading(false)
      return
    }

    try {
      if (showLoading && !initialLoadDone.current) {
        setLoading(true)
      }
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          professional:professionals(
            *,
            category:categories(*),
            subcategories:professional_subcategories(
              subcategory:subcategories(*)
            )
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      setFavorites(data || [])
      setFavoriteIds(new Set(data?.map(f => f.professional_id) || []))
      initialLoadDone.current = true
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    initialLoadDone.current = false
    fetchFavorites()
  }, [user])

  const addFavorite = async (professionalId) => {
    if (!user) return { error: { message: 'Must be logged in to favorite' } }

    // Optimistic update
    setFavoriteIds(prev => new Set([...prev, professionalId]))

    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, professional_id: professionalId })
        .select()
        .single()

      if (error) {
        // Revert on error
        setFavoriteIds(prev => {
          const next = new Set(prev)
          next.delete(professionalId)
          return next
        })
        throw error
      }

      // Background refresh without loading state
      fetchFavorites(false)
      return { data }
    } catch (error) {
      return { error }
    }
  }

  const removeFavorite = async (professionalId) => {
    if (!user) return { error: { message: 'Must be logged in' } }

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev)
      next.delete(professionalId)
      return next
    })

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('professional_id', professionalId)

      if (error) {
        // Revert on error
        setFavoriteIds(prev => new Set([...prev, professionalId]))
        throw error
      }

      // Background refresh without loading state
      fetchFavorites(false)
      return { success: true }
    } catch (error) {
      return { error }
    }
  }

  const toggleFavorite = async (professionalId) => {
    if (favoriteIds.has(professionalId)) {
      return removeFavorite(professionalId)
    } else {
      return addFavorite(professionalId)
    }
  }

  const isFavorite = (professionalId) => favoriteIds.has(professionalId)

  return {
    favorites,
    favoriteIds,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refresh: fetchFavorites
  }
}