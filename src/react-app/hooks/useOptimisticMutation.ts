import { useState, useCallback } from 'react'
import { useNotifications } from './useNotifications'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'

interface OptimisticMutationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onOptimisticUpdate?: (data: T) => void
  onOptimisticRevert?: () => void
  successMessage?: string
  errorMessage?: string
}

export function useOptimisticMutation<T = any, K = any>(
  options: OptimisticMutationOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const authFetch = useAuthenticatedFetch()
  const notifications = useNotifications()

  const mutate = useCallback(async (
    url: string,
    data: K
  ): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    // Aplicar update otimista imediatamente
    if (options.onOptimisticUpdate) {
      options.onOptimisticUpdate(data as unknown as T)
    }

    try {
      const response = await authFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Falha na requisição')
      }

      // Update real com dados do servidor
      if (options.onSuccess) {
        options.onSuccess(result.data)
      }

      if (options.successMessage) {
        notifications.success(options.successMessage)
      }

      return result.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)

      // Reverter update otimista em caso de erro
      if (options.onOptimisticRevert) {
        options.onOptimisticRevert()
      }

      if (options.onError) {
        options.onError(error)
      }

      if (options.errorMessage) {
        notifications.error(options.errorMessage)
      } else {
        notifications.error(error.message)
      }

      return null
    } finally {
      setIsLoading(false)
    }
  }, [authFetch, notifications, options])

  const mutateUpdate = useCallback(async (
    url: string,
    data: K
  ): Promise<T | null> => {
    const response = await authFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha na requisição')
    }

    if (options.onSuccess) {
      options.onSuccess(result.data)
    }

    if (options.successMessage) {
      notifications.success(options.successMessage)
    }

    return result.data
  }, [authFetch, notifications, options])

  const mutateDelete = useCallback(async (
    url: string
  ): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authFetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao excluir')
      }

      if (options.onSuccess) {
        options.onSuccess({} as T)
      }

      if (options.successMessage) {
        notifications.success(options.successMessage)
      }

      return {} as T
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)

      if (options.onError) {
        options.onError(error)
      }

      if (options.errorMessage) {
        notifications.error(options.errorMessage)
      } else {
        notifications.error(error.message)
      }

      return null
    } finally {
      setIsLoading(false)
    }
  }, [authFetch, notifications, options])

  return {
    mutate,
    mutateUpdate,
    mutateDelete,
    isLoading,
    error,
  }
}
