import { useCallback } from 'react'
import { useAuth } from '@/react-app/contexts/AuthContext'

interface UseAuthenticatedFetchOptions {
  headers?: Record<string, string>
}

export function useAuthenticatedFetch() {
  const { token, logout } = useAuth()

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: RequestInit & UseAuthenticatedFetchOptions = {}
  ) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle authentication errors
    if (response.status === 401) {
      // Token might be expired or invalid, logout user
      logout()
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    return response
  }, [token, logout])

  return authenticatedFetch
}
