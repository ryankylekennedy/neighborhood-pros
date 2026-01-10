// Search constants
export const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will',
  'with', 'i', 'need', 'want', 'looking', 'help', 'my', 'me', 'can', 'you'
])

// Pagination limits
export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  AUTOCOMPLETE_LIMIT: 8,
  DROPDOWN_MAX_HEIGHT: 64, // in tailwind units (max-h-64)
}

// Animation delays (in seconds)
export const ANIMATION = {
  STAGGER_DELAY: 0.05,
  SUGGESTION_DELAY: 0.03,
}

// Popular search suggestions
export const POPULAR_SEARCHES = [
  'Looking for a weekly house cleaner',
  'I need a handyman for a few small jobs',
  'Monthly lawn care and gardening'
]

// Extract meaningful keywords from search query
export function extractKeywords(query) {
  if (!query || !query.trim()) return []

  return query
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/g, ''))
    .filter(word => word.length >= 3)
    .filter(word => !STOP_WORDS.has(word))
}
