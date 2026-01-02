import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

  const filteredSuggestions = value.trim() 
    ? suggestions.filter(s => 
        s.label.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : suggestions.slice(0, 6)

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Mobile: Icon that expands to full-screen search */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(true)}
        >
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsExpanded(false)}
                    >
                      <ArrowLeft size={20} />
                    </Button>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => {
                          onChange(e.target.value)
                          setShowSuggestions(true)
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="pl-10 pr-10 h-12 text-base"
                      />
                      {value && (
                        <button
                          onClick={handleClear}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                        >
                          <X size={16} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Suggestions */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 rounded-lg border bg-card shadow-md overflow-hidden"
                    >
                      <div className="p-2 text-xs font-medium text-muted-foreground border-b">
                        {value.trim() ? 'Suggestions' : 'Popular Categories'}
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.type}-${suggestion.label}-${index}`}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors text-left"
                            onClick={() => {
                              onSuggestionSelect?.(suggestion)
                              setIsExpanded(false)
                              setShowSuggestions(false)
                            }}
                          >
                            <span>{suggestion.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                          </button>
                        ))}
                      </div>
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-9 pr-9 w-64 lg:w-80"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Desktop Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-lg border bg-card shadow-lg overflow-hidden z-50"
            >
              <div className="p-2 text-xs font-medium text-muted-foreground border-b">
                {value.trim() ? 'Suggestions' : 'Popular Categories'}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.label}-${index}`}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted transition-colors text-left text-sm"
                    onClick={() => {
                      onSuggestionSelect?.(suggestion)
                      setShowSuggestions(false)
                    }}
                  >
                    <span>{suggestion.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
