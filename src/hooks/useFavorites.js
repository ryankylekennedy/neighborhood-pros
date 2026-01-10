import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { FAVORITE_WITH_BUSINESS_SELECT } from '@/lib/supabaseQueries'

export function useFavorites() {
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)
  const fetchedForUser = useRef(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setFavorites([])
      fetchedForUser.current = null
      return
    }

    if (fetchedForUser.current === user.id) return

    fetchFavorites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  async function fetchFavorites() {
    if (!user) return

    try {
      setLoading(true)
      fetchedForUser.current = user.id

      const { data, error } = await supabase
        .from('favorites')
        .select(FAVORITE_WITH_BUSINESS_SELECT)
        .eq('user_id', user.id)

      if (error) throw error
      setFavorites(data || [])
    } catch (err) {
      console.error('Error fetching favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  const isFavorite = useCallback((businessId) => {
    return favorites.some(f => f.business_id === businessId)
  }, [favorites])

  // Returns { added: boolean } indicating if it was added (true) or removed (false)
  async function toggleFavorite(businessId) {
    if (!user) return { added: false }

    const existing = favorites.find(f => f.business_id === businessId)

    if (existing) {
      // Optimistic update - remove
      setFavorites(prev => prev.filter(f => f.business_id !== businessId))

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id)

      if (error) {
        // Revert on error
        setFavorites(prev => [...prev, existing])
        console.error('Error removing favorite:', error)
        return { added: false, error }
      }
      return { added: false }
    } else {
      // Optimistic update - add
      const tempFavorite = { 
        id: 'temp-' + Date.now(), 
        business_id: businessId,
        business: null 
      }
      setFavorites(prev => [...prev, tempFavorite])

      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, business_id: businessId })
        .select(FAVORITE_WITH_BUSINESS_SELECT)
        .single()

      if (error) {
        // Revert on error
        setFavorites(prev => prev.filter(f => f.id !== tempFavorite.id))
        console.error('Error adding favorite:', error)
        return { added: true, error }
      } else {
        // Replace temp with real data
        setFavorites(prev => prev.map(f => f.id === tempFavorite.id ? data : f))
        return { added: true }
      }
    }
  }

  return { 
    favorites, 
    loading, 
    isFavorite, 
    toggleFavorite,
    refetch: fetchFavorites
  }
}