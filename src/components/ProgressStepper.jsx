import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProgressStepper({ currentStep, totalSteps, steps }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step Circles */}
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isFuture = stepNumber > currentStep

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 relative z-10"
            >
              {/* Circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                  {
                    'bg-primary text-primary-foreground': isCompleted || isCurrent,
                    'bg-muted text-muted-foreground': isFuture
                  }
                )}
              >
                {isCompleted ? (
                  <Check size={20} />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap transition-colors',
                  {
                    'text-foreground': isCurrent,
                    'text-muted-foreground': !isCurrent
                  }
                )}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
