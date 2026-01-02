import { motion } from 'framer-motion'
import { User, Heart, Bookmark, MapPin, Star, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ProfessionalCard({ 
  professional, 
  isFavorite = false, 
  isPreferred = false,
  onFavoriteClick,
  onClick,
  animationDelay = 0
}) {
  const { 
    name, 
    photo_url, 
    emoji, 
    category,
    subcategories = [],
    recommendations = [],
    description
  } = professional

  const subcategoryList = subcategories
    ?.map(ps => ps.subcategory?.name)
    .filter(Boolean) || []

  const recommendationsCount = Array.isArray(recommendations) 
    ? recommendations.length 
    : recommendations?.count || 0

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    onFavoriteClick?.(professional)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card 
        className={cn(
          "group relative overflow-hidden cursor-pointer card-hover border-0 shadow-sm",
          isPreferred && "favorite-highlight"
        )}
        onClick={() => onClick?.(professional)}
      >
        <div className="p-5">
          {/* Top row: Avatar + Bookmark */}
          <div className="flex items-start justify-between mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className={cn(
                "w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center",
                "bg-gradient-to-br from-green-100 to-green-50",
                "ring-2 ring-white shadow-sm"
              )}>
                {photo_url ? (
                  <img
                    src={photo_url}
                    alt={name || "Professional"}
                    className="w-full h-full object-cover"
                  />
                ) : emoji ? (
                  <span className="text-3xl">{emoji}</span>
                ) : (
                  <User className="h-8 w-8 text-green-600" strokeWidth={1.5} />
                )}
              </div>
              
              {/* Verified badge */}
              {isPreferred && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <CheckCircle2 className="w-4 h-4 text-white" fill="currentColor" />
                </div>
              )}
            </div>

            {/* Bookmark button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavoriteClick}
              className={cn(
                "h-10 w-10 rounded-full btn-press",
                "hover:bg-green-50",
                isFavorite && "bg-green-50"
              )}
            >
              <Bookmark
                size={20}
                className={cn(
                  "transition-colors",
                  isFavorite ? "fill-green-600 text-green-600" : "text-warm-400"
                )}
              />
            </Button>
          </div>

          {/* Name and category */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-warm-900 group-hover:text-green-700 transition-colors line-clamp-1">
              {name || "Unnamed Professional"}
            </h3>
            {category?.name && (
              <p className="text-sm text-warm-500 flex items-center gap-1.5 mt-0.5">
                {category.emoji && <span>{category.emoji}</span>}
                {category.name}
              </p>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-3 mb-3">
            {isPreferred && (
              <span className="trust-badge">
                <MapPin size={12} />
                Neighborhood Favorite
              </span>
            )}
            {recommendationsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                <Heart size={14} className="fill-green-600 text-green-600" />
                {recommendationsCount} neighbor{recommendationsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Services tags */}
          {subcategoryList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {subcategoryList.slice(0, 3).map((label, index) => (
                <span 
                  key={index} 
                  className="inline-flex px-2.5 py-1 bg-warm-100 text-warm-600 text-xs font-medium rounded-full"
                >
                  {label}
                </span>
              ))}
              {subcategoryList.length > 3 && (
                <span className="inline-flex px-2.5 py-1 bg-warm-100 text-warm-500 text-xs font-medium rounded-full">
                  +{subcategoryList.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover reveal: Quick description */}
        {description && (
          <div className="px-5 pb-4 pt-0">
            <p className="text-sm text-warm-500 line-clamp-2">
              {description}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
