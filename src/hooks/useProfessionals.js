import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useProfessionals({ 
  categoryId = null, 
  searchQuery = '', 
  userNeighborhoodId = null,
  limit = 12 
} = {}) {
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const fetchProfessionals = useCallback(async (pageNum = 0, append = false) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('professionals')
        .select(`
          *,
          category:categories(*),
          subcategories:professional_subcategories(
            subcategory:subcategories(*)
          ),
          preferred_neighborhoods:professional_neighborhoods(
            neighborhood:neighborhoods(*)
          ),
          recommendations(count)
        `)
        .range(pageNum * limit, (pageNum + 1) * limit - 1)
        .order('name')

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Sort by preferred neighborhood status
      let sortedData = data || []
      if (userNeighborhoodId) {
        sortedData = [...sortedData].sort((a, b) => {
          const aIsPreferred = a.preferred_neighborhoods?.some(
            pn => pn.neighborhood?.id === userNeighborhoodId
          )
          const bIsPreferred = b.preferred_neighborhoods?.some(
            pn => pn.neighborhood?.id === userNeighborhoodId
          )
          if (aIsPreferred && !bIsPreferred) return -1
          if (!aIsPreferred && bIsPreferred) return 1
          return 0
        })
      }

      if (append) {
        setProfessionals(prev => [...prev, ...sortedData])
      } else {
        setProfessionals(sortedData)
      }

      setHasMore(data?.length === limit)
      setPage(pageNum)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [categoryId, searchQuery, userNeighborhoodId, limit])

  useEffect(() => {
    fetchProfessionals(0, false)
  }, [fetchProfessionals])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProfessionals(page + 1, true)
    }
  }

  const refresh = () => {
    fetchProfessionals(0, false)
  }

  return {
    professionals,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  }
}

export function useProfessional(id) {
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchProfessional = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('professionals')
          .select(`
            *,
            category:categories(*),
            subcategories:professional_subcategories(
              subcategory:subcategories(*)
            ),
            preferred_neighborhoods:professional_neighborhoods(
              neighborhood:neighborhoods(*)
            ),
            recommendations(
              *,
              user:profiles(id, full_name, avatar_url)
            )
          `)
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError
        setProfessional(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfessional()
  }, [id])

  return { professional, loading, error }
}

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (fetchError) throw fetchError
        setCategories(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

export function useNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('neighborhoods')
          .select('*')
          .order('name')

        if (fetchError) throw fetchError
        setNeighborhoods(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNeighborhoods()
  }, [])

  return { neighborhoods, loading, error }
}
