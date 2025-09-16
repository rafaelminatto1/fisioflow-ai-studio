import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePerformanceOptimizations } from '@/react-app/hooks/usePerformanceOptimizations'
import { useIntelligentPreloader } from '@/react-app/hooks/useResourcePreloader'
import { useConnectionAware } from '@/react-app/hooks/useConnectionAware'

interface PerformanceContextType {
  isOptimized: boolean
  connectionQuality: 'fast' | 'slow' | 'offline'
  enableAnimations: boolean
  enableHeavyFeatures: boolean
  imageQuality: 'low' | 'medium' | 'high'
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

interface PerformanceProviderProps {
  children: React.ReactNode
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const connection = useConnectionAware()
  const { getOptimalImageQuality } = usePerformanceOptimizations()
  const [isOptimized, setIsOptimized] = useState(false)
  
  // Initialize intelligent preloader
  useIntelligentPreloader()

  useEffect(() => {
    // Mark as optimized after initial setup
    const timer = setTimeout(() => setIsOptimized(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const contextValue: PerformanceContextType = {
    isOptimized,
    connectionQuality: connection.quality,
    enableAnimations: connection.quality !== 'slow' && connection.quality !== 'offline',
    enableHeavyFeatures: connection.quality === 'fast',
    imageQuality: getOptimalImageQuality()
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext)
  if (context === undefined) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider')
  }
  return context
}

// HOC para componentes que precisam de otimização
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>
) {
  return function OptimizedComponent(props: P) {
    const { enableHeavyFeatures, enableAnimations } = usePerformanceContext()
    
    if (!enableHeavyFeatures) {
      // Versão simplificada para conexões lentas
      return <Component {...props} />
    }

    return (
      <div style={{ 
        willChange: enableAnimations ? 'transform' : 'auto'
      }}>
        <Component {...props} />
      </div>
    )
  }
}
