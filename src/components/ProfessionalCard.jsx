import { motion } from 'framer-motion'
import { User, Heart, Bookmark, Trophy } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
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
    recommendations = []
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group",
          isPreferred && "ring-2 ring-primary/30 bg-primary/[0.02]"
        )}
        onClick={() => onClick?.(professional)}
      >
        <div className="flex flex-row gap-4 p-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10">
            {photo_url ? (
              <img
                src={photo_url}
                alt={name || "Professional"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {emoji ? (
                  <span className="text-2xl">{emoji}</span>
                ) : (
                  <User className="h-8 w-8 text-primary/60" strokeWidth={1.5} />
                )}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base line-clamp-2 break-words group-hover:text-primary transition-colors">
                {name || "Unnamed Professional"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteClick}
                className="flex-shrink-0 h-8 w-8 hover:bg-primary/10"
              >
                <Bookmark
                  size={18}
                  className={cn(
                    "transition-colors",
                    isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                  )}
                />
              </Button>
            </div>
            
            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {isPreferred && (
                <Badge variant="default" className="gap-1 text-xs bg-primary/90">
                  <Trophy size={12} />
                  Neighborhood Favorite
                </Badge>
              )}
              {category?.name && (
                <Badge variant="secondary" className="text-xs">
                  {category.emoji && <span className="mr-1">{category.emoji}</span>}
                  {category.name}
                </Badge>
              )}
              {recommendationsCount > 0 && (
                <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Heart size={14} className="fill-current" />
                  <span>{recommendationsCount} {recommendationsCount === 1 ? 'Neighbor' : 'Neighbors'}</span>
                </div>
              )}
            </div>
            
            {/* Subcategories */}
            {subcategoryList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subcategoryList.slice(0, 3).map((label, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-2 py-0.5"
                  >
                    {label}
                  </Badge>
                ))}
                {subcategoryList.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{subcategoryList.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
