import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useFavorites() {
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const fetchedForUser = useRef(null)

  useEffect(() => {
    // Don't fetch while auth is still loading
    if (authLoading) return

    // Don't refetch for the same user
    if (fetchedForUser.current === (user?.id || 'none')) return

    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([])
        setFavoriteIds(new Set())
        fetchedForUser.current = 'none'
        return
      }

      try {
        setLoading(true)
        
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
        fetchedForUser.current = user.id
      } catch (error) {
        console.error('Error fetching favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [user?.id, authLoading])

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

      return { data }
    } catch (error) {
      return { error }
    }
  }

  const removeFavorite = async (professionalId) => {
    if (!user) return { error: { message: 'Must be logged in' } }

    // Optimistic update
    const previousIds = new Set(favoriteIds)
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
        setFavoriteIds(previousIds)
        throw error
      }

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
    refresh: () => { fetchedForUser.current = null }
  }
}