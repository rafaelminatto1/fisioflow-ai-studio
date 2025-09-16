import { useState, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface UseCacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
}

export function useDataCache<T>(defaultTtl: number = 5 * 60 * 1000) {
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.expiresAt) {
      cache.current.delete(key)
      return null
    }

    return entry.data
  }, [])

  const set = useCallback((key: string, data: T, cacheTtl: number = defaultTtl) => {
    const now = Date.now()
    cache.current.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheTtl
    })
  }, [defaultTtl])

  const fetchWithCache = useCallback(async (
    key: string,
    fetcher: () => Promise<T>,
    options: UseCacheOptions = {}
  ): Promise<T> => {
    const { ttl: optionsTtl = defaultTtl, staleWhileRevalidate = false } = options

    // Check if we're already fetching this key
    if (loading.has(key)) {
      // Wait for ongoing request
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!loading.has(key)) {
            clearInterval(checkInterval)
            const cached = get(key)
            if (cached) resolve(cached)
          }
        }, 10)
      })
    }

    // Try to get from cache first
    const cached = get(key)
    if (cached && !staleWhileRevalidate) {
      return cached
    }

    // Mark as loading
    setLoading(prev => new Set(prev).add(key))

    try {
      const data = await fetcher()
      set(key, data, optionsTtl)
      
      // Remove from loading set
      setLoading(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })

      return data
    } catch (error) {
      // Remove from loading set on error
      setLoading(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      
      // If we have stale data, return it
      if (cached && staleWhileRevalidate) {
        return cached
      }
      
      throw error
    }
  }, [defaultTtl, get, set, loading])

  const invalidate = useCallback((key: string) => {
    cache.current.delete(key)
  }, [])

  const invalidatePattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []
    
    cache.current.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => cache.current.delete(key))
  }, [])

  const clear = useCallback(() => {
    cache.current.clear()
  }, [])

  const isLoading = useCallback((key: string) => {
    return loading.has(key)
  }, [loading])

  return {
    get,
    set,
    fetchWithCache,
    invalidate,
    invalidatePattern,
    clear,
    isLoading
  }
}
