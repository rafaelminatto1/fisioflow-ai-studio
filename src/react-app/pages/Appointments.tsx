import { useState, useMemo } from 'react'
import React from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  CalendarPlus,
  Download,
  MapPin,
  CreditCard,
  Gift,
  List,
  Grid
} from 'lucide-react'
import { Card, CardContent } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { OptimizedCard } from '@/react-app/components/OptimizedCard'
import { LoadingOverlay } from '@/react-app/components/LoadingOverlay'
import { ErrorBoundary } from '@/react-app/components/ErrorBoundary'
import { VirtualizedAppointmentList } from '@/react-app/components/VirtualizedList'
import { useOptimizedCache } from '@/react-app/hooks/useOptimizedCache'
import { useOptimisticMutation } from '@/react-app/hooks/useOptimisticMutation'
// import { useNotifications } from '@/react-app/hooks/useNotifications'
import { useDebounce } from '@/react-app/hooks/useDebounce'
import { useAdaptiveBehavior } from '@/react-app/hooks/useConnectionAware'
import { usePageRefresh } from '@/react-app/hooks/useSmartRefresh'
// import { useCriticalDataSync } from '@/react-app/hooks/useBackgroundSync'
import { PaymentModal } from '@/react-app/components/PaymentModal'
import { AdvancedCalendar } from '@/react-app/components/AdvancedCalendar'
import { AppointmentForm } from '@/react-app/components/AppointmentForm'
import { AppointmentType } from '@/shared/types'
import { formatDateTime } from '@/lib/utils'

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentType | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<AppointmentType | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [initialAppointmentDate, setInitialAppointmentDate] = useState<Date | undefined>(undefined)

  // const notifications = useNotifications()
  const { behavior } = useAdaptiveBehavior()
  
  // Debounce search term para evitar muitas re-renderizações
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Background sync para dados críticos
  // useCriticalDataSync()

  // Cache otimizado para pacientes
  const { 
    data: patients
  } = useOptimizedCache<any[]>('patients-list', '/api/patients', {
    staleTime: behavior.staleTime,
    cacheTime: behavior.cacheTime
  })

  // Cache otimizado para agendamentos com updates otimistas
  const { 
    data: appointments, 
    loading, 
    isRevalidating,
    refetch,
    updateOptimistic: updateAppointmentsOptimistic
  } = useOptimizedCache<AppointmentType[]>('appointments-list', '/api/appointments', {
    staleTime: Math.min(behavior.staleTime, 30 * 1000), // Max 30 segundos para agendamentos
    cacheTime: behavior.cacheTime,
    refetchOnWindowFocus: true,
    optimisticUpdates: behavior.enableOptimisticUpdates
  })

  // Smart refresh para esta página
  usePageRefresh('appointments', refetch)

  // Mutations otimistas para operações de agendamento
  const statusMutation = useOptimisticMutation({
    onOptimisticUpdate: (data: { id: number, status: string }) => {
      updateAppointmentsOptimistic(prev => {
        if (!prev || !Array.isArray(prev)) return prev || []
        return prev.map(apt => 
          apt.id === data.id ? { ...apt, status: data.status as any } : apt
        )
      })
    },
    successMessage: 'Status atualizado com sucesso',
    errorMessage: 'Erro ao atualizar status'
  })

  const deleteMutation = useOptimisticMutation({
    onOptimisticUpdate: () => {
      // Remove será tratado após confirmação do servidor
    },
    successMessage: 'Agendamento excluído com sucesso',
    errorMessage: 'Erro ao excluir agendamento'
  })

  // Filter and search appointments (usando debounced search)
  const filteredAppointments = useMemo(() => {
    if (!appointments) return []

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const matchesSearch = appointment.service?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           appointment.notes?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           appointment.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      const matchesDateFilter = !selectedDate || 
                               appointmentDate.toISOString().split('T')[0] === selectedDate

      const matchesStatusFilter = selectedFilter === 'all' || 
                                 appointment.status === selectedFilter ||
                                 (selectedFilter === 'today' && appointmentDate.toDateString() === today.toDateString()) ||
                                 (selectedFilter === 'upcoming' && appointmentDate > today) ||
                                 (selectedFilter === 'past' && appointmentDate < today)

      return matchesSearch && matchesDateFilter && matchesStatusFilter
    })
  }, [appointments, debouncedSearchTerm, selectedFilter, selectedDate])

  const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
    await statusMutation.mutate(`/api/appointments/${appointmentId}/status`, 
      { id: appointmentId, status: newStatus }
    )
  }

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

    const result = await deleteMutation.mutateDelete(`/api/appointments/${appointmentId}`)
    if (result) {
      // Atualiza lista após exclusão
      setTimeout(() => refetch(), 100)
    }
  }

  const handleOpenPaymentModal = (appointment: AppointmentType) => {
    setSelectedAppointmentForPayment(appointment)
    setShowPaymentModal(true)
  }

  const handlePaymentUpdated = () => {
    // Em vez de refetch completo, apenas atualiza em background
    setTimeout(() => refetch(), 100)
  }

  // Calendar event handlers
  const handleAppointmentSelect = (appointment: AppointmentType) => {
    // Could open appointment details modal or navigate to consultation
    console.log('Selected appointment:', appointment)
  }

  

  const handleCreateAppointment = (date?: Date) => {
    if (date) {
      setInitialAppointmentDate(date)
    }
    setShowAppointmentForm(true)
  }

  const handleCalendarStatusUpdate = async (appointment: AppointmentType, newStatus: string) => {
    await handleStatusUpdate(appointment.id, newStatus)
  }

  const handleCalendarPaymentAction = (appointment: AppointmentType) => {
    handleOpenPaymentModal(appointment)
  }

  const handleCalendarEditAppointment = (appointment: AppointmentType) => {
    setEditingAppointment(appointment)
    setInitialAppointmentDate(undefined)
    setShowAppointmentForm(true)
  }

  const handleSaveAppointment = async () => {
    // Update otimista já foi aplicado no form
    // Apenas revalida em background para garantir sincronização
    setTimeout(() => refetch(), 100)
  }

  // Handler para updates otimistas do form
  const handleOptimisticAppointmentUpdate = () => {
    // Update otimista será tratado pelo mutation hook
    setTimeout(() => refetch(), 100)
  }

  const handleCalendarDeleteAppointment = async (appointment: AppointmentType) => {
    await handleDeleteAppointment(appointment.id)
  }

  const statusConfig = {
    'SCHEDULED': { 
      label: 'Agendado', 
      variant: 'info' as const, 
      icon: Clock,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    'CONFIRMED': { 
      label: 'Confirmado', 
      variant: 'success' as const, 
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    'IN_PROGRESS': { 
      label: 'Em Andamento', 
      variant: 'warning' as const, 
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    'COMPLETED': { 
      label: 'Concluído', 
      variant: 'success' as const, 
      icon: CheckCircle,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    'CANCELLED': { 
      label: 'Cancelado', 
      variant: 'destructive' as const, 
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    'NO_SHOW': { 
      label: 'Faltou', 
      variant: 'destructive' as const, 
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const typeLabels = {
    'CONSULTATION': 'Consulta',
    'TREATMENT': 'Tratamento',
    'ASSESSMENT': 'Avaliação',
    'FOLLOW_UP': 'Retorno',
    'TELECONSULTATION': 'Teleconsulta'
  }

  const paymentStatusConfig = {
    'PENDENTE': { 
      label: 'Pendente', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    },
    'PAGO': { 
      label: 'Pago', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle
    },
    'PAGA_COM_PACOTE': { 
      label: 'Pacote', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CreditCard
    },
    'CORTESIA': { 
      label: 'Cortesia', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Gift
    }
  }

  const filterOptions = [
    { value: 'all', label: 'Todos', count: appointments?.length || 0 },
    { value: 'today', label: 'Hoje', count: appointments?.filter(a => {
      const today = new Date()
      const appDate = new Date(a.appointmentDate)
      return appDate.toDateString() === today.toDateString()
    }).length || 0 },
    { value: 'upcoming', label: 'Próximos', count: appointments?.filter(a => new Date(a.appointmentDate) > new Date()).length || 0 },
    { value: 'CONFIRMED', label: 'Confirmados', count: appointments?.filter(a => a.status === 'CONFIRMED').length || 0 },
    { value: 'COMPLETED', label: 'Concluídos', count: appointments?.filter(a => a.status === 'COMPLETED').length || 0 }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-slate-200 rounded-lg w-80 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-60 animate-pulse"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Agendamentos
            {isRevalidating && <span className="text-sm text-blue-600">• Atualizando...</span>}
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie os agendamentos da sua clínica
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4 mr-2" />
              Calendário
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>
          <Button variant="outline" onClick={() => {}}>
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowAppointmentForm(true)}>
            <CalendarPlus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards - Otimizados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <OptimizedCard delay={0.1} loading={loading}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-600">Hoje</p>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {appointments?.filter(a => {
                const today = new Date()
                const appDate = new Date(a.appointmentDate)
                return appDate.toDateString() === today.toDateString()
              }).length || 0}
            </h3>
            <p className="text-xs text-slate-500">Agendamentos hoje</p>
          </CardContent>
        </OptimizedCard>

        <OptimizedCard delay={0.2} loading={loading}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-600">Esta Semana</p>
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {appointments?.filter(a => {
                const weekStart = new Date()
                weekStart.setDate(weekStart.getDate() - weekStart.getDay())
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekEnd.getDate() + 6)
                const appDate = new Date(a.appointmentDate)
                return appDate >= weekStart && appDate <= weekEnd
              }).length || 0}
            </h3>
            <p className="text-xs text-slate-500">Próximos 7 dias</p>
          </CardContent>
        </OptimizedCard>

        <OptimizedCard delay={0.3} loading={loading}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-600">Confirmados</p>
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {appointments?.filter(a => a.status === 'CONFIRMED').length || 0}
            </h3>
            <p className="text-xs text-slate-500">Aguardando atendimento</p>
          </CardContent>
        </OptimizedCard>

        <OptimizedCard delay={0.4} loading={loading}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-600">Concluídos</p>
              <CheckCircle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {appointments?.filter(a => a.status === 'COMPLETED').length || 0}
            </h3>
            <p className="text-xs text-slate-500">Este mês</p>
          </CardContent>
        </OptimizedCard>
      </div>

      {/* Search and Filters - Only show for list view */}
      {viewMode === 'list' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col lg:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por serviço, tipo ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {filterOptions.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? "default" : "outline"}
                onClick={() => setSelectedFilter(filter.value)}
                className="whitespace-nowrap"
              >
                <Filter className="w-4 h-4 mr-2" />
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content - Calendar or List View */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative"
      >
        {/* Loading overlay apenas durante operações */}
        <LoadingOverlay 
          isLoading={statusMutation.isLoading || deleteMutation.isLoading} 
          message="Processando..."
          transparent={true}
          size="sm"
        />

        {viewMode === 'calendar' ? (
          <AdvancedCalendar
            appointments={appointments || []}
            onAppointmentSelect={handleAppointmentSelect}
            onCreateAppointment={handleCreateAppointment}
            onEditAppointment={handleCalendarEditAppointment}
            onDeleteAppointment={handleCalendarDeleteAppointment}
            onPaymentAction={handleCalendarPaymentAction}
            onStatusUpdate={handleCalendarStatusUpdate}
            loading={loading}
          />
        ) : (
          /* List View */
          <ErrorBoundary>
            {filteredAppointments.length > 50 ? (
              <Card className="shadow-md border-0">
                <CardContent className="p-0">
                  <VirtualizedAppointmentList
                    appointments={filteredAppointments}
                    onAppointmentClick={handleAppointmentSelect}
                    onStatusChange={handleStatusUpdate}
                    height={700}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment, index) => {
          const status = statusConfig[appointment.status as keyof typeof statusConfig]
          const StatusIcon = status.icon
          const appointmentDate = new Date(appointment.appointmentDate)
          const isToday = appointmentDate.toDateString() === new Date().toDateString()
          const isPast = appointmentDate < new Date()

          return (
            <OptimizedCard
              key={appointment.id}
              delay={0.7 + index * 0.05}
              className={`group ${isToday ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}
            >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-4 h-4 rounded-full ${
                        appointment.status === 'CONFIRMED' ? 'bg-green-500' :
                        appointment.status === 'SCHEDULED' ? 'bg-blue-500' :
                        appointment.status === 'COMPLETED' ? 'bg-gray-500' :
                        appointment.status === 'CANCELLED' ? 'bg-red-500' :
                        appointment.status === 'NO_SHOW' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {appointment.service || typeLabels[appointment.type as keyof typeof typeLabels]}
                          </h3>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          {appointment.paymentStatus && paymentStatusConfig[appointment.paymentStatus as keyof typeof paymentStatusConfig] && (
                            <Badge className={paymentStatusConfig[appointment.paymentStatus as keyof typeof paymentStatusConfig].color}>
                              {React.createElement(paymentStatusConfig[appointment.paymentStatus as keyof typeof paymentStatusConfig].icon, { className: "w-3 h-3 mr-1" })}
                              {paymentStatusConfig[appointment.paymentStatus as keyof typeof paymentStatusConfig].label}
                            </Badge>
                          )}
                          {isToday && (
                            <Badge variant="info">
                              <Clock className="w-3 h-3 mr-1" />
                              Hoje
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(appointment.appointmentDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.duration} minutos</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>Paciente ID: {appointment.patientId}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mt-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {appointment.status === 'SCHEDULED' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment.id, 'CONFIRMED')}
                        >
                          Confirmar
                        </Button>
                      )}
                      {appointment.status === 'CONFIRMED' && !isPast && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment.id, 'IN_PROGRESS')}
                        >
                          Iniciar
                        </Button>
                      )}
                      {appointment.status === 'IN_PROGRESS' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment.id, 'COMPLETED')}
                        >
                          Concluir
                        </Button>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        {(!appointment.paymentStatus || appointment.paymentStatus === 'PENDENTE') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenPaymentModal(appointment)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Marcar como Pago
                          </Button>
                        )}
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button variant="ghost" size="icon" title="Ver detalhes">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            onClick={() => setEditingAppointment(appointment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {(!appointment.paymentStatus || appointment.paymentStatus === 'PENDENTE') && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Alterar Pagamento"
                              onClick={() => handleOpenPaymentModal(appointment)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Excluir"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </OptimizedCard>
          )
        })}
              </div>
            )}
          </ErrorBoundary>
        )}
      </motion.div>

      {/* Empty State */}
      {filteredAppointments.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm || selectedDate ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento cadastrado'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm || selectedDate
              ? 'Tente ajustar os filtros de busca.'
              : 'Crie seu primeiro agendamento para começar.'
            }
          </p>
          {!searchTerm && !selectedDate && (
            <Button onClick={() => setShowAppointmentForm(true)}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Criar Primeiro Agendamento
            </Button>
          )}
        </motion.div>
      )}

      {/* Appointment Form Modal */}
      <AppointmentForm
        appointment={editingAppointment || undefined}
        patients={patients || []}
        isOpen={showAppointmentForm || !!editingAppointment}
        onClose={() => {
          setShowAppointmentForm(false)
          setEditingAppointment(null)
          setInitialAppointmentDate(undefined)
        }}
        onSave={handleSaveAppointment}
        onOptimisticUpdate={handleOptimisticAppointmentUpdate}
        onPatientsRefresh={async () => {
          // Apenas revalida cache de pacientes sem recarregar página
          setTimeout(() => refetch(), 100)
        }}
        initialDate={initialAppointmentDate}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedAppointmentForPayment(null)
        }}
        appointment={selectedAppointmentForPayment}
        onPaymentUpdated={handlePaymentUpdated}
      />
    </div>
  )
}
