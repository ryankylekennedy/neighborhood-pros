import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { extractKeywords, PAGINATION } from '@/lib/constants'
import { BUSINESS_SERVICES_SELECT, SUBCATEGORY_WITH_CATEGORY_SELECT, SERVICE_WITH_HIERARCHY_SELECT } from '@/lib/supabaseQueries'

export function useBusinesses({ subcategoryId = null, serviceId = null, searchQuery = '', limit = PAGINATION.DEFAULT_LIMIT } = {}) {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setOffset(0)
    fetchBusinesses(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId, serviceId, searchQuery])

  async function fetchBusinesses(newOffset = 0, reset = false) {
    try {
      setLoading(true)
      setError(null)

      const keywords = extractKeywords(searchQuery)
      const searchConditions = keywords.length > 0
        ? keywords.flatMap(k => [`name.ilike.%${k}%`, `description.ilike.%${k}%`]).join(',')
        : null

      // Step 1: Run parallel searches for business IDs from different sources
      const [directMatches, serviceBusinessIds, subcategoryBusinessIds] = await Promise.all([
        // Direct business search
        (async () => {
          let query = supabase.from('businesses').select('id').eq('status', 'approved')
          if (searchConditions) query = query.or(searchConditions)
          const { data } = await query
          return data?.map(b => b.id) || []
        })(),
        // Search via service names
        keywords.length > 0 ? findBusinessIdsByServiceKeywords(keywords) : Promise.resolve([]),
        // Search via subcategory names
        keywords.length > 0 ? findBusinessIdsBySubcategoryKeywords(keywords) : Promise.resolve([])
      ])

      // Combine and deduplicate all business IDs
      const allBusinessIds = [...new Set([...directMatches, ...serviceBusinessIds, ...subcategoryBusinessIds])]

      if (allBusinessIds.length === 0) {
        if (reset) setBusinesses([])
        setHasMore(false)
        return
      }

      // Step 2: Fetch businesses with pagination
      const { data: businessData, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'approved')
        .in('id', allBusinessIds)
        .order('created_at', { ascending: false })
        .range(newOffset, newOffset + limit - 1)

      if (fetchError) throw fetchError

      // Step 3: Fetch services for these businesses
      const businessIds = businessData?.map(b => b.id) || []
      let businessesWithServices = businessData || []

      if (businessIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('business_services')
          .select(BUSINESS_SERVICES_SELECT)
          .in('business_id', businessIds)

        businessesWithServices = businessData.map(business => ({
          ...business,
          business_services: servicesData?.filter(s => s.business_id === business.id) || []
        }))
      }

      // Step 4: Apply filters
      if (subcategoryId) {
        businessesWithServices = businessesWithServices.filter(b =>
          b.business_services?.some(bs => bs.service?.subcategory?.id === subcategoryId)
        )
      }
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

  // Helper: Find business IDs by matching service names
  async function findBusinessIdsByServiceKeywords(keywords) {
    const conditions = keywords.map(k => `name.ilike.%${k}%`).join(',')
    const { data: services } = await supabase.from('services').select('id').or(conditions)
    if (!services?.length) return []

    const { data: links } = await supabase
      .from('business_services')
      .select('business_id')
      .in('service_id', services.map(s => s.id))

    return [...new Set(links?.map(l => l.business_id) || [])]
  }

  // Helper: Find business IDs by matching subcategory names
  async function findBusinessIdsBySubcategoryKeywords(keywords) {
    const conditions = keywords.map(k => `name.ilike.%${k}%`).join(',')
    const { data: subcategories } = await supabase.from('subcategories').select('id').or(conditions)
    if (!subcategories?.length) return []

    const { data: services } = await supabase
      .from('services')
      .select('id')
      .in('subcategory_id', subcategories.map(sc => sc.id))
    if (!services?.length) return []

    const { data: links } = await supabase
      .from('business_services')
      .select('business_id')
      .in('service_id', services.map(s => s.id))

    return [...new Set(links?.map(l => l.business_id) || [])]
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
        .select(SUBCATEGORY_WITH_CATEGORY_SELECT)
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
        .select(SERVICE_WITH_HIERARCHY_SELECT)
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

export function useBusiness(id) {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    async function fetchBusiness() {
      try {
        setLoading(true)
        setError(null)

        // Fetch the business
        const { data: businessData, error: fetchError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        // Fetch services for this business
        const { data: servicesData } = await supabase
          .from('business_services')
          .select(BUSINESS_SERVICES_SELECT)
          .eq('business_id', id)

        // Fetch recommendations for this business
        const { data: recommendationsData } = await supabase
          .from('recommendations')
          .select('*')
          .eq('business_id', id)
          .order('created_at', { ascending: false })

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
        const recommendationsWithUsers = recommendationsData?.map(rec => ({
          ...rec,
          user: profilesMap[rec.user_id] || null
        })) || []

        // Combine everything
        const businessWithDetails = {
          ...businessData,
          business_services: servicesData || [],
          recommendations: recommendationsWithUsers
        }

        setBusiness(businessWithDetails)
      } catch (err) {
        console.error('Error fetching business:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [id])

  return { business, loading, error }
}