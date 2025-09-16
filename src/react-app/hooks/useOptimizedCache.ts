import { useState, useEffect, useCallback, useRef } from 'react'
import { useDataCache } from './useDataCache'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'

interface OptimizedCacheOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number // Tempo em que os dados são considerados 'frescos'
  cacheTime?: number // Tempo total que os dados permanecem no cache
  retryCount?: number
  retryDelay?: number
  optimisticUpdates?: boolean
}

interface OptimizedCacheResult<T> {
  data: T | null
  loading: boolean
  isRevalidating: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
  updateOptimistic: (updateFn: (prev: T | null) => T) => void
  updateCache: (newData: T) => void
  removeFromCache: (filterFn: (item: any) => boolean) => void
}

export function useOptimizedCache<T>(
  key: string,
  url: string,
  options: OptimizedCacheOptions = {}
): OptimizedCacheResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutos
    cacheTime = 10 * 60 * 1000, // 10 minutos
    retryCount = 3,
    retryDelay = 1000,
    optimisticUpdates = true
  } = options

  const authenticatedFetch = useAuthenticatedFetch()
  const cache = useDataCache<T>(cacheTime)
  const [data, setData] = useState<T | null>(() => cache.get(key))
  const [loading, setLoading] = useState<boolean>(!data) // Loading se não tem cache
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Track when data was last fetched
  const lastFetchTime = useRef<number>(0)
  const revalidationPromiseRef = useRef<Promise<T> | null>(null)

  const fetcher = useCallback(async (): Promise<T> => {
    const response = await authenticatedFetch(url)
    const result = await response.json()
    if (result.success) return result.data
    throw new Error(result.error || 'Falha na requisição')
  }, [authenticatedFetch, url])

  const executeFetch = useCallback(async (): Promise<T> => {
    let currentRetries = 0
    while (currentRetries <= retryCount) {
      try {
        const freshData = await fetcher()
        cache.set(key, freshData, cacheTime)
        lastFetchTime.current = Date.now()
        return freshData
      } catch (err) {
        if (currentRetries < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, currentRetries)))
          currentRetries++
        } else {
          throw err
        }
      }
    }
    throw new Error('All fetch retries failed')
  }, [key, fetcher, cache, cacheTime, retryCount, retryDelay])

  const isDataStale = useCallback(() => {
    return Date.now() - lastFetchTime.current > staleTime
  }, [staleTime])

  const fetchWithStaleRevalidate = useCallback(async () => {
    if (!enabled) return

    const cachedData = cache.get(key)
    const dataIsStale = isDataStale()

    if (cachedData && !dataIsStale) {
      // Dados frescos em cache
      setData(cachedData)
      setLoading(false)
      setIsRevalidating(false)
      return
    }

    if (cachedData && dataIsStale) {
      // Dados stale em cache - exibe imediatamente e revalida em background
      setData(cachedData)
      setLoading(false)

      if (!isRevalidating && !revalidationPromiseRef.current) {
        setIsRevalidating(true)
        setError(null)
        revalidationPromiseRef.current = executeFetch()
        revalidationPromiseRef.current
          .then(freshData => {
            setData(freshData)
          })
          .catch(err => {
            console.error(`Background revalidation failed for key ${key}:`, err)
            setError(err instanceof Error ? err : new Error('Erro na revalidação'))
          })
          .finally(() => {
            setIsRevalidating(false)
            revalidationPromiseRef.current = null
          })
      }
      return
    }

    // Sem dados em cache - busca inicial
    setLoading(true)
    setError(null)
    setIsRevalidating(false)

    try {
      const freshData = await executeFetch()
      setData(freshData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro na busca inicial'))
    } finally {
      setLoading(false)
    }
  }, [enabled, key, isDataStale, isRevalidating, executeFetch, cache])

  // Efeito para busca inicial
  useEffect(() => {
    if (enabled) {
      fetchWithStaleRevalidate()
    }
  }, [enabled, key, fetchWithStaleRevalidate])

  // Refetch manual
  const refetch = useCallback(async () => {
    cache.invalidate(key)
    lastFetchTime.current = 0
    setLoading(true)
    setError(null)
    setIsRevalidating(false)
    revalidationPromiseRef.current = null

    try {
      const freshData = await executeFetch()
      setData(freshData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar dados'))
    } finally {
      setLoading(false)
    }
  }, [cache, key, executeFetch])

  // Invalidar cache
  const invalidate = useCallback(() => {
    cache.invalidate(key)
    setData(null)
    lastFetchTime.current = 0
    setLoading(true)
    setIsRevalidating(false)
    revalidationPromiseRef.current = null
  }, [cache, key])

  // Update otimista
  const updateOptimistic = useCallback((updateFn: (prev: T | null) => T) => {
    if (!optimisticUpdates) return
    
    setData(prev => {
      const newData = updateFn(prev)
      cache.set(key, newData, cacheTime)
      return newData
    })
  }, [optimisticUpdates, cache, key, cacheTime])

  // Update direto no cache
  const updateCache = useCallback((newData: T) => {
    setData(newData)
    cache.set(key, newData, cacheTime)
    lastFetchTime.current = Date.now() // Mark as fresh
  }, [cache, key, cacheTime])

  // Remover itens do cache baseado em filtro
  const removeFromCache = useCallback((filterFn: (item: any) => boolean) => {
    setData(prev => {
      if (!prev) return prev
      
      let newData: T
      if (Array.isArray(prev)) {
        newData = (prev as any[]).filter(filterFn) as unknown as T
      } else {
        // Para objetos, assumimos que queremos manter apenas se o filtro retornar true
        newData = filterFn(prev) ? prev : null as T
      }
      
      if (newData) {
        cache.set(key, newData, cacheTime)
      } else {
        cache.invalidate(key)
      }
      
      return newData
    })
  }, [cache, key, cacheTime])

  // Refetch ao focar na janela
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (!document.hidden && enabled && isDataStale()) {
        fetchWithStaleRevalidate()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, enabled, isDataStale, fetchWithStaleRevalidate])

  return {
    data,
    loading,
    isRevalidating,
    error,
    refetch,
    invalidate,
    updateOptimistic,
    updateCache,
    removeFromCache
  }
}
