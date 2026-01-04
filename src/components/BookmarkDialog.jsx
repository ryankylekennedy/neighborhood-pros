import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Bookmark, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useRecommendations } from '@/hooks/useRecommendations'
import { toast } from '@/hooks/useToast'

export function BookmarkDialog({
  open,
  onOpenChange,
  business,
  hasRecommended = false
}) {
  const { user } = useAuth()
  const { addRecommendation, loading: recLoading } = useRecommendations()
  const [recommendNote, setRecommendNote] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setRecommendNote('')
      setShowSuccess(false)
    }
  }, [open])

  const handleAddRecommendation = async () => {
    if (!business?.id) return

    const { error } = await addRecommendation(business.id, recommendNote)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } else {
      setShowSuccess(true)
      toast({
        title: "Thanks for your recommendation!",
        description: "Your neighbors will appreciate it.",
        variant: "success"
      })

      // Auto-close after showing success
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  if (!business) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
            <Bookmark className="w-6 h-6 text-primary fill-primary" />
          </div>
          <DialogTitle className="text-center">
            Business Bookmarked!
          </DialogTitle>
          <DialogDescription className="text-center">
            {business.name} has been added to your favorites.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-6 flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-center font-medium">Recommendation added!</p>
            </motion.div>
          ) : hasRecommended ? (
            <motion.div
              key="already-recommended"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 text-center"
            >
              <p className="text-muted-foreground">
                You've already recommended this business.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-primary" />
                  <h4 className="font-medium">Want to recommend them?</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Help your neighbors by sharing why you recommend this business (optional).
                </p>
                <Input
                  placeholder="They did great work on my kitchen renovation..."
                  value={recommendNote}
                  onChange={(e) => setRecommendNote(e.target.value)}
                  disabled={recLoading}
                  className="mb-4"
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={recLoading}
                  className="w-full sm:w-auto"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleAddRecommendation}
                  disabled={recLoading || !user}
                  className="w-full sm:w-auto gap-2"
                >
                  <Heart size={16} />
                  {recLoading ? 'Adding...' : 'Add Recommendation'}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
