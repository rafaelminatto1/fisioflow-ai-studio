import { useEffect, useRef, useCallback } from 'react'
import { useAdaptiveBehavior } from './useConnectionAware'

interface SmartRefreshOptions {
  key: string
  refreshFn: () => Promise<void> | void
  dependencies?: any[]
  enabled?: boolean
  maxAge?: number // Maximum age in ms before forcing refresh
  refreshOnFocus?: boolean
  refreshOnReconnect?: boolean
  refreshOnVisibilityChange?: boolean
}

export function useSmartRefresh({
  key,
  refreshFn,
  dependencies = [],
  enabled = true,
  maxAge = 5 * 60 * 1000, // 5 minutes
  refreshOnFocus = true,
  refreshOnReconnect = true,
  refreshOnVisibilityChange = true
}: SmartRefreshOptions) {
  const lastRefreshTime = useRef<Record<string, number>>({})
  const isRefreshing = useRef(false)
  const { connection, behavior } = useAdaptiveBehavior()

  const shouldRefresh = useCallback(() => {
    if (!enabled || isRefreshing.current) return false

    const lastRefresh = lastRefreshTime.current[key] || 0
    const now = Date.now()
    const age = now - lastRefresh

    // Force refresh if data is too old
    if (age > maxAge) return true

    // For slow connections, be more conservative
    if (connection.quality === 'slow' && age < behavior.staleTime) {
      return false
    }

    return true
  }, [enabled, key, maxAge, connection.quality, behavior.staleTime])

  const performRefresh = useCallback(async () => {
    if (!shouldRefresh()) return

    isRefreshing.current = true
    try {
      await refreshFn()
      lastRefreshTime.current[key] = Date.now()
    } catch (error) {
      console.warn(`Smart refresh failed for key ${key}:`, error)
    } finally {
      isRefreshing.current = false
    }
  }, [shouldRefresh, refreshFn, key])

  // Refresh on dependencies change
  useEffect(() => {
    if (enabled) {
      performRefresh()
    }
  }, [enabled, ...dependencies])

  // Refresh on window focus
  useEffect(() => {
    if (!refreshOnFocus) return

    const handleFocus = () => {
      if (shouldRefresh()) {
        performRefresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshOnFocus, shouldRefresh, performRefresh])

  // Refresh on network reconnection
  useEffect(() => {
    if (!refreshOnReconnect) return

    const handleOnline = () => {
      if (shouldRefresh()) {
        performRefresh()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refreshOnReconnect, shouldRefresh, performRefresh])

  // Refresh on visibility change
  useEffect(() => {
    if (!refreshOnVisibilityChange) return

    const handleVisibilityChange = () => {
      if (!document.hidden && shouldRefresh()) {
        performRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshOnVisibilityChange, shouldRefresh, performRefresh])

  const forceRefresh = useCallback(async () => {
    // Reset last refresh time to force refresh
    lastRefreshTime.current[key] = 0
    await performRefresh()
  }, [performRefresh, key])

  const getLastRefreshTime = useCallback(() => {
    return lastRefreshTime.current[key] || null
  }, [key])

  return {
    forceRefresh,
    getLastRefreshTime,
    isRefreshing: isRefreshing.current
  }
}

// Hook específico para páginas
export function usePageRefresh(pageName: string, refreshFn: () => Promise<void> | void) {
  return useSmartRefresh({
    key: `page-${pageName}`,
    refreshFn,
    refreshOnFocus: true,
    refreshOnReconnect: true,
    refreshOnVisibilityChange: true,
    maxAge: 2 * 60 * 1000 // 2 minutes for pages
  })
}
