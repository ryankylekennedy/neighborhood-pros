import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, Search, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BusinessCard } from '@/components/BusinessCard'
import { useBusinesses, useCategories, useSubcategories } from '@/hooks/useBusinesses'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null)

  const { businesses, loading, hasMore, loadMore } = useBusinesses({
    subcategoryId: selectedSubcategoryId,
    searchQuery,
    limit: 12
  })

  const { categories } = useCategories()
  const { subcategories } = useSubcategories(selectedCategoryId)
  const { isFavorite, toggleFavorite } = useFavorites()

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const selectedSubcategory = subcategories.find(s => s.id === selectedSubcategoryId)

  const handleFavoriteClick = async (business) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites.",
        variant: "destructive"
      })
      return
    }
    await toggleFavorite(business.id)
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
  }

  const isFilterActive = searchQuery.trim() !== '' || selectedCategoryId !== null

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
              Local Businesses
            </motion.h1>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/favorites')}
                className="gap-2"
              >
                <Bookmark size={18} />
                <span className="hidden sm:inline">My Favorites</span>
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

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
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
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
              {selectedCategory && (
                <Badge variant="outline">{selectedCategory.emoji} {selectedCategory.name}</Badge>
              )}
              {selectedSubcategory && (
                <Badge variant="outline">{selectedSubcategory.name}</Badge>
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
    </div>
  )
}