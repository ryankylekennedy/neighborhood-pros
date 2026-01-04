import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useBusinesses({ subcategoryId = null, serviceId = null, searchQuery = '', limit = 12 } = {}) {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setOffset(0)
    setBusinesses([])
    fetchBusinesses(0, true)
  }, [subcategoryId, serviceId, searchQuery])

  async function fetchBusinesses(newOffset = 0, reset = false) {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('businesses')
        .select(`
          *,
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
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(newOffset, newOffset + limit - 1)

      // Filter by service
      if (serviceId) {
        const { data: businessIds } = await supabase
          .from('business_services')
          .select('business_id')
          .eq('service_id', serviceId)
        
        const ids = businessIds?.map(b => b.business_id) || []
        if (ids.length > 0) {
          query = query.in('id', ids)
        } else {
          setBusinesses([])
          setLoading(false)
          setHasMore(false)
          return
        }
      }

      // Filter by subcategory
      if (subcategoryId && !serviceId) {
        const { data: serviceIds } = await supabase
          .from('services')
          .select('id')
          .eq('subcategory_id', subcategoryId)
        
        const sIds = serviceIds?.map(s => s.id) || []
        
        if (sIds.length > 0) {
          const { data: businessIds } = await supabase
            .from('business_services')
            .select('business_id')
            .in('service_id', sIds)
          
          const ids = [...new Set(businessIds?.map(b => b.business_id) || [])]
          if (ids.length > 0) {
            query = query.in('id', ids)
          } else {
            setBusinesses([])
            setLoading(false)
            setHasMore(false)
            return
          }
        }
      }

      // Search by name or description
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (reset) {
        setBusinesses(data || [])
      } else {
        setBusinesses(prev => [...prev, ...(data || [])])
      }

      setHasMore((data?.length || 0) === limit)
      setOffset(newOffset + limit)
    } catch (err) {
      console.error('Error fetching businesses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function loadMore() {
    if (!loading && hasMore) {
      fetchBusinesses(offset, false)
    }
  }

  return { businesses, loading, error, hasMore, loadMore, refetch: () => fetchBusinesses(0, true) }
}

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (!error) {
        setCategories(data || [])
      }
      setLoading(false)
    }
    fetchCategories()
  }, [])

  return { categories, loading }
}

export function useSubcategories(categoryId = null) {
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubcategories() {
      let query = supabase
        .from('subcategories')
        .select(`
          *,
          category:categories (
            id,
            name,
            emoji
          )
        `)
        .order('name')

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query

      if (!error) {
        setSubcategories(data || [])
      }
      setLoading(false)
    }
    fetchSubcategories()
  }, [categoryId])

  return { subcategories, loading }
}

export function useServices(subcategoryId = null) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchServices() {
      let query = supabase
        .from('services')
        .select(`
          *,
          subcategory:subcategories (
            id,
            name,
            category:categories (
              id,
              name,
              emoji
            )
          )
        `)
        .order('name')

      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId)
      }

      const { data, error } = await query

      if (!error) {
        setServices(data || [])
      }
      setLoading(false)
    }
    fetchServices()
  }, [subcategoryId])

  return { services, loading }
}