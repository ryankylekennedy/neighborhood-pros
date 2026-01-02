import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CategoryFilter({ 
  categories = [], 
  selectedId, 
  onSelect,
  showAllOption = true 
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Categories</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {showAllOption && (
          <Button
            variant={selectedId === null ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(null)}
            className="whitespace-nowrap flex-shrink-0"
          >
            All
          </Button>
        )}
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedId === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(category.id)}
            className={cn(
              "whitespace-nowrap flex-shrink-0 gap-1.5",
              selectedId === category.id && "shadow-sm"
            )}
          >
            {category.emoji && <span>{category.emoji}</span>}
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
