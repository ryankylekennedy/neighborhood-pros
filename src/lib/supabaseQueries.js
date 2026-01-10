// Shared Supabase query select patterns

// Standard business with services query - used in favorites and business detail
export const BUSINESS_WITH_SERVICES_SELECT = `
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
`

// Favorite with business select
export const FAVORITE_WITH_BUSINESS_SELECT = `
  id,
  business_id,
  business:businesses (${BUSINESS_WITH_SERVICES_SELECT})
`

// Business service relation select (for separate queries)
export const BUSINESS_SERVICES_SELECT = `
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
`

// Subcategory with category select
export const SUBCATEGORY_WITH_CATEGORY_SELECT = `
  *,
  category:categories (
    id,
    name,
    emoji
  )
`

// Service with full hierarchy select
export const SERVICE_WITH_HIERARCHY_SELECT = `
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
`
