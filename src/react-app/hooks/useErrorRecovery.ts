import { useState, useCallback, useRef } from 'react'

interface ErrorRecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error, retryCount: number) => void
  onMaxRetriesReached?: (error: Error) => void
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onMaxRetriesReached
  } = options

  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    try {
      const result = await operation()
      
      // Reset retry count on success
      if (retryCount > 0) {
        setRetryCount(0)
        console.log('Operação recuperada com sucesso')
      }
      
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      
      onError?.(err, retryCount)

      if (retryCount < maxRetries) {
        setIsRetrying(true)
        setRetryCount(prev => prev + 1)

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, retryCount)
        
        console.warn(`${context || 'Operação'} falhou. Tentando novamente em ${delay / 1000}s... (${retryCount + 1}/${maxRetries})`)

        return new Promise((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(async () => {
            setIsRetrying(false)
            try {
              const result = await executeWithRetry(operation, context)
              resolve(result)
            } catch (retryError) {
              reject(retryError)
            }
          }, delay)
        })
      } else {
        setRetryCount(0)
        setIsRetrying(false)
        onMaxRetriesReached?.(err)
        console.error(`${context || 'Operação'} falhou após ${maxRetries} tentativas`)
        throw err
      }
    }
  }, [retryCount, maxRetries, retryDelay, onError, onMaxRetriesReached])

  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      setIsRetrying(false)
      setRetryCount(0)
    }
  }, [])

  const reset = useCallback(() => {
    cancelRetry()
    setRetryCount(0)
  }, [cancelRetry])

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    cancelRetry,
    reset
  }
}

// Hook especializado para operações de rede
export function useNetworkErrorRecovery() {
  return useErrorRecovery({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error, retryCount) => {
      console.warn(`Network operation failed (attempt ${retryCount + 1}):`, error)
    }
  })
}

// Hook para operações críticas que não podem falhar
export function useCriticalErrorRecovery() {
  return useErrorRecovery({
    maxRetries: 5,
    retryDelay: 500,
    onMaxRetriesReached: (error) => {
      // Log critical failures
      console.error('Critical operation failed after all retries:', error)
    }
  })
}
