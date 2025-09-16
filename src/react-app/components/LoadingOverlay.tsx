import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  transparent?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Carregando...', 
  transparent = false,
  size = 'md'
}: LoadingOverlayProps) {
  const sizeConfig = {
    sm: { icon: 'w-4 h-4', text: 'text-sm' },
    md: { icon: 'w-6 h-6', text: 'text-base' },
    lg: { icon: 'w-8 h-8', text: 'text-lg' }
  }

  const config = sizeConfig[size]

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute inset-0 z-50 flex items-center justify-center ${
            transparent 
              ? 'bg-white/50 backdrop-blur-sm' 
              : 'bg-white/80 backdrop-blur-md'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className={`${config.icon} animate-spin text-blue-600`} />
            <p className={`${config.text} text-slate-600 font-medium`}>
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Loading inline mais discreto
export function InlineLoading({ 
  message = 'Carregando...', 
  size = 'sm' 
}: { 
  message?: string
  size?: 'sm' | 'md' 
}) {
  const sizeConfig = {
    sm: { icon: 'w-4 h-4', text: 'text-sm' },
    md: { icon: 'w-5 h-5', text: 'text-base' }
  }

  const config = sizeConfig[size]

  return (
    <div className="flex items-center space-x-2 text-slate-600">
      <Loader2 className={`${config.icon} animate-spin`} />
      <span className={`${config.text}`}>{message}</span>
    </div>
  )
}

// Loading para botões
export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  
  return (
    <Loader2 className={`${iconSize} animate-spin`} />
  )
}
