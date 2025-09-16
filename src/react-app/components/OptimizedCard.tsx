import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from './ui/card'

interface OptimizedCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  loading?: boolean
  delay?: number
  onClick?: () => void
}

// Card otimizado que só re-renderiza quando necessário
export const OptimizedCard = memo(({ 
  children, 
  className = '', 
  hover = true,
  loading = false,
  delay = 0,
  onClick 
}: OptimizedCardProps) => {
  if (loading) {
    return (
      <Card className={`shadow-md border-0 ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const MotionCard = motion(Card)

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={hover ? { y: -2 } : undefined}
      className={`shadow-md border-0 hover:shadow-lg transition-all duration-300 ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </MotionCard>
  )
})

OptimizedCard.displayName = 'OptimizedCard'
