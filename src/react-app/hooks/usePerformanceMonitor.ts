import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  renderTime: number
  componentCount: number
  memoryUsage?: number
  networkRequests: number
}

interface PerformanceMonitorOptions {
  enabled?: boolean
  sampleRate?: number // Percentage of measurements to keep (0-100)
  logToConsole?: boolean
  onMetrics?: (metrics: PerformanceMetrics) => void
}

export function usePerformanceMonitor(
  componentName: string,
  options: PerformanceMonitorOptions = {}
) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    sampleRate = 10,
    logToConsole = false,
    onMetrics
  } = options

  const renderStartTime = useRef<number | undefined>(undefined)
  const renderCount = useRef(0)
  const networkRequestCount = useRef(0)

  // Monitor network requests
  useEffect(() => {
    if (!enabled) return

    const originalFetch = window.fetch
    window.fetch = (...args) => {
      networkRequestCount.current++
      return originalFetch(...args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [enabled])

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    if (!enabled || Math.random() * 100 > sampleRate) return

    renderStartTime.current = performance.now()
  }, [enabled, sampleRate])

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (!enabled || !renderStartTime.current) return

    const renderTime = performance.now() - renderStartTime.current
    renderCount.current++

    const metrics: PerformanceMetrics = {
      renderTime,
      componentCount: renderCount.current,
      networkRequests: networkRequestCount.current
    }

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.memoryUsage = memory.usedJSHeapSize
    }

    if (logToConsole) {
      console.log(`Performance [${componentName}]:`, metrics)
    }

    onMetrics?.(metrics)

    renderStartTime.current = 0
  }, [enabled, componentName, logToConsole, onMetrics])

  // Measure component lifecycle
  useEffect(() => {
    startMeasurement()
    return () => {
      endMeasurement()
    }
  }, [startMeasurement, endMeasurement])

  return {
    startMeasurement,
    endMeasurement,
    getRenderCount: () => renderCount.current,
    getNetworkRequestCount: () => networkRequestCount.current
  }
}

// Hook for measuring specific operations
export function useOperationTimer() {
  const timers = useRef<Map<string, number>>(new Map())

  const start = useCallback((operationName: string) => {
    timers.current.set(operationName, performance.now())
  }, [])

  const end = useCallback((operationName: string) => {
    const startTime = timers.current.get(operationName)
    if (!startTime) return null

    const duration = performance.now() - startTime
    timers.current.delete(operationName)
    
    return duration
  }, [])

  const measure = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> => {
    start(operationName)
    try {
      const result = await operation()
      const duration = end(operationName) || 0
      return { result, duration }
    } catch (error) {
      end(operationName)
      throw error
    }
  }, [start, end])

  return { start, end, measure }
}

// Hook for Web Vitals monitoring
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          console.log('First Contentful Paint:', entry.startTime)
        }
      }
    })

    observer.observe({ entryTypes: ['paint'] })

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('Largest Contentful Paint:', lastEntry.startTime)
    })

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // Cumulative Layout Shift
    let clsScore = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value
        }
      }
      console.log('Cumulative Layout Shift:', clsScore)
    })

    clsObserver.observe({ entryTypes: ['layout-shift'] })

    return () => {
      observer.disconnect()
      lcpObserver.disconnect()
      clsObserver.disconnect()
    }
  }, [])
}
