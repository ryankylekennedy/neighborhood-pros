import { motion } from 'framer-motion'
import { Bookmark, Phone, Mail, Globe, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BusinessCard({ 
  business, 
  isFavorite = false, 
  onFavoriteClick, 
  onClick,
  animationDelay = 0 
}) {
  // Get unique categories from business services
  const categories = [...new Set(
    business.business_services?.map(bs => bs.service?.subcategory?.category?.name).filter(Boolean)
  )]
  
  const emoji = business.business_services?.[0]?.service?.subcategory?.category?.emoji || '🏢'
  
  // Get unique subcategories
  const subcategories = [...new Set(
    business.business_services?.map(bs => bs.service?.subcategory?.name).filter(Boolean)
  )]

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    onFavoriteClick?.(business)
  }

  const handleClick = () => {
    onClick?.(business)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      onClick={handleClick}
      className={cn(
        "group relative bg-card rounded-xl border shadow-sm p-5 cursor-pointer",
        "hover:shadow-md hover:border-primary/20 transition-all duration-200"
      )}
    >
      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFavoriteClick}
        className={cn(
          "absolute top-3 right-3 h-8 w-8 rounded-full",
          isFavorite && "text-primary"
        )}
      >
        <Bookmark 
          size={18} 
          className={cn(isFavorite && "fill-current")} 
        />
      </Button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pr-8">
        <div className="text-3xl">{emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {business.name}
          </h3>
          {categories.length > 0 && (
            <p className="text-sm text-muted-foreground truncate">
              {categories.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {business.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {business.description}
        </p>
      )}

      {/* Subcategories/Services */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {subcategories.slice(0, 3).map((sub) => (
            <Badge key={sub} variant="secondary" className="text-xs">
              {sub}
            </Badge>
          ))}
          {subcategories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{subcategories.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Contact Info */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {business.phone && (
          <div className="flex items-center gap-1">
            <Phone size={14} />
            <span>{business.phone}</span>
          </div>
        )}
        {business.email && (
          <div className="flex items-center gap-1">
            <Mail size={14} />
            <span className="truncate max-w-[150px]">{business.email}</span>
          </div>
        )}
        {business.website && (
          <div className="flex items-center gap-1">
            <Globe size={14} />
            <span>Website</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}