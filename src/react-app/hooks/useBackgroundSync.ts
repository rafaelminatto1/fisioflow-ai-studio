import { useEffect, useCallback, useRef } from 'react'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'

interface BackgroundSyncOptions {
  interval?: number
  enabled?: boolean
  retryCount?: number
}

export function useBackgroundSync(
  endpoints: string[],
  options: BackgroundSyncOptions = {}
) {
  const {
    interval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    retryCount = 3
  } = options

  const authFetch = useAuthenticatedFetch()
  const isOnline = navigator.onLine
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef(false)

  const syncData = useCallback(async () => {
    if (!enabled || !isOnline || isRunningRef.current) return

    isRunningRef.current = true

    try {
      const syncPromises = endpoints.map(async (endpoint) => {
        let attempts = 0
        while (attempts < retryCount) {
          try {
            const response = await authFetch(endpoint)
            const data = await response.json()
            
            // Cache the fresh data
            const cacheKey = `bg_sync_${endpoint}`
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data,
              timestamp: Date.now()
            }))
            
            return { endpoint, success: true, data }
          } catch (error) {
            attempts++
            if (attempts >= retryCount) {
              throw error
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          }
        }
      })

      await Promise.allSettled(syncPromises)
      console.log('Background sync completed successfully')
    } catch (error) {
      console.warn('Background sync failed:', error)
    } finally {
      isRunningRef.current = false
    }
  }, [enabled, isOnline, endpoints, authFetch, retryCount])

  // Setup interval
  useEffect(() => {
    if (!enabled || !isOnline) return

    // Initial sync
    setTimeout(syncData, 2000) // Wait 2s after mount

    // Setup interval
    intervalRef.current = setInterval(syncData, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, isOnline, interval, syncData])

  // Sync when coming online
  useEffect(() => {
    if (isOnline && enabled) {
      setTimeout(syncData, 1000)
    }
  }, [isOnline, enabled, syncData])

  return {
    syncNow: syncData,
    isRunning: isRunningRef.current
  }
}

// Hook for specific data types
export function usePatientDataSync() {
  return useBackgroundSync([
    '/api/patients',
    '/api/appointments/today'
  ], {
    interval: 3 * 60 * 1000, // 3 minutes for patient data
    enabled: true
  })
}

export function useTasksSync() {
  return useBackgroundSync([
    '/api/tasks'
  ], {
    interval: 2 * 60 * 1000, // 2 minutes for tasks
    enabled: true
  })
}
