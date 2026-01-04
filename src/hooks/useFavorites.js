import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

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
  }, [user, authLoading])

  async function fetchFavorites() {
    if (!user) return

    try {
      setLoading(true)
      fetchedForUser.current = user.id

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          business_id,
          business:businesses (
            id,
            name,
            description,
            phone,
            email,
            website,
            business_services (
              service:services (
                id,
                name,
                subcategory:subcategories (
                  id,
                  name,
                  category:categories (
                    id,
                    name,
                    emoji
                  )
                )
              )
            )
          )
        `)
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

  async function toggleFavorite(businessId) {
    if (!user) return

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
      }
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
        .select(`
          id,
          business_id,
          business:businesses (
            id,
            name,
            description,
            phone,
            email,
            website,
            business_services (
              service:services (
                id,
                name,
                subcategory:subcategories (
                  id,
                  name,
                  category:categories (
                    id,
                    name,
                    emoji
                  )
                )
              )
            )
          )
        `)
        .single()

      if (error) {
        // Revert on error
        setFavorites(prev => prev.filter(f => f.id !== tempFavorite.id))
        console.error('Error adding favorite:', error)
      } else {
        // Replace temp with real data
        setFavorites(prev => prev.map(f => f.id === tempFavorite.id ? data : f))
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