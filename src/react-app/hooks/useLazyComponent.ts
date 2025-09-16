import { lazy, ComponentType, Suspense, ReactNode, createElement } from 'react'
import { LoadingOverlay } from '@/react-app/components/LoadingOverlay'

interface LazyComponentOptions {
  fallback?: ReactNode
  retryCount?: number
  retryDelay?: number
}

export function useLazyComponent(
  componentImport: () => Promise<{ default: ComponentType<any> }>,
  options: LazyComponentOptions = {}
) {
  const fallback = options.fallback
  const retryCount = options.retryCount || 3
  const retryDelay = options.retryDelay || 1000

  const LazyComponent = lazy(() => {
    let attempts = 0
    
    const loadWithRetry = async (): Promise<{ default: ComponentType<any> }> => {
      try {
        return await componentImport()
      } catch (error) {
        attempts++
        if (attempts < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
          return loadWithRetry()
        }
        throw error
      }
    }

    return loadWithRetry()
  })

  const WrappedComponent = (props: any) => {
    const fallbackElement = fallback || createElement(LoadingOverlay, { isLoading: true, message: "Carregando componente..." })
    
    return createElement(Suspense, { fallback: fallbackElement }, 
      createElement(LazyComponent, props)
    )
  }

  return WrappedComponent
}

// Hook para preload de componentes
export function usePreloadComponent(
  componentImport: () => Promise<{ default: ComponentType<any> }>,
  shouldPreload: boolean = false
) {
  if (shouldPreload && typeof window !== 'undefined') {
    // Preload no próximo tick para não bloquear a renderização atual
    setTimeout(() => {
      componentImport().catch(() => {
        // Falha silenciosa no preload
      })
    }, 100)
  }

  return useLazyComponent(componentImport)
}
