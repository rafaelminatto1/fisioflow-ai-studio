import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle,
  X,
  Bell,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Badge } from '@/react-app/components/ui/badge'
import { Button } from '@/react-app/components/ui/button'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { formatDate, formatTime } from '@/lib/utils'

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  category: 'task' | 'appointment' | 'inventory' | 'patient' | 'system'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  data?: any
  created_at: string
  read?: boolean
}

interface AlertsNotificationsProps {
  maxItems?: number
  showHeader?: boolean
  onAlertClick?: (alert: Alert) => void
  onMarkAsRead?: (alertId: string) => void
}

const alertIcons = {
  warning: AlertTriangle,
  error: AlertCircle,
  info: Bell,
  success: CheckCircle
}

const alertColors = {
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  success: 'text-green-600 bg-green-50 border-green-200'
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700'
}

export function AlertsNotifications({ 
  maxItems = 10, 
  showHeader = false,
  onAlertClick,
  onMarkAsRead 
}: AlertsNotificationsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])

  // Fetch das tarefas para gerar alertas de deadlines
  const { data: tasks } = useOptimizedAuthFetch<any[]>('tasks', '/api/tasks')
  const { data: appointments } = useOptimizedAuthFetch<any[]>('appointments-today', '/api/appointments/today')
  const { data: inventory } = useOptimizedAuthFetch<any[]>('inventory-low', '/api/inventory/low-stock')

  useEffect(() => {
    const generatedAlerts: Alert[] = []

    // Alertas de tarefas atrasadas
    if (tasks) {
      const overdueTasks = tasks.filter(task => 
        task.due_date && 
        new Date(task.due_date) < new Date() && 
        task.status !== 'COMPLETED'
      )

      overdueTasks.forEach(task => {
        generatedAlerts.push({
          id: `task-overdue-${task.id}`,
          type: 'error',
          title: 'Tarefa Atrasada',
          message: `"${task.title}" deveria ter sido concluída em ${formatDate(task.due_date)}`,
          category: 'task',
          priority: task.priority,
          data: task,
          created_at: new Date().toISOString()
        })
      })

      // Alertas de tarefas vencendo hoje
      const tasksDueToday = tasks.filter(task => {
        if (!task.due_date || task.status === 'COMPLETED') return false
        const today = new Date().toDateString()
        const dueDate = new Date(task.due_date).toDateString()
        return today === dueDate
      })

      tasksDueToday.forEach(task => {
        generatedAlerts.push({
          id: `task-due-today-${task.id}`,
          type: 'warning',
          title: 'Tarefa Vence Hoje',
          message: `"${task.title}" deve ser concluída hoje`,
          category: 'task',
          priority: task.priority,
          data: task,
          created_at: new Date().toISOString()
        })
      })

      // Alertas de tarefas urgentes pendentes
      const urgentTasks = tasks.filter(task => 
        task.priority === 'URGENT' && 
        task.status === 'PENDING'
      )

      urgentTasks.forEach(task => {
        generatedAlerts.push({
          id: `task-urgent-${task.id}`,
          type: 'error',
          title: 'Tarefa Urgente Pendente',
          message: `"${task.title}" requer atenção imediata`,
          category: 'task',
          priority: 'URGENT',
          data: task,
          created_at: new Date().toISOString()
        })
      })
    }

    // Alertas de consultas do dia
    if (appointments) {
      const upcomingAppointments = appointments.filter(apt => {
        const aptTime = new Date(apt.appointment_date)
        const now = new Date()
        const timeDiff = aptTime.getTime() - now.getTime()
        return timeDiff > 0 && timeDiff <= 30 * 60 * 1000 // Próximos 30 minutos
      })

      upcomingAppointments.forEach(apt => {
        generatedAlerts.push({
          id: `appointment-upcoming-${apt.id}`,
          type: 'info',
          title: 'Consulta em Breve',
          message: `${apt.patient_name} às ${formatTime(apt.appointment_date)}`,
          category: 'appointment',
          priority: 'MEDIUM',
          data: apt,
          created_at: new Date().toISOString()
        })
      })
    }

    // Alertas de estoque baixo
    if (inventory) {
      inventory.forEach(item => {
        if (item.current_quantity <= item.min_quantity) {
          generatedAlerts.push({
            id: `inventory-low-${item.id}`,
            type: 'warning',
            title: 'Estoque Baixo',
            message: `${item.name}: ${item.current_quantity} ${item.unit} restantes`,
            category: 'inventory',
            priority: item.current_quantity === 0 ? 'URGENT' : 'MEDIUM',
            data: item,
            created_at: new Date().toISOString()
          })
        }
      })
    }

    // Ordenar por prioridade e data
    const sortedAlerts = generatedAlerts
      .sort((a, b) => {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      .slice(0, maxItems)

    setAlerts(sortedAlerts)
  }, [tasks, appointments, inventory, maxItems])

  const handleAlertClick = (alert: Alert) => {
    onAlertClick?.(alert)
    onMarkAsRead?.(alert.id)
  }

  const unreadCount = alerts.filter(alert => !alert.read).length

  if (alerts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-slate-600">Tudo em ordem! Não há alertas no momento.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Alertas e Notificações
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} não lidos
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence>
            {alerts.map((alert, index) => {
              const Icon = alertIcons[alert.type]
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border-l-4 ${alertColors[alert.type]} ${
                    index !== alerts.length - 1 ? 'border-b border-slate-100' : ''
                  } cursor-pointer hover:bg-opacity-80 transition-colors`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <Badge className={priorityColors[alert.priority]}>
                            {alert.priority === 'LOW' ? 'Baixa' :
                             alert.priority === 'MEDIUM' ? 'Média' :
                             alert.priority === 'HIGH' ? 'Alta' : 'Urgente'}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-90 break-words">{alert.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(alert.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onMarkAsRead?.(alert.id)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente compacto para a sidebar
export function CompactAlerts() {
  const { data: tasks } = useOptimizedAuthFetch<any[]>('tasks', '/api/tasks')
  
  const urgentTasksCount = tasks?.filter(task => 
    task.priority === 'URGENT' && task.status !== 'COMPLETED'
  ).length || 0

  const overdueTasksCount = tasks?.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'COMPLETED'
  ).length || 0

  const totalAlerts = urgentTasksCount + overdueTasksCount

  if (totalAlerts === 0) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed top-4 right-4 z-50"
    >
      <Badge variant="destructive" className="text-xs px-2 py-1">
        {totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''}
      </Badge>
    </motion.div>
  )
}
