import { toast } from 'react-hot-toast'

interface NotificationOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

export function useNotifications() {
  const success = (message: string, options?: NotificationOptions) => {
    return toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position,
      icon: '✅',
    })
  }

  const error = (message: string, options?: NotificationOptions) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position,
      icon: '❌',
    })
  }

  const warning = (message: string, options?: NotificationOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position,
      icon: '⚠️',
      style: {
        background: '#fffbeb',
        color: '#92400e',
        border: '1px solid #fde68a',
      },
    })
  }

  const info = (message: string, options?: NotificationOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position,
      icon: 'ℹ️',
      style: {
        background: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #bfdbfe',
      },
    })
  }

  const loading = (message: string) => {
    return toast.loading(message, {
      icon: '⏳',
      style: {
        background: '#f9fafb',
        color: '#374151',
        border: '1px solid #e5e7eb',
      },
    })
  }

  const promise = <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, msgs)
  }

  const dismiss = (id?: string) => {
    if (id) {
      toast.dismiss(id)
    } else {
      toast.dismiss()
    }
  }

  const custom = (message: string, options?: {
    icon?: string
    style?: React.CSSProperties
    duration?: number
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  }) => {
    return toast(message, {
      icon: options?.icon,
      style: options?.style,
      duration: options?.duration || 4000,
      position: options?.position,
    })
  }

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    custom,
  }
}
