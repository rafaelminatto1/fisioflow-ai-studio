import { useEffect, useCallback, useRef } from 'react'
import { useConnectionAware } from './useConnectionAware'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  networkLatency: number
  cacheHitRate: number
}

export function usePerformanceOptimizations() {
  const connection = useConnectionAware()
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRate: 0
  })

  // Debounce para operações custosas
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }
  }, [])

  // Throttle para eventos de scroll/resize
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }, [])

  // Otimização de imagens baseada na conexão
  const getOptimalImageQuality = useCallback(() => {
    switch (connection.quality) {
      case 'offline':
        return 'low'
      case 'slow':
        return 'medium'
      case 'fast':
      default:
        return 'high'
    }
  }, [connection.quality])

  // Configuração de chunk size para uploads
  const getOptimalChunkSize = useCallback(() => {
    switch (connection.quality) {
      case 'slow':
        return 64 * 1024 // 64KB
      case 'fast':
        return 1024 * 1024 // 1MB
      default:
        return 256 * 1024 // 256KB
    }
  }, [connection.quality])

  // Memory cleanup
  const performMemoryCleanup = useCallback(() => {
    // Clear old cache entries
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('fisioflow_cache_') && 
      Date.now() - parseInt(key.split('_').pop() || '0') > 24 * 60 * 60 * 1000 // 24h
    )
    
    cacheKeys.forEach(key => localStorage.removeItem(key))

    // Force garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc()
    }
  }, [])

  // Performance monitoring
  const measureRenderTime = useCallback((componentName: string) => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      const renderTime = end - start
      metricsRef.current.renderTime = renderTime
      
      if (renderTime > 16) { // Mais que 1 frame (60fps)
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [])

  // Resource hints para navegadores
  const addResourceHints = useCallback((urls: string[], type: 'preload' | 'prefetch' = 'prefetch') => {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = type
      link.href = url
      if (type === 'preload') {
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    })
  }, [])

  // Lazy loading com intersection observer
  const createLazyLoader = useCallback((
    callback: () => void,
    options: IntersectionObserverInit = {}
  ) => {
    return (element: Element | null) => {
      if (!element) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              callback()
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1, ...options }
      )

      observer.observe(element)
      return () => observer.disconnect()
    }
  }, [])

  // Auto cleanup em intervalo
  useEffect(() => {
    const cleanupInterval = setInterval(performMemoryCleanup, 30 * 60 * 1000) // 30min
    return () => clearInterval(cleanupInterval)
  }, [performMemoryCleanup])

  // Monitoring de performance da página
  useEffect(() => {
    const measurePagePerformance = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        metricsRef.current.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
      }

      // Measure navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metricsRef.current.networkLatency = navigation.responseEnd - navigation.requestStart
      }
    }

    measurePagePerformance()
    const interval = setInterval(measurePagePerformance, 10000) // 10s
    return () => clearInterval(interval)
  }, [])

  const getPerformanceMetrics = useCallback(() => {
    return { ...metricsRef.current }
  }, [])

  return {
    debounce,
    throttle,
    getOptimalImageQuality,
    getOptimalChunkSize,
    performMemoryCleanup,
    measureRenderTime,
    addResourceHints,
    createLazyLoader,
    getPerformanceMetrics
  }
}

// Hook específico para componentes pesados
export function useHeavyComponentOptimization(componentName: string) {
  const { measureRenderTime, debounce } = usePerformanceOptimizations()
  const renderMeasure = useRef<(() => void) | null>(null)

  useEffect(() => {
    renderMeasure.current = measureRenderTime(componentName)
    return () => {
      renderMeasure.current?.()
    }
  })

  const debouncedUpdate = useCallback(
    debounce((callback: () => void) => callback(), 300),
    [debounce]
  )

  return { debouncedUpdate }
}
