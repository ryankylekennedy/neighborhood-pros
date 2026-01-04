import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, ArrowLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BusinessCard } from '@/components/BusinessCard'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { BookmarkDialog } from '@/components/BookmarkDialog'

export function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { favorites, loading, isFavorite, toggleFavorite } = useFavorites()
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)

  const handleFavoriteClick = async (business) => {
    // Check if it's currently favorited BEFORE toggling
    const wasAlreadyFavorited = isFavorite(business.id)

    await toggleFavorite(business.id)

    // If it wasn't favorited before, it was just added - show dialog
    if (!wasAlreadyFavorited) {
      setSelectedBusiness(business)
      setShowBookmarkDialog(true)
    } else {
      // It was favorited before, so it was just removed
      toast({
        title: "Removed from favorites",
        description: `${business.name} has been removed from your favorites.`
      })
    }
  }

  const handleCardClick = (business) => {
    navigate(`/business/${business.id}`)
  }

  // If not logged in
  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 -ml-2"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Bookmark size={40} className="text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Sign in to see your favorites
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Create an account to save your favorite businesses and get personalized recommendations.
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Businesses
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 -ml-2"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            My Favorites
          </h1>
          <p className="text-muted-foreground mt-2">
            Your saved businesses for quick access
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && favorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[300px] text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Start browsing businesses and bookmark the ones you like to build your personal list.
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Businesses
            </Button>
          </motion.div>
        )}

        {/* Favorites Grid */}
        {!loading && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav, index) => (
              <BusinessCard
                key={fav.id}
                business={fav.business}
                isFavorite={true}
                onFavoriteClick={() => handleFavoriteClick(fav.business)}
                onClick={() => handleCardClick(fav.business)}
                animationDelay={index * 0.05}
              />
            ))}
          </div>
        )}
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
