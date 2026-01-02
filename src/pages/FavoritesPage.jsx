import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, ArrowLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfessionalCard } from '@/components/ProfessionalCard'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'

export function FavoritesPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { favorites, loading, isFavorite, toggleFavorite } = useFavorites()

  const userNeighborhoodId = profile?.neighborhood_id || null

  const isPreferredPartner = (professional) => {
    if (!userNeighborhoodId || !professional?.preferred_neighborhoods) return false
    return professional.preferred_neighborhoods.some(
      pn => pn.neighborhood?.id === userNeighborhoodId
    )
  }

  const handleFavoriteClick = async (professional) => {
    const result = await toggleFavorite(professional.id)
    if (!result.error) {
      toast({
        title: "Removed from favorites",
        description: `${professional.name} has been removed from your favorites.`
      })
    }
  }

  const handleCardClick = (professional) => {
    navigate(`/professional/${professional.id}`)
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
              Create an account to save your favorite professionals and get personalized recommendations.
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Professionals
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
            Your saved professionals for quick access
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
              Start browsing professionals and bookmark the ones you like to build your personal list.
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Professionals
            </Button>
          </motion.div>
        )}

        {/* Favorites Grid */}
        {!loading && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav, index) => (
              <ProfessionalCard
                key={fav.id}
                professional={fav.professional}
                isFavorite={true}
                isPreferred={isPreferredPartner(fav.professional)}
                onFavoriteClick={() => handleFavoriteClick(fav.professional)}
                onClick={() => handleCardClick(fav.professional)}
                animationDelay={index * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
