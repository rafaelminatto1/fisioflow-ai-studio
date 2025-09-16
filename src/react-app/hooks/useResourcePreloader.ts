import { useEffect, useCallback, useRef } from 'react'
import { useAdaptiveBehavior } from './useConnectionAware'

interface PreloadOptions {
  priority?: 'low' | 'high'
  condition?: () => boolean
  delay?: number
}

export function useResourcePreloader() {
  const { behavior } = useAdaptiveBehavior()
  const preloadedResources = useRef<Set<string>>(new Set())

  const preloadImage = useCallback((url: string, options: PreloadOptions = {}) => {
    const { priority = 'low', condition = () => behavior.enablePreloading, delay = 0 } = options

    if (!condition() || preloadedResources.current.has(url)) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const preload = () => {
        const img = new Image()
        img.onload = () => {
          preloadedResources.current.add(url)
          resolve()
        }
        img.onerror = reject
        img.src = url
      }

      if (delay > 0) {
        setTimeout(preload, delay)
      } else if (priority === 'low' && 'requestIdleCallback' in window) {
        requestIdleCallback(preload)
      } else {
        preload()
      }
    })
  }, [behavior.enablePreloading])

  const preloadRoute = useCallback((routePath: string) => {
    if (!behavior.enablePreloading || preloadedResources.current.has(routePath)) {
      return Promise.resolve()
    }

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
    if (!importFn) return Promise.resolve()

    preloadedResources.current.add(routePath)
    return importFn().catch(() => {
      preloadedResources.current.delete(routePath)
    })
  }, [behavior.enablePreloading])

  const preloadData = useCallback(async (url: string, options: PreloadOptions = {}) => {
    const { condition = () => behavior.enablePreloading } = options

    if (!condition() || preloadedResources.current.has(url)) {
      return null
    }

    try {
      const token = localStorage.getItem('fisioflow_token')
      if (!token) return null

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        preloadedResources.current.add(url)
        return data
      }
    } catch (error) {
      console.warn(`Data preload failed for ${url}:`, error)
    }

    return null
  }, [behavior.enablePreloading])

  const clearPreloadCache = useCallback(() => {
    preloadedResources.current.clear()
  }, [])

  const isPreloaded = useCallback((resource: string) => {
    return preloadedResources.current.has(resource)
  }, [])

  return {
    preloadImage,
    preloadRoute,
    preloadData,
    clearPreloadCache,
    isPreloaded
  }
}

// Hook para preload automático baseado em uso comum
export function useIntelligentPreloader() {
  const { preloadRoute, preloadData } = useResourcePreloader()
  const { behavior } = useAdaptiveBehavior()

  useEffect(() => {
    if (!behavior.enablePreloading) return

    const preloadCommonRoutes = async () => {
      // Preload das rotas mais usadas
      const commonRoutes = ['/patients', '/appointments']
      
      for (const route of commonRoutes) {
        await preloadRoute(route)
        // Pequena pausa entre preloads para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const preloadCriticalData = async () => {
      // Preload de dados críticos
      const criticalEndpoints = [
        '/api/appointments/today',
        '/api/patients/recent'
      ]

      for (const endpoint of criticalEndpoints) {
        await preloadData(endpoint)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // Inicia preloads após um delay para não interferir com o carregamento inicial
    setTimeout(() => {
      preloadCommonRoutes()
      preloadCriticalData()
    }, 2000)
  }, [behavior.enablePreloading, preloadRoute, preloadData])
}
