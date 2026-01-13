import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
   * Hook for integrating with Google Places API via Supabase Edge Functions
   * Provides business search, place details, and category mapping
   *
   * @returns {Object} Google Places API methods and state
   */
export function useGooglePlaces() {
    const [predictions, setPredictions] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

  /**
         * Search for businesses using Google Places API Text Search via Edge Function
         * @param {string} query - Search query (business name, address, etc.)
         * @returns {Promise<Array>} Array of place predictions
         */
  const searchPlaces = useCallback(async (query) => {
        if (!query || query.trim().length < 3) {
                setPredictions([])
                return []
        }

                                       setLoading(true)
        setError(null)

                                       try {
                                               // Call the Supabase Edge Function for search
          const { data, error: functionError } = await supabase.functions.invoke('google-places-search', {
                    body: { 
                      businessName: query,
                                city: '', // Optional: could be extracted from query
                                state: ''
                    }
          })

          if (functionError) {
                    throw new Error(functionError.message || 'Failed to search places')
          }

          const results = data?.results || data?.places || []

                  // Transform to simpler format
                  const transformedResults = results.map(place => ({
                            placeId: place.place_id || place.placeId || place.id,
                            name: place.name || place.displayName?.text || 'Unknown',
                            address: place.formatted_address || place.formattedAddress || place.address || '',
                            types: place.types || [],
                            primaryType: place.primary_type || place.primaryType || '',
                            rating: place.rating,
                            userRatingCount: place.user_rating_count || place.userRatingCount
                  }))

          setPredictions(transformedResults)
                                               return transformedResults
                                       } catch (err) {
                                               console.error('Error searching places:', err)
                                               setError(err.message)
                                               setPredictions([])
                                               return []
                                       } finally {
                                               setLoading(false)
                                       }
  }, [])

  /**
       * Get detailed information about a specific place via Edge Function
       * @param {string} placeId - Google Place ID
       * @returns {Promise<Object>} Detailed place information
       */
  const getPlaceDetails = useCallback(async (placeId) => {
        if (!placeId) {
                throw new Error('Place ID is required')
        }

                                          setLoading(true)
        setError(null)

                                          try {
                                                  // Call the Supabase Edge Function instead of Google directly
          const { data, error: functionError } = await supabase.functions.invoke('google-place-details', {
                    body: { placeId }
          })

          if (functionError) {
                    throw new Error(functionError.message || 'Failed to fetch place details')
          }

          if (!data) {
                    throw new Error('No data returned from place details')
          }

          // Transform to app-friendly format
          const placeDetails = {
                    placeId: data.placeId || data.place_id || placeId,
                    name: data.name || data.displayName?.text || '',
                    address: data.address || data.formatted_address || data.formattedAddress || '',
                    phone: data.phone || data.nationalPhoneNumber || data.national_phone_number || '',
                    website: data.website || data.websiteUri || data.website_uri || '',
                    types: data.types || [],
                    primaryType: data.primaryType || data.primary_type || '',
                    hours: data.hours || data.weekdayDescriptions || data.weekday_descriptions || null,
                    rating: data.rating || null,
                    userRatingCount: data.userRatingCount || data.user_rating_count || 0,
                    photos: data.photos || [],
                    location: data.location || null,
                    googleMapsUri: data.googleMapsUri || data.google_maps_uri || ''
          }

          return placeDetails
                                          } catch (err) {
                                                  console.error('Error fetching place details:', err)
                                                  setError(err.message)
                                                  throw err
                                          } finally {
                                                  setLoading(false)
                                          }
  }, [])

  /**
       * Map Google Place type to internal category/subcategory
       * @param {string} googlePrimaryType - Google's primary business type
       * @returns {Promise<Object>} Mapped category info with confidence level
       */
  const mapToInternalCategory = useCallback(async (googlePrimaryType) => {
        if (!googlePrimaryType) {
                return {
                          subcategoryId: null,
                          categoryId: null,
                          confidence: 'unknown',
                          source: 'manual'
                }
        }

                                                try {
                                                        // Query the google_type_mappings table
          const { data: mapping, error: mappingError } = await supabase
                                                          .from('google_type_mappings')
                                                          .select('subcategory_id, category_id, confidence')
                                                          .eq('google_type', googlePrimaryType)
                                                          .maybeSingle()

          if (mappingError) {
                    console.error('Error fetching type mapping:', mappingError)
                    return {
                                subcategoryId: null,
                                categoryId: null,
                                confidence: 'unknown',
                                source: 'manual',
                                unmappedType: googlePrimaryType
                    }
          }

          if (mapping && mapping.subcategory_id && mapping.category_id) {
                    return {
                                subcategoryId: mapping.subcategory_id,
                                categoryId: mapping.category_id,
                                confidence: mapping.confidence,
                                source: 'google_places'
                    }
          }

          // No mapping found
          return {
                    subcategoryId: null,
                    categoryId: null,
                    confidence: 'unknown',
                    source: 'manual',
                    unmappedType: googlePrimaryType
          }
                                                } catch (err) {
                                                        console.error('Error mapping Google type to category:', err)
                                                        return {
                                                                  subcategoryId: null,
                                                                  categoryId: null,
                                                                  confidence: 'unknown',
                                                                  source: 'manual',
                                                                  error: err.message
                                                        }
                                                }
  }, [])

  /**
       * Clear predictions and reset state
       */
  const clearPredictions = useCallback(() => {
        setPredictions([])
        setError(null)
  }, [])

  return {
        predictions,
        loading,
        error,
        searchPlaces,
        getPlaceDetails,
        mapToInternalCategory,
        clearPredictions
  }
}
