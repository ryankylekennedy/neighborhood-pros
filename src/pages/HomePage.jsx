import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, X, MapPin, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProfessionalCard } from '@/components/ProfessionalCard'
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
  const neighborhoodName = profile?.neighborhood?.name

  const { professionals, loading, hasMore, loadMore } = useProfessionals({
    categoryId: selectedCategoryId,
    searchQuery,
    userNeighborhoodId,
    limit: 12
  })

  const { categories } = useCategories()
  const { isFavorite, toggleFavorite } = useFavorites()

  const isPreferredPartner = (professional) => {
    if (!userNeighborhoodId) return false
    return professional.preferred_neighborhoods?.some(
      pn => pn.neighborhood?.id === userNeighborhoodId
    )
  }

  const handleFavoriteClick = async (professional) => {
    if (!user) {
      toast({
        title: "Join your neighbors",
        description: "Sign in to save favorites and recommend pros.",
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
        title: "Removed from saved",
        description: `${professional.name} removed from your list.`
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
        title: "Saved!",
        description: `${professional.name} added to your list.`,
        variant: "success"
      })
    }
    
    setRecommendDialog({ open: false, professional: null })
  }

  const handleCardClick = (professional) => {
    navigate(`/professional/${professional.id}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategoryId(null)
  }

  const isFiltering = searchQuery.trim() !== '' || selectedCategoryId !== null

  // Count preferred pros
  const preferredCount = professionals.filter(p => isPreferredPartner(p)).length

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Hero Section */}
      <div className="bg-white border-b border-warm-100">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-warm-900 mb-3">
              {neighborhoodName ? (
                <>Find trusted pros in <span className="text-green-600">{neighborhoodName}</span></>
              ) : (
                <>Find trusted <span className="text-green-600">local pros</span></>
              )}
            </h1>
            <p className="text-lg text-warm-500 mb-6">
              Discover professionals recommended by your neighbors
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-400" />
              <Input
                type="text"
                placeholder="Search for any service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-base rounded-2xl border-warm-200 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-warm-100 rounded-full transition-colors"
                >
                  <X size={18} className="text-warm-400" />
                </button>
              )}
            </div>

            {/* Stats */}
            {neighborhoodName && preferredCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 mt-6 text-sm"
              >
                <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                  <Sparkles size={14} />
                  {preferredCount} neighborhood favorite{preferredCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 text-warm-500">
                  <Users size={14} />
                  {professionals.length} total pros
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                onClick={() => setSelectedCategoryId(null)}
                className={`rounded-full whitespace-nowrap flex-shrink-0 btn-press ${
                  selectedCategoryId === null 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-white hover:bg-warm-50 border-warm-200'
                }`}
              >
                All Services
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-full whitespace-nowrap flex-shrink-0 gap-1.5 btn-press ${
                    selectedCategoryId === category.id 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-white hover:bg-warm-50 border-warm-200'
                  }`}
                >
                  {category.emoji && <span>{category.emoji}</span>}
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {isFiltering && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="text-sm text-warm-500">Filtering by:</span>
            {searchQuery && (
              <Badge variant="secondary" className="bg-white border border-warm-200 gap-1">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              </Badge>
            )}
            {selectedCategoryId && (
              <Badge variant="secondary" className="bg-white border border-warm-200 gap-1">
                {categories.find(c => c.id === selectedCategoryId)?.name}
                <button onClick={() => setSelectedCategoryId(null)}>
                  <X size={12} />
                </button>
              </Badge>
            )}
            <button 
              onClick={clearFilters}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear all
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && professionals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
            <p className="text-warm-500">Finding pros near you...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && professionals.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-warm-100 flex items-center justify-center mb-4">
              <Search size={32} className="text-warm-400" />
            </div>
            <h3 className="text-xl font-semibold text-warm-800 mb-2">
              No pros found
            </h3>
            <p className="text-warm-500 max-w-md mb-6">
              {isFiltering 
                ? "Try adjusting your search or browse all categories."
                : "Check back soon — we're growing every day!"}
            </p>
            {isFiltering && (
              <Button onClick={clearFilters} variant="outline">
                Clear filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Results Grid */}
        {professionals.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {professionals.map((professional, index) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  isFavorite={isFavorite(professional.id)}
                  isPreferred={isPreferredPartner(professional)}
                  onFavoriteClick={handleFavoriteClick}
                  onClick={handleCardClick}
                  animationDelay={Math.min(index * 0.05, 0.3)}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-8">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 btn-press"
                >
                  {loading ? 'Loading...' : 'Show more pros'}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recommend Dialog */}
      <Dialog 
        open={recommendDialog.open} 
        onOpenChange={(open) => !open && setRecommendDialog({ open: false, professional: null })}
      >
        <DialogContent className="sm:max-w-md border-0 shadow-xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <DialogTitle className="text-xl">
              Help your neighbors?
            </DialogTitle>
            <DialogDescription className="text-warm-500">
              Would you recommend <span className="font-medium text-warm-700">{recommendDialog.professional?.name}</span> to others in your neighborhood?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <Button 
              onClick={() => handleRecommendResponse(true)}
              className="w-full bg-green-600 hover:bg-green-700 btn-press"
            >
              Yes, recommend them
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleRecommendResponse(false)}
              className="w-full"
            >
              Just save for now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
