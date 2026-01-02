import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, Heart, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfessionalCard } from '@/components/ProfessionalCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryFilter } from '@/components/CategoryFilter'
import { useProfessionals, useCategories } from '@/hooks/useProfessionals'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [recommendDialog, setRecommendDialog] = useState({ open: false, professional: null })

  const userNeighborhoodId = profile?.neighborhood_id || null

  const { professionals, loading, hasMore, loadMore } = useProfessionals({
    categoryId: selectedCategoryId,
    searchQuery,
    userNeighborhoodId,
    limit: 12
  })

  const { categories } = useCategories()
  const { isFavorite, toggleFavorite } = useFavorites()

  // Build search suggestions
  const suggestions = useMemo(() => {
    const suggestionList = []
    const seen = new Set()

    categories.forEach(cat => {
      if (!seen.has(cat.name.toLowerCase())) {
        suggestionList.push({ label: cat.name, type: 'Category', id: cat.id })
        seen.add(cat.name.toLowerCase())
      }
    })

    professionals.forEach(pro => {
      if (pro.name && !seen.has(pro.name.toLowerCase())) {
        suggestionList.push({ label: pro.name, type: 'Professional', id: pro.id })
        seen.add(pro.name.toLowerCase())
      }
      pro.subcategories?.forEach(ps => {
        const name = ps.subcategory?.name
        if (name && !seen.has(name.toLowerCase())) {
          suggestionList.push({ label: name, type: 'Service' })
          seen.add(name.toLowerCase())
        }
      })
    })

    return suggestionList
  }, [categories, professionals])

  const isPreferredPartner = (professional) => {
    if (!userNeighborhoodId) return false
    return professional.preferred_neighborhoods?.some(
      pn => pn.neighborhood?.id === userNeighborhoodId
    )
  }

  const handleFavoriteClick = async (professional) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites and recommend professionals.",
        variant: "destructive"
      })
      return
    }

    const currentlyFavorited = isFavorite(professional.id)
    
    if (!currentlyFavorited) {
      setRecommendDialog({ open: true, professional })
    } else {
      await toggleFavorite(professional.id)
      toast({
        title: "Removed from favorites",
        description: `${professional.name} has been removed from your favorites.`
      })
    }
  }

  const handleRecommendResponse = async (shouldRecommend) => {
    const { professional } = recommendDialog
    
    await toggleFavorite(professional.id)
    
    if (shouldRecommend) {
      navigate(`/professional/${professional.id}?recommend=true`)
    } else {
      toast({
        title: "Added to favorites",
        description: `${professional.name} has been saved to your favorites.`,
        variant: "success"
      })
    }
    
    setRecommendDialog({ open: false, professional: null })
  }

  const handleCardClick = (professional) => {
    navigate(`/professional/${professional.id}`)
  }

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'Category') {
      setSelectedCategoryId(suggestion.id)
      setSearchQuery('')
    } else {
      setSearchQuery(suggestion.label)
    }
  }

  const isSearchActive = searchQuery.trim() !== '' || selectedCategoryId !== null

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategoryId(null)
  }

  const pageTitle = profile?.neighborhood?.name 
    ? `${profile.neighborhood.name} Professionals`
    : 'Local Professionals'

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-display font-bold text-foreground"
              >
                {pageTitle}
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
                
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  suggestions={suggestions}
                  onSuggestionSelect={handleSuggestionSelect}
                  placeholder="Search by name or service..."
                />
              </div>
            </div>

            {isSearchActive && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearSearch}
                  className="gap-2"
                >
                  <X size={16} />
                  Clear filters
                </Button>
                {searchQuery.trim() && (
                  <Badge variant="outline">
                    Search: {searchQuery}
                  </Badge>
                )}
                {selectedCategoryId && (
                  <Badge variant="outline">
                    Category: {categories.find(c => c.id === selectedCategoryId)?.name}
                  </Badge>
                )}
              </motion.div>
            )}
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          )}

          {/* Loading State */}
          {loading && professionals.length === 0 && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading professionals...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && professionals.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[300px] text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No professionals found
              </h3>
              <p className="text-muted-foreground max-w-md">
                {isSearchActive 
                  ? "Try adjusting your search or clearing filters."
                  : "Check back soon for local professionals in your area."}
              </p>
            </motion.div>
          )}

          {/* Professional Cards Grid */}
          {professionals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionals.map((professional, index) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  isFavorite={isFavorite(professional.id)}
                  isPreferred={isPreferredPartner(professional)}
                  onFavoriteClick={handleFavoriteClick}
                  onClick={handleCardClick}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && professionals.length > 0 && (
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

      {/* Recommend Dialog */}
      <Dialog 
        open={recommendDialog.open} 
        onOpenChange={(open) => !open && setRecommendDialog({ open: false, professional: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recommend to Neighbors?</DialogTitle>
            <DialogDescription>
              Would you like to recommend {recommendDialog.professional?.name} to your neighbors?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => handleRecommendResponse(true)}>
              Yes, Recommend
            </Button>
            <Button variant="outline" onClick={() => handleRecommendResponse(false)}>
              No, Just Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
