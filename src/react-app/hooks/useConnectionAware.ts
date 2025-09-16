import { useState, useEffect, useCallback } from 'react'

type ConnectionQuality = 'fast' | 'slow' | 'offline'

interface ConnectionInfo {
  quality: ConnectionQuality
  effectiveType?: string
  downlink?: number
  rtt?: number
  isOnline: boolean
}

export function useConnectionAware(): ConnectionInfo {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    quality: 'fast',
    isOnline: true
  })

  const updateConnectionInfo = useCallback(() => {
    const navigator = window.navigator as any
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    const isOnline = navigator.onLine

    let quality: ConnectionQuality = 'fast'
    
    if (!isOnline) {
      quality = 'offline'
    } else if (connection) {
      const { effectiveType, downlink, rtt } = connection
      
      // Determinar qualidade baseada nos dados da conexão
      if (effectiveType === '2g' || (downlink && downlink < 0.5) || (rtt && rtt > 2000)) {
        quality = 'slow'
      } else if (effectiveType === '3g' || (downlink && downlink < 1.5) || (rtt && rtt > 1000)) {
        quality = 'slow'
      } else {
        quality = 'fast'
      }
    }

    setConnectionInfo({
      quality,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      isOnline
    })
  }, [])

  useEffect(() => {
    updateConnectionInfo()

    const handleOnline = () => updateConnectionInfo()
    const handleOffline = () => updateConnectionInfo()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listener para mudanças na conexão (quando disponível)
    const navigator = window.navigator as any
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo)
      }
    }
  }, [updateConnectionInfo])

  return connectionInfo
}

// Hook para adaptar comportamento baseado na conexão
export function useAdaptiveBehavior() {
  const connection = useConnectionAware()

  const getOptimalBehavior = useCallback(() => {
    switch (connection.quality) {
      case 'offline':
        return {
          enableBackgroundSync: false,
          cacheTime: 30 * 60 * 1000, // 30 minutos
          staleTime: 15 * 60 * 1000, // 15 minutos
          retryCount: 0,
          enableOptimisticUpdates: true,
          imageQuality: 'low',
          enablePreloading: false
        }
      case 'slow':
        return {
          enableBackgroundSync: false,
          cacheTime: 15 * 60 * 1000, // 15 minutos
          staleTime: 5 * 60 * 1000, // 5 minutos
          retryCount: 1,
          enableOptimisticUpdates: true,
          imageQuality: 'medium',
          enablePreloading: false
        }
      case 'fast':
      default:
        return {
          enableBackgroundSync: true,
          cacheTime: 10 * 60 * 1000, // 10 minutos
          staleTime: 2 * 60 * 1000, // 2 minutos
          retryCount: 3,
          enableOptimisticUpdates: true,
          imageQuality: 'high',
          enablePreloading: true
        }
    }
  }, [connection.quality])

  return {
    connection,
    behavior: getOptimalBehavior()
  }
}
