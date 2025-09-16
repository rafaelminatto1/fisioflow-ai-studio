import { motion } from 'framer-motion'

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-slate-200 rounded-lg w-80 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-60"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-slate-200 rounded"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-20"></div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="h-12 bg-slate-200 rounded-lg flex-1"></div>
        <div className="flex gap-2">
          <div className="h-12 bg-slate-200 rounded-lg w-32"></div>
          <div className="h-12 bg-slate-200 rounded-lg w-32"></div>
          <div className="h-12 bg-slate-200 rounded-lg w-24"></div>
        </div>
      </div>

      {/* Content Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-white rounded-xl border p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-48"></div>
                  <div className="h-4 bg-slate-200 rounded w-64"></div>
                  <div className="h-3 bg-slate-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
