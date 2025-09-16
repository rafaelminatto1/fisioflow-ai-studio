import { useEffect, useCallback, useRef } from 'react'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'
import { useDataCache } from './useDataCache'

interface PrefetchOptions {
  enabled?: boolean
  delay?: number
  priority?: 'low' | 'high'
  prefetchOnHover?: boolean
  prefetchOnVisible?: boolean
}

export function usePrefetch<T>(
  key: string,
  url: string,
  options: PrefetchOptions = {}
) {
  const {
    enabled = true,
    delay = 0,
    priority = 'low',
    prefetchOnHover = false,
    prefetchOnVisible = false
  } = options

  const authFetch = useAuthenticatedFetch()
  const cache = useDataCache<T>(5 * 60 * 1000)
  const prefetchedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const executePrefetch = useCallback(async () => {
    if (!enabled || prefetchedRef.current) return

    try {
      // Check if already in cache
      const cached = cache.get(key)
      if (cached) {
        prefetchedRef.current = true
        return
      }

      const response = await authFetch(url)
      const result = await response.json()
      
      if (result.success) {
        cache.set(key, result.data)
        prefetchedRef.current = true
      }
    } catch (error) {
      console.warn(`Prefetch failed for ${key}:`, error)
    }
  }, [enabled, key, url, authFetch, cache])

  const schedulePrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(executePrefetch, delay)
    } else {
      // Use requestIdleCallback for low priority prefetches
      if (priority === 'low' && 'requestIdleCallback' in window) {
        requestIdleCallback(executePrefetch)
      } else {
        executePrefetch()
      }
    }
  }, [delay, priority, executePrefetch])

  // Auto prefetch
  useEffect(() => {
    if (enabled && !prefetchOnHover && !prefetchOnVisible) {
      schedulePrefetch()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, prefetchOnHover, prefetchOnVisible, schedulePrefetch])

  const prefetchOnHoverProps = prefetchOnHover ? {
    onMouseEnter: schedulePrefetch
  } : {}

  const prefetchOnVisibleProps = prefetchOnVisible ? {
    ref: useCallback((node: Element | null) => {
      if (!node) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            schedulePrefetch()
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )

      observer.observe(node)
      return () => observer.disconnect()
    }, [schedulePrefetch])
  } : {}

  return {
    prefetch: schedulePrefetch,
    isPrefetched: prefetchedRef.current,
    prefetchOnHoverProps,
    prefetchOnVisibleProps
  }
}

// Hook para prefetch de rotas
export function useRoutePrefetch() {
  const prefetchedRoutes = useRef<Set<string>>(new Set())

  const prefetchRoute = useCallback((routePath: string) => {
    if (prefetchedRoutes.current.has(routePath)) return

    // Prefetch the route component
    const routeMap: Record<string, () => Promise<any>> = {
      '/patients': () => import('@/react-app/pages/Patients'),
      '/appointments': () => import('@/react-app/pages/Appointments'),
      '/exercises': () => import('@/react-app/pages/Exercises'),
      '/prescriptions': () => import('@/react-app/pages/Prescriptions'),
      '/finance': () => import('@/react-app/pages/Finance'),
      '/inventory': () => import('@/react-app/pages/Inventory'),
      '/knowledge-base': () => import('@/react-app/pages/KnowledgeBase'),
      '/tasks': () => import('@/react-app/pages/Tasks'),
      '/settings': () => import('@/react-app/pages/Settings')
    }

    const importFn = routeMap[routePath]
    if (importFn) {
      importFn().then(() => {
        prefetchedRoutes.current.add(routePath)
      }).catch(() => {
        // Silent fail for prefetch
      })
    }
  }, [])

  const prefetchOnHover = useCallback((routePath: string) => ({
    onMouseEnter: () => prefetchRoute(routePath)
  }), [prefetchRoute])

  return {
    prefetchRoute,
    prefetchOnHover,
    isPrefetched: (route: string) => prefetchedRoutes.current.has(route)
  }
}
