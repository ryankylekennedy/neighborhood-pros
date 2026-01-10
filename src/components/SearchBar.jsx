import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Shared suggestion list component
function SuggestionList({ suggestions, value, onSelect, maxHeight = 'max-h-72' }) {
  if (!suggestions.length) return null

  return (
    <div className="rounded-lg border bg-card shadow-lg overflow-hidden">
      <div className="p-2 text-xs font-medium text-muted-foreground border-b">
        {value?.trim() ? 'Suggestions' : 'Popular Categories'}
      </div>
      <div className={`${maxHeight} overflow-y-auto`}>
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.type}-${suggestion.label}-${index}`}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted transition-colors text-left text-sm"
            onClick={() => onSelect(suggestion)}
          >
            <span>{suggestion.label}</span>
            <Badge variant="outline" className="text-xs">
              {suggestion.type}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}

// Shared search input component
function SearchInput({ inputRef, value, onChange, onFocus, placeholder, onClear, size = 'default' }) {
  const sizeClasses = size === 'large' ? 'pl-10 pr-10 h-12 text-base' : 'pl-9 pr-9 w-64 lg:w-80'
  const iconSize = size === 'large' ? 'h-5 w-5' : 'h-4 w-4'
  const clearSize = size === 'large' ? 16 : 14

  return (
    <div className="relative flex-1">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconSize} text-muted-foreground pointer-events-none`} />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        className={sizeClasses}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
        >
          <X size={clearSize} className="text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

export function SearchBar({
  value,
  onChange,
  suggestions = [],
  onSuggestionSelect,
  placeholder = "Search professionals..."
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false)
        if (!value) setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  const filteredSuggestions = value?.trim()
    ? suggestions.filter(s => s.label.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : suggestions.slice(0, 6)

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const handleInputChange = (e) => {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  const handleSelect = (suggestion) => {
    onSuggestionSelect?.(suggestion)
    setIsExpanded(false)
    setShowSuggestions(false)
  }

  return (
    <>
      {/* Mobile: Icon that expands to full-screen search */}
      <div className="md:hidden">
        <Button variant="outline" size="icon" onClick={() => setIsExpanded(true)}>
          <Search size={20} />
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50"
                onClick={() => setIsExpanded(false)}
              />
              <motion.div
                ref={containerRef}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-0 left-0 right-0 z-50 bg-background shadow-lg"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                      <ArrowLeft size={20} />
                    </Button>
                    <SearchInput
                      inputRef={inputRef}
                      value={value}
                      onChange={handleInputChange}
                      onFocus={() => setShowSuggestions(true)}
                      onClear={handleClear}
                      placeholder={placeholder}
                      size="large"
                    />
                  </div>

                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3"
                    >
                      <SuggestionList
                        suggestions={filteredSuggestions}
                        value={value}
                        onSelect={handleSelect}
                        maxHeight="max-h-[60vh]"
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Always visible search bar */}
      <div className="hidden md:block relative" ref={containerRef}>
        <SearchInput
          inputRef={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onClear={handleClear}
          placeholder={placeholder}
        />

        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <SuggestionList
                suggestions={filteredSuggestions}
                value={value}
                onSelect={handleSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
