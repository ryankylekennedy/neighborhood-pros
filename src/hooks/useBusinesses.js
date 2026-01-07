import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Common stop words to filter out from search
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will',
  'with', 'i', 'need', 'want', 'looking', 'help', 'my', 'me', 'can', 'you'
])

// Extract meaningful keywords from search query
function extractKeywords(query) {
  if (!query || !query.trim()) return []

  return query
    .toLowerCase()
    .split(/\s+/) // Split by whitespace
    .map(word => word.replace(/[^a-z0-9]/g, '')) // Remove special chars
    .filter(word => word.length >= 3) // Keep words with 3+ chars
    .filter(word => !STOP_WORDS.has(word)) // Remove stop words
}

export function useBusinesses({ subcategoryId = null, serviceId = null, searchQuery = '', limit = 12 } = {}) {
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

      // Extract keywords from search query
      const keywords = extractKeywords(searchQuery)

      // Get all businesses first (we'll filter based on keywords later)
      let query = supabase
        .from('businesses')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      // If we have keywords, build a flexible search query
      if (keywords.length > 0) {
        // Build OR conditions for each keyword across name and description
        const searchConditions = keywords.flatMap(keyword => [
          `name.ilike.%${keyword}%`,
          `description.ilike.%${keyword}%`
        ]).join(',')

        query = query.or(searchConditions)
      }

      // Apply pagination
      query = query.range(newOffset, newOffset + limit - 1)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      let businessData = data

      // Also search for businesses by service names and subcategories if we have keywords
      let serviceMatchedBusinessIds = []
      if (keywords.length > 0) {
        // Build search conditions for service names
        const serviceSearchConditions = keywords.map(keyword =>
          `name.ilike.%${keyword}%`
        ).join(',')

        const { data: matchingServices } = await supabase
          .from('services')
          .select('id')
          .or(serviceSearchConditions)

        if (matchingServices && matchingServices.length > 0) {
          const serviceIds = matchingServices.map(s => s.id)

          const { data: businessServiceLinks } = await supabase
            .from('business_services')
            .select('business_id')
            .in('service_id', serviceIds)

          if (businessServiceLinks) {
            serviceMatchedBusinessIds = [...new Set(businessServiceLinks.map(bs => bs.business_id))]

            // Fetch businesses that match via services
            let serviceQuery = supabase
              .from('businesses')
              .select('*')
              .eq('status', 'approved')
              .in('id', serviceMatchedBusinessIds)

            // Exclude already fetched businesses
            const existingIds = businessData.map(b => b.id)
            if (existingIds.length > 0) {
              serviceQuery = serviceQuery.not('id', 'in', `(${existingIds.join(',')})`)
            }

            const { data: serviceMatchedBusinesses } = await serviceQuery

            if (serviceMatchedBusinesses && serviceMatchedBusinesses.length > 0) {
              businessData = [...businessData, ...serviceMatchedBusinesses]
            }
          }
        }

        // Also search for businesses by subcategory names
        const subcategorySearchConditions = keywords.map(keyword =>
          `name.ilike.%${keyword}%`
        ).join(',')

        const { data: matchingSubcategories } = await supabase
          .from('subcategories')
          .select('id')
          .or(subcategorySearchConditions)

        if (matchingSubcategories && matchingSubcategories.length > 0) {
          const subcategoryIds = matchingSubcategories.map(sc => sc.id)

          // Get services in these subcategories
          const { data: subcategoryServices } = await supabase
            .from('services')
            .select('id')
            .in('subcategory_id', subcategoryIds)

          if (subcategoryServices && subcategoryServices.length > 0) {
            const subcategoryServiceIds = subcategoryServices.map(s => s.id)

            // Get businesses offering these services
            const { data: subcategoryBusinessLinks } = await supabase
              .from('business_services')
              .select('business_id')
              .in('service_id', subcategoryServiceIds)

            if (subcategoryBusinessLinks && subcategoryBusinessLinks.length > 0) {
              const subcategoryMatchedBusinessIds = [...new Set(subcategoryBusinessLinks.map(bs => bs.business_id))]

              // Fetch businesses that match via subcategories
              let subcategoryQuery = supabase
                .from('businesses')
                .select('*')
                .eq('status', 'approved')
                .in('id', subcategoryMatchedBusinessIds)

              // Exclude already fetched businesses
              const existingIds = businessData.map(b => b.id)
              if (existingIds.length > 0) {
                subcategoryQuery = subcategoryQuery.not('id', 'in', `(${existingIds.join(',')})`)
              }

              const { data: subcategoryMatchedBusinesses } = await subcategoryQuery

              if (subcategoryMatchedBusinesses && subcategoryMatchedBusinesses.length > 0) {
                businessData = [...businessData, ...subcategoryMatchedBusinesses]
              }
            }
          }
        }
      }

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