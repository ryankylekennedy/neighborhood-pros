import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bookmark,
  Heart,
  Phone,
  Mail,
  Globe,
  User,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBusiness } from '@/hooks/useBusinesses'
import { useFavorites } from '@/hooks/useFavorites'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { BookmarkDialog } from '@/components/BookmarkDialog'

export function BusinessDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { business, loading, error } = useBusiness(id)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { addRecommendation, hasRecommended, loading: recLoading } = useRecommendations()

  const [recommendNote, setRecommendNote] = useState('')
  const [showRecommendForm, setShowRecommendForm] = useState(false)
  const [alreadyRecommended, setAlreadyRecommended] = useState(false)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)

  // Check if user already recommended this business
  useEffect(() => {
    if (user && id) {
      hasRecommended(id).then(setAlreadyRecommended)
    }
  }, [user, id, hasRecommended])

  const handleFavoriteClick = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites.",
        variant: "destructive"
      })
      return
    }

    // Check if it's currently favorited BEFORE toggling
    const wasAlreadyFavorited = isFavorite(id)

    await toggleFavorite(id)

    // If it wasn't favorited before, it was just added - show dialog
    if (!wasAlreadyFavorited) {
      setShowBookmarkDialog(true)
    } else {
      // It was favorited before, so it was just removed
      toast({
        title: "Removed from favorites",
        variant: "default"
      })
    }
  }

  const handleRecommend = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to recommend businesses.",
        variant: "destructive"
      })
      return
    }

    const { error } = await addRecommendation(id, recommendNote)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Thanks for your recommendation!",
        description: "Your neighbors will appreciate it.",
        variant: "success"
      })
      setShowRecommendForm(false)
      setRecommendNote('')
      setAlreadyRecommended(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Business not found</p>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </div>
    )
  }

  const primaryCategory = business.business_services?.[0]?.service?.subcategory?.category
  const services = business.business_services?.map(bs => bs.service).filter(Boolean) || []
  const recommendations = business.recommendations || []

  return (
    <div className="min-h-screen pb-12">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-display font-bold">
                        {business.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {primaryCategory && (
                          <Badge variant="secondary">
                            {primaryCategory.emoji && (
                              <span className="mr-1">{primaryCategory.emoji}</span>
                            )}
                            {primaryCategory.name}
                          </Badge>
                        )}
                      </div>

                      {/* Services */}
                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {services.slice(0, 5).map((service, i) => (
                            <Badge key={i} variant="outline">
                              {service.name}
                            </Badge>
                          ))}
                          {services.length > 5 && (
                            <Badge variant="outline">
                              +{services.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Recommendation count */}
                      {recommendations.length > 0 && (
                        <div className="flex items-center gap-2 mt-4 text-primary font-medium">
                          <Heart size={18} className="fill-current" />
                          <span>
                            Recommended by {recommendations.length} neighbor
                            {recommendations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFavoriteClick}
                      className="flex-shrink-0"
                    >
                      <Bookmark
                        size={20}
                        className={isFavorite(id) ? 'fill-primary text-primary' : ''}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Description */}
            {business.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {business.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Neighbor Recommendations</CardTitle>
                  {user && !alreadyRecommended && (
                    <Button
                      size="sm"
                      onClick={() => setShowRecommendForm(!showRecommendForm)}
                    >
                      <Heart size={16} className="mr-2" />
                      Recommend
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Recommendation Form */}
                  {showRecommendForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 p-4 bg-muted/50 rounded-lg"
                    >
                      <p className="text-sm text-muted-foreground mb-3">
                        Share why you recommend this business:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="They did great work on my kitchen renovation..."
                          value={recommendNote}
                          onChange={(e) => setRecommendNote(e.target.value)}
                        />
                        <Button onClick={handleRecommend} disabled={recLoading}>
                          <Send size={16} />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Recommendations List */}
                  {recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.map((rec, i) => (
                        <div
                          key={rec.id || i}
                          className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {rec.user?.avatar_url ? (
                              <img
                                src={rec.user.avatar_url}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User size={18} className="text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {rec.user?.full_name || 'A neighbor'}
                            </p>
                            {rec.note && (
                              <p className="text-muted-foreground text-sm mt-1">
                                "{rec.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      No recommendations yet. Be the first to recommend!
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Phone size={18} className="text-primary" />
                      <span>{business.phone}</span>
                    </a>
                  )}
                  {business.email && (
                    <a
                      href={`mailto:${business.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Mail size={18} className="text-primary" />
                      <span className="truncate">{business.email}</span>
                    </a>
                  )}
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Globe size={18} className="text-primary" />
                      <span className="truncate">Visit Website</span>
                    </a>
                  )}
                  {!business.phone && !business.email && !business.website && (
                    <p className="text-muted-foreground text-sm">
                      No contact information available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <BookmarkDialog
        open={showBookmarkDialog}
        onOpenChange={setShowBookmarkDialog}
        business={business}
        hasRecommended={alreadyRecommended}
      />
    </div>
  )
}
