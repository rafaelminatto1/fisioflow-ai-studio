import { useState, useEffect, useCallback } from 'react'
import { useNotifications } from './useNotifications'

interface QueuedAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  endpoint: string
  data?: any
  timestamp: number
  retries: number
}

const QUEUE_STORAGE_KEY = 'fisioflow_offline_queue'
const MAX_RETRIES = 3

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { success, error } = useNotifications()

  // Load queue from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (stored) {
      try {
        setQueue(JSON.parse(stored))
      } catch (err) {
        console.warn('Failed to parse offline queue:', err)
        localStorage.removeItem(QUEUE_STORAGE_KEY)
      }
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  }, [queue])

  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    }

    setQueue(prev => [...prev, queuedAction])
    return queuedAction.id
  }, [])

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(action => action.id !== id))
  }, [])

  const processQueue = useCallback(async () => {
    if (isProcessing || queue.length === 0 || !navigator.onLine) {
      return
    }

    setIsProcessing(true)

    for (const action of queue) {
      try {
        const token = localStorage.getItem('fisioflow_token')
        if (!token) {
          throw new Error('No authentication token')
        }

        let method = 'GET'
        let body: string | undefined

        switch (action.type) {
          case 'CREATE':
            method = 'POST'
            body = JSON.stringify(action.data)
            break
          case 'UPDATE':
            method = 'PUT'
            body = JSON.stringify(action.data)
            break
          case 'DELETE':
            method = 'DELETE'
            break
        }

        const response = await fetch(action.endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body
        })

        if (response.ok) {
          removeFromQueue(action.id)
          success(`Ação offline processada com sucesso`)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (err) {
        console.warn(`Failed to process queued action ${action.id}:`, err)
        
        // Increment retry count
        setQueue(prev => prev.map(a => 
          a.id === action.id 
            ? { ...a, retries: a.retries + 1 }
            : a
        ))

        // Remove if max retries reached
        if (action.retries >= MAX_RETRIES) {
          removeFromQueue(action.id)
          error(`Falha ao sincronizar ação offline após ${MAX_RETRIES} tentativas`)
        }
      }
    }

    setIsProcessing(false)
  }, [isProcessing, queue, removeFromQueue, success, error])

  // Process queue when coming online
  useEffect(() => {
    const handleOnline = () => {
      if (queue.length > 0) {
        setTimeout(processQueue, 1000) // Small delay to ensure connection is stable
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [queue.length, processQueue])

  // Auto-process queue periodically when online
  useEffect(() => {
    if (!navigator.onLine) return

    const interval = setInterval(() => {
      if (queue.length > 0) {
        processQueue()
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [queue.length, processQueue])

  const queueCreate = useCallback((endpoint: string, data: any) => {
    return addToQueue({ type: 'CREATE', endpoint, data })
  }, [addToQueue])

  const queueUpdate = useCallback((endpoint: string, data: any) => {
    return addToQueue({ type: 'UPDATE', endpoint, data })
  }, [addToQueue])

  const queueDelete = useCallback((endpoint: string) => {
    return addToQueue({ type: 'DELETE', endpoint })
  }, [addToQueue])

  return {
    queue,
    queueSize: queue.length,
    isProcessing,
    queueCreate,
    queueUpdate,
    queueDelete,
    processQueue,
    clearQueue: () => setQueue([])
  }
}

// Hook for offline-aware mutations
export function useOfflineMutation() {
  const { queueCreate, queueUpdate, queueDelete } = useOfflineQueue()

  const mutateOffline = useCallback(async (
    endpoint: string,
    data: any,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST'
  ) => {
    if (navigator.onLine) {
      // If online, try normal request first
      try {
        const token = localStorage.getItem('fisioflow_token')
        if (!token) throw new Error('No authentication token')

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: method !== 'DELETE' ? JSON.stringify(data) : undefined
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      } catch (err) {
        // If online request fails, queue it
        switch (method) {
          case 'POST':
            queueCreate(endpoint, data)
            break
          case 'PUT':
            queueUpdate(endpoint, data)
            break
          case 'DELETE':
            queueDelete(endpoint)
            break
        }
        throw err
      }
    } else {
      // If offline, queue immediately
      switch (method) {
        case 'POST':
          queueCreate(endpoint, data)
          break
        case 'PUT':
          queueUpdate(endpoint, data)
          break
        case 'DELETE':
          queueDelete(endpoint)
          break
      }
      return { success: true, data, queued: true }
    }
  }, [queueCreate, queueUpdate, queueDelete])

  return { mutateOffline }
}
