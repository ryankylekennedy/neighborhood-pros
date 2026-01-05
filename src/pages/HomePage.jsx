import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Search, X, ChevronDown, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BusinessCard } from '@/components/BusinessCard'
import { useBusinesses, useCategories, useSubcategories, useServices } from '@/hooks/useBusinesses'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { BookmarkDialog } from '@/components/BookmarkDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef(null)

  // Popular search suggestions
  const popularSearches = [
    'Looking for a weekly house cleaner',
    'I need a handyman for a few small jobs',
    'Monthly lawn care and gardening'
  ]

  const { businesses, loading, hasMore, loadMore } = useBusinesses({
    subcategoryId: selectedSubcategoryId,
    serviceId: selectedServiceId,
    searchQuery,
    limit: 12
  })

  const { categories } = useCategories()
  const { subcategories } = useSubcategories(selectedCategoryId)
  const { subcategories: allSubcategories } = useSubcategories(null) // Get all subcategories for autocomplete
  const { favorites, isFavorite, toggleFavorite } = useFavorites()
  const { services } = useServices() // Fetch all services for autocomplete

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const selectedSubcategory = allSubcategories.find(s => s.id === selectedSubcategoryId)
  const selectedService = services.find(s => s.id === selectedServiceId)

  // Filter services AND subcategories for autocomplete based on search query
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return []
    }

    const query = searchQuery.toLowerCase().trim()

    // Search services
    const matchingServices = services
      .filter(service =>
        service.name.toLowerCase().includes(query)
      )
      .map(service => ({ ...service, type: 'service' }))

    // Search subcategories
    const matchingSubcategories = allSubcategories
      .filter(subcategory =>
        subcategory.name.toLowerCase().includes(query)
      )
      .map(subcategory => ({ ...subcategory, type: 'subcategory' }))

    // Combine and limit to 8 suggestions (prioritize subcategories)
    return [...matchingSubcategories, ...matchingServices].slice(0, 8)
  }, [searchQuery, services, allSubcategories])

  const handleFavoriteClick = async (business) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites.",
        variant: "destructive"
      })
      return
    }

    // Check if it's currently favorited BEFORE toggling
    const wasAlreadyFavorited = isFavorite(business.id)

    await toggleFavorite(business.id)

    // If it wasn't favorited before, it was just added - show dialog
    if (!wasAlreadyFavorited) {
      setSelectedBusiness(business)
      setShowBookmarkDialog(true)
    }
  }

  const handleCardClick = (business) => {
    navigate(`/business/${business.id}`)
  }

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedSubcategoryId(null)
  }

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategoryId(subcategoryId)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategoryId(null)
    setSelectedSubcategoryId(null)
    setSelectedServiceId(null)
  }

  const handleSearchFocus = () => {
    setIsSearchFocused(true)
  }

  const handleSearchCancel = () => {
    setIsSearchFocused(false)
    setSearchQuery('')
  }

  const handleSearchSubmit = () => {
    setIsSearchFocused(false)
    // The search query is already being used by useBusinesses hook
  }

  const handlePopularSearchClick = (searchText) => {
    setSearchQuery(searchText)
    setIsSearchFocused(false)
  }

  const handleAutocompleteSelect = (item) => {
    if (item.type === 'service') {
      setSelectedServiceId(item.id)
      setSelectedSubcategoryId(null) // Clear subcategory when service is selected
    } else if (item.type === 'subcategory') {
      setSelectedSubcategoryId(item.id)
      setSelectedServiceId(null) // Clear service when subcategory is selected
    }
    setSearchQuery('') // Clear search query
    setIsSearchFocused(false) // Close the focused search view
  }

  // Keep input focused when entering focused mode
  useEffect(() => {
    if (isSearchFocused && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchFocused])

  const isFilterActive = searchQuery.trim() !== '' || selectedCategoryId !== null || selectedSubcategoryId !== null || selectedServiceId !== null

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-display font-bold text-foreground"
            >
              {profile?.neighborhood?.name ? `${profile.neighborhood.name} Businesses` : 'Local Businesses'}
            </motion.h1>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/favorites')}
                className="gap-2 relative"
              >
                <Bookmark
                  size={18}
                  className={favorites.length > 0 ? 'fill-primary text-primary' : ''}
                />
                <span className="hidden sm:inline">My Favorites</span>
                {favorites.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {favorites.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search */}
          {!isSearchFocused ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search businesses..."
                data-testid="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : null}

          {/* Focused Search Overlay */}
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background z-50 flex flex-col"
              >
                {/* Header with Cancel and Search */}
                <div className="flex items-center justify-between px-4 py-4 border-b">
                  <Button
                    variant="ghost"
                    onClick={handleSearchCancel}
                    className="text-primary hover:text-primary/80"
                    data-testid="search-cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSearchSubmit}
                    className="text-primary hover:text-primary/80"
                    data-testid="search-submit-button"
                  >
                    Search
                  </Button>
                </div>

                {/* Search Input */}
                <div className="px-4 py-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Describe your project or problem — be as detailed as you want"
                      data-testid="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={(e) => {
                        // Prevent blur when clicking inside the overlay
                        if (e.relatedTarget?.closest('.focused-search-content')) {
                          e.target.focus()
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 text-base border-b border-border focus:outline-none focus:border-primary transition-colors bg-transparent"
                    />
                  </div>
                </div>

                {/* Autocomplete Suggestions */}
                {autocompleteSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-4 border-b focused-search-content"
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-2">Suggestions</div>
                    <div className="flex flex-col gap-1">
                      {autocompleteSuggestions.map((item, index) => (
                        <motion.button
                          key={`${item.type}-${item.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleAutocompleteSelect(item)}
                          className="text-left px-3 py-2 rounded-md hover:bg-muted transition-colors focused-search-content"
                        >
                          <div className="flex items-center gap-2">
                            <Search size={14} className="text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-foreground truncate">{item.name}</div>
                              {item.type === 'service' && item.subcategory ? (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  {item.subcategory.category?.emoji && (
                                    <span>{item.subcategory.category.emoji}</span>
                                  )}
                                  <span className="truncate">
                                    Service • {item.subcategory.category?.name} • {item.subcategory.name}
                                  </span>
                                </div>
                              ) : item.type === 'subcategory' && item.category ? (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  {item.category.emoji && (
                                    <span>{item.category.emoji}</span>
                                  )}
                                  <span className="truncate">
                                    Category • {item.category.name}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Location */}
                {profile?.neighborhood && (
                  <div className="px-4 pb-6 border-b">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin size={20} className="text-muted-foreground" />
                      <span className="text-base">{profile.neighborhood.name}</span>
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div className="px-4 py-6 flex-1 overflow-y-auto focused-search-content">
                  <h3 className="text-base font-medium mb-4 text-foreground/60">Popular searches</h3>
                  <div className="flex flex-col gap-2">
                    {popularSearches.map((search, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handlePopularSearchClick(search)}
                        className={`text-left px-4 py-4 rounded-lg transition-colors ${
                          index === 2
                            ? 'bg-primary/5 hover:bg-primary/10'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span className="text-base text-foreground">{search}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category & Subcategory Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Category Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {selectedCategory ? (
                    <>
                      <span>{selectedCategory.emoji}</span>
                      <span>{selectedCategory.name}</span>
                    </>
                  ) : (
                    'All Categories'
                  )}
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => handleCategorySelect(null)}>
                  All Categories
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <span className="mr-2">{category.emoji}</span>
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Subcategory Dropdown (only show when category is selected) */}
            {selectedCategoryId && subcategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {selectedSubcategory ? selectedSubcategory.name : 'All Subcategories'}
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem onClick={() => handleSubcategorySelect(null)}>
                    All Subcategories
                  </DropdownMenuItem>
                  {subcategories.map((sub) => (
                    <DropdownMenuItem 
                      key={sub.id} 
                      onClick={() => handleSubcategorySelect(sub.id)}
                    >
                      {sub.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Clear Filters */}
            {isFilterActive && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2" data-testid="clear-filters-button">
                <X size={16} />
                Clear filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {isFilterActive && (
            <div className="flex flex-wrap gap-2">
              {searchQuery.trim() && (
                <Badge variant="outline">Search: {searchQuery}</Badge>
              )}
              {selectedService && (
                <Badge variant="outline" className="bg-primary/10">
                  Service: {selectedService.name}
                </Badge>
              )}
              {selectedSubcategory && !selectedService && (
                <Badge variant="outline" className="bg-primary/10">
                  {selectedSubcategory.category?.emoji && (
                    <span className="mr-1">{selectedSubcategory.category.emoji}</span>
                  )}
                  {selectedSubcategory.name}
                </Badge>
              )}
              {selectedCategory && !selectedSubcategory && (
                <Badge variant="outline">{selectedCategory.emoji} {selectedCategory.name}</Badge>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && businesses.length === 0 && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading businesses...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && businesses.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[300px] text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No businesses found
              </h3>
              <p className="text-muted-foreground max-w-md">
                {isFilterActive 
                  ? "Try adjusting your search or clearing filters."
                  : "Check back soon for local businesses in your area."}
              </p>
            </motion.div>
          )}

          {/* Business Cards Grid */}
          {businesses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map((business, index) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  isFavorite={isFavorite(business.id)}
                  onFavoriteClick={handleFavoriteClick}
                  onClick={handleCardClick}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && businesses.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMore}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <BookmarkDialog
        open={showBookmarkDialog}
        onOpenChange={setShowBookmarkDialog}
        business={selectedBusiness}
        hasRecommended={false}
      />
    </div>
  )
}