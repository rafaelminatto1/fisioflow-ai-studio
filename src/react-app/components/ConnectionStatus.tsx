import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Signal, AlertCircle } from 'lucide-react'
import { useConnectionAware } from '@/react-app/hooks/useConnectionAware'
import { useOfflineQueue } from '@/react-app/hooks/useOfflineQueue'

export function ConnectionStatus() {
  const connection = useConnectionAware()
  const { queueSize } = useOfflineQueue()

  const getStatusConfig = () => {
    switch (connection.quality) {
      case 'offline':
        return {
          icon: WifiOff,
          color: 'bg-red-500',
          text: 'Offline',
          textColor: 'text-red-700'
        }
      case 'slow':
        return {
          icon: Signal,
          color: 'bg-yellow-500',
          text: 'Conexão lenta',
          textColor: 'text-yellow-700'
        }
      case 'fast':
      default:
        return {
          icon: Wifi,
          color: 'bg-green-500',
          text: 'Online',
          textColor: 'text-green-700'
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  const shouldShow = connection.quality !== 'fast' || queueSize > 0

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 flex items-center space-x-3 max-w-xs">
            <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`}></div>
            <StatusIcon className={`w-4 h-4 ${config.textColor}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${config.textColor}`}>
                {config.text}
              </p>
              {queueSize > 0 && (
                <p className="text-xs text-slate-600">
                  {queueSize} ação{queueSize > 1 ? 'ões' : ''} pendente{queueSize > 1 ? 's' : ''}
                </p>
              )}
              {connection.quality === 'slow' && (
                <p className="text-xs text-slate-600">
                  Modo econômico ativo
                </p>
              )}
            </div>
            {connection.quality === 'offline' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
