import { memo } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/react-app/components/ui/card'
import { cn } from '@/lib/utils'

interface TrendData {
  value: number
  label: string
  type: 'up' | 'down'
}

interface StatCardProps {
  title: string
  value: string | number
  trend?: TrendData
  icon: LucideIcon
  delay?: number
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  loading?: boolean
}

const colorVariants = {
  blue: {
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600'
  },
  green: {
    bg: 'bg-gradient-to-r from-green-500 to-green-600',
    text: 'text-green-600',
    lightBg: 'bg-green-50',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600'
  },
  purple: {
    bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600'
  },
  orange: {
    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    text: 'text-orange-600',
    lightBg: 'bg-orange-50',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600'
  },
  red: {
    bg: 'bg-gradient-to-r from-red-500 to-red-600',
    text: 'text-red-600',
    lightBg: 'bg-red-50',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600'
  }
}

const StatCardSkeleton = memo(() => (
  <Card className="shadow-md border-0">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-16 mb-2 animate-pulse"></div>
      <div className="h-3 bg-slate-200 rounded w-20 animate-pulse"></div>
    </CardContent>
  </Card>
))

export const StatCard = memo(({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  delay = 0,
  color = 'blue',
  loading = false
}: StatCardProps) => {
  if (loading) {
    return <StatCardSkeleton />
  }

  const colors = colorVariants[color]
  const TrendIcon = trend?.type === 'up' ? TrendingUp : TrendingDown
  const trendColor = trend?.type === 'up' ? colors.trendUp : colors.trendDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="shadow-md border-0 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white",
              colors.bg
            )}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          
          <div className="space-y-2">
            <motion.h3 
              className="text-2xl font-bold text-slate-900"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.1 }}
            >
              {value}
            </motion.h3>
            
            {trend && (
              <motion.div 
                className="flex items-center space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
              >
                <TrendIcon className={cn("w-3 h-3", trendColor)} />
                <span className={cn("text-xs font-medium", trendColor)}>
                  {trend.value}%
                </span>
                <span className="text-xs text-slate-500">{trend.label}</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

StatCard.displayName = 'StatCard'
