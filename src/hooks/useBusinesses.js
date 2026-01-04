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
    fetchBusinesses(0, true)
  }, [subcategoryId, serviceId, searchQuery])

  async function fetchBusinesses(newOffset = 0, reset = false) {
    try {
      setLoading(true)
      setError(null)

      // First get the businesses
      let query = supabase
        .from('businesses')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(newOffset, newOffset + limit - 1)

      // Search by name or description
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data: businessData, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Now get the services for each business
      const businessIds = businessData?.map(b => b.id) || []
      
      let businessesWithServices = businessData || []

      if (businessIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('business_services')
          .select(`
            business_id,
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
          `)
          .in('business_id', businessIds)

        // Merge services into businesses
        businessesWithServices = businessData.map(business => ({
          ...business,
          business_services: servicesData?.filter(s => s.business_id === business.id) || []
        }))
      }

      // Filter by subcategory if needed
      if (subcategoryId) {
        businessesWithServices = businessesWithServices.filter(b => 
          b.business_services?.some(bs => bs.service?.subcategory?.id === subcategoryId)
        )
      }

      // Filter by service if needed
      if (serviceId) {
        businessesWithServices = businessesWithServices.filter(b => 
          b.business_services?.some(bs => bs.service?.id === serviceId)
        )
      }

      if (reset) {
        setBusinesses(businessesWithServices)
      } else {
        setBusinesses(prev => [...prev, ...businessesWithServices])
      }

      setHasMore((businessData?.length || 0) === limit)
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