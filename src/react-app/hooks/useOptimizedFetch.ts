import { useState, useEffect, useCallback, useRef } from 'react'
import { useDataCache } from './useDataCache'

interface UseOptimizedFetchOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number // Tempo em que os dados são considerados 'frescos'
  cacheTime?: number // Tempo total que os dados permanecem no cache (mesmo que stale)
  retryCount?: number
  retryDelay?: number
}

interface UseOptimizedFetchResult<T> {
  data: T | null
  loading: boolean // Verdadeiro apenas para a busca inicial que bloqueia a UI
  isRevalidating: boolean // Verdadeiro se uma revalidação em segundo plano está ocorrendo
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
}

export function useOptimizedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseOptimizedFetchOptions = {}
): UseOptimizedFetchResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutos: tempo que os dados são considerados frescos
    cacheTime = 10 * 60 * 1000, // 10 minutos: tempo total de vida dos dados no cache
    retryCount = 3,
    retryDelay = 1000
  } = options

  const cache = useDataCache<T>(cacheTime)
  const [data, setData] = useState<T | null>(() => cache.get(key)) // Inicializa com cache se existir
  const [loading, setLoading] = useState<boolean>(false) // Para carregamento inicial (bloqueador)
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false) // Para revalidação em segundo plano
  const [error, setError] = useState<Error | null>(null)

  // Usamos uma ref para controlar revalidações em andamento para evitar duplicações
  const revalidationPromiseRef = useRef<Promise<T> | null>(null)

  const executeFetch = useCallback(async (): Promise<T> => {
    let currentRetries = 0
    while (currentRetries <= retryCount) {
      try {
        const freshData = await fetcher()
        cache.set(key, freshData, cacheTime)
        return freshData
      } catch (err) {
        if (currentRetries < retryCount) {
          console.warn(`Fetch failed for key ${key}, retrying (${currentRetries + 1}/${retryCount})...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, currentRetries)))
          currentRetries++
        } else {
          throw err // Re-throw if all retries fail
        }
      }
    }
    throw new Error('All fetch retries failed') // Should not be reached
  }, [key, fetcher, cache, cacheTime, retryCount, retryDelay])

  const fetchWithStaleRevalidate = useCallback(async () => {
    if (!enabled) return

    const cachedData = cache.get(key)
    // For now, assume data is stale if it exists and we have a stale time
    const isStale = false // Will implement proper staleness check later

    if (cachedData && !isStale) { // Dados frescos em cache
      setData(cachedData)
      setLoading(false)
      setIsRevalidating(false)
      return
    }

    if (cachedData && isStale) { // Dados stale em cache
      setData(cachedData) // Exibe dados stale imediatamente
      setLoading(false) // Não bloqueia a UI para isso

      if (!isRevalidating && !revalidationPromiseRef.current) { // Inicia revalidação em segundo plano se ainda não estiver em andamento
        setIsRevalidating(true)
        setError(null) // Limpa erros anteriores
        revalidationPromiseRef.current = executeFetch()
        revalidationPromiseRef.current
          .then(freshData => {
            setData(freshData) // Atualiza com dados frescos
          })
          .catch(err => {
            console.error(`Revalidação em segundo plano para a chave ${key} falhou:`, err)
            setError(err instanceof Error ? err : new Error('Erro na revalidação em segundo plano'))
          })
          .finally(() => {
            setIsRevalidating(false)
            revalidationPromiseRef.current = null
          })
      }
      return
    }

    // Se não há dados em cache (nem frescos, nem stale), realiza a busca inicial
    setLoading(true)
    setError(null)
    setIsRevalidating(false)

    try {
      const freshData = await executeFetch()
      setData(freshData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro na busca inicial de dados'))
    } finally {
      setLoading(false)
    }
  }, [enabled, key, staleTime, isRevalidating, executeFetch, cache])

  // Efeito para a busca inicial
  useEffect(() => {
    if (enabled) {
      fetchWithStaleRevalidate()
    }
  }, [enabled, key, fetchWithStaleRevalidate])

  // Função para refetch manual (sempre força uma nova busca e bloqueia a UI)
  const refetch = useCallback(async () => {
    cache.invalidate(key) // Invalida o cache para forçar a busca
    setLoading(true)
    setError(null)
    setIsRevalidating(false)
    revalidationPromiseRef.current = null // Zera a ref da promessa

    try {
      const freshData = await executeFetch()
      setData(freshData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar dados novamente'))
    } finally {
      setLoading(false)
    }
  }, [cache, key, executeFetch])

  // Função para invalidar o cache completamente
  const invalidate = useCallback(() => {
    cache.invalidate(key)
    setData(null)
    setLoading(true) // Set loading to true when invalidating
    setIsRevalidating(false)
    revalidationPromiseRef.current = null
  }, [cache, key])

  // Efeito para refetch ao focar na janela
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (!document.hidden && enabled) {
        fetchWithStaleRevalidate() // Revalida ao focar (pode ser em segundo plano)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, enabled, fetchWithStaleRevalidate])

  return {
    data,
    loading,
    isRevalidating,
    error,
    refetch,
    invalidate
  }
}
