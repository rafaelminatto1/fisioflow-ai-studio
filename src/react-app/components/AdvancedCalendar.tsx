import { useState, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views, View, EventProps } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Edit,
  Trash2,
  CreditCard,
  Play,
  CheckCircle,
  Eye,
  MapPin
} from 'lucide-react'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { Card } from '@/react-app/components/ui/card'
import { AppointmentType } from '@/shared/types'
import { formatTime } from '@/lib/utils'

// Configure moment localizer
moment.locale('pt-br')
const localizer = momentLocalizer(moment)

interface AdvancedCalendarProps {
  appointments: AppointmentType[]
  onAppointmentSelect?: (appointment: AppointmentType) => void
  onCreateAppointment?: (date: Date) => void
  onEditAppointment?: (appointment: AppointmentType) => void
  onDeleteAppointment?: (appointment: AppointmentType) => void
  onPaymentAction?: (appointment: AppointmentType) => void
  onStatusUpdate?: (appointment: AppointmentType, newStatus: string) => void
  loading?: boolean
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: AppointmentType
  type: string
  status: string
  paymentStatus?: string
}

export function AdvancedCalendar({
  appointments = [],
  onAppointmentSelect,
  onCreateAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onPaymentAction,
  onStatusUpdate,
  loading = false
}: AdvancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>(Views.WEEK)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; event: CalendarEvent } | null>(null)

  // Convert appointments to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map(appointment => {
      const start = new Date(appointment.appointmentDate)
      const end = new Date(start.getTime() + (appointment.duration || 60) * 60000)
      
      return {
        id: appointment.id,
        title: appointment.service || `Paciente ${appointment.patientId}`,
        start,
        end,
        resource: appointment,
        type: appointment.type,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus
      }
    })
  }, [appointments])

  // Event style getter for color coding
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#3174ad'
    let borderColor = '#3174ad'
    let color = 'white'

    // Status colors
    switch (event.status) {
      case 'CONFIRMED':
        backgroundColor = '#10b981'
        borderColor = '#059669'
        break
      case 'IN_PROGRESS':
        backgroundColor = '#f59e0b'
        borderColor = '#d97706'
        break
      case 'COMPLETED':
        backgroundColor = '#6b7280'
        borderColor = '#4b5563'
        break
      case 'CANCELLED':
        backgroundColor = '#ef4444'
        borderColor = '#dc2626'
        break
      case 'NO_SHOW':
        backgroundColor = '#ef4444'
        borderColor = '#dc2626'
        break
      default: // SCHEDULED
        backgroundColor = '#3b82f6'
        borderColor = '#2563eb'
    }

    // Payment status indicator
    if (event.paymentStatus === 'PAGO') {
      borderColor = '#10b981'
    } else if (event.paymentStatus === 'PAGA_COM_PACOTE') {
      borderColor = '#3b82f6'
    } else if (event.paymentStatus === 'CORTESIA') {
      borderColor = '#6b7280'
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        border: `2px solid ${borderColor}`,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500'
      }
    }
  }, [])

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    onAppointmentSelect?.(event.resource)
  }, [onAppointmentSelect])

  // Handle event context menu (right click)
  const handleEventRightClick = useCallback((event: CalendarEvent, e: any) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      event
    })
  }, [])

  

  // Handle slot selection (create new appointment)
  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    onCreateAppointment?.(start)
  }, [onCreateAppointment])

  // Close context menu when clicking elsewhere
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Custom event component  
  const EventComponent = ({ event }: EventProps<CalendarEvent>) => {
    const paymentStatus = event.paymentStatus
    const PaymentIcon = paymentStatus === 'PAGO' ? CheckCircle :
                       paymentStatus === 'PAGA_COM_PACOTE' ? CreditCard :
                       paymentStatus === 'CORTESIA' ? MapPin : Clock

    return (
      <div 
        className="h-full flex items-center justify-between px-2 text-xs"
        onContextMenu={(e) => handleEventRightClick(event, e)}
      >
        <div className="flex-1 truncate">
          <div className="font-medium truncate">{event.title}</div>
          <div className="opacity-80">{formatTime(event.start)}</div>
        </div>
        {paymentStatus && (
          <PaymentIcon className="w-3 h-3 ml-1 flex-shrink-0" />
        )}
      </div>
    )
  }

  // Custom toolbar
  const CustomToolbar = ({ date, view, onNavigate, onView }: any) => {
    return (
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('PREV')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('TODAY')}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('NEXT')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900">
            {moment(date).format('MMMM YYYY')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === Views.DAY ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(Views.DAY)}
          >
            Dia
          </Button>
          <Button
            variant={view === Views.WEEK ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(Views.WEEK)}
          >
            Semana
          </Button>
          <Button
            variant={view === Views.MONTH ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(Views.MONTH)}
          >
            Mês
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-12 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-96 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      onClick={handleCloseContextMenu}
    >
      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 mb-3">Legenda de Status</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Agendado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Cancelado</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-6">
        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor={(event: CalendarEvent) => event.start}
            endAccessor={(event: CalendarEvent) => event.end}
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onSelectEvent={(event: CalendarEvent) => handleSelectEvent(event)}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={(event: CalendarEvent) => eventStyleGetter(event)}
            components={{
              event: EventComponent,
              toolbar: CustomToolbar
            }}
            selectable
            step={15}
            timeslots={4}
            min={new Date(0, 0, 0, 7, 0, 0)} // 7 AM
            max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
            formats={{
              timeGutterFormat: 'HH:mm',
              eventTimeRangeFormat: ({ start, end }) => 
                `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
              agendaTimeFormat: 'HH:mm',
              agendaTimeRangeFormat: ({ start, end }) => 
                `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
            }}
            messages={{
              date: 'Data',
              time: 'Hora',
              event: 'Evento',
              allDay: 'Dia todo',
              week: 'Semana',
              work_week: 'Semana de trabalho',
              day: 'Dia',
              month: 'Mês',
              previous: 'Anterior',
              next: 'Próximo',
              yesterday: 'Ontem',
              tomorrow: 'Amanhã',
              today: 'Hoje',
              agenda: 'Agenda',
              noEventsInRange: 'Não há agendamentos neste período.',
              showMore: (total) => `+ Ver mais (${total})`
            }}
          />
        </div>
      </Card>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border rounded-lg shadow-lg py-2 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
            onClick={() => {
              onAppointmentSelect?.(contextMenu.event.resource)
              setContextMenu(null)
            }}
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </button>
          
          <button
            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
            onClick={() => {
              onEditAppointment?.(contextMenu.event.resource)
              setContextMenu(null)
            }}
          >
            <Edit className="w-4 h-4" />
            Editar Agendamento
          </button>

          {contextMenu.event.status === 'SCHEDULED' && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
              onClick={() => {
                onStatusUpdate?.(contextMenu.event.resource, 'CONFIRMED')
                setContextMenu(null)
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Confirmar
            </button>
          )}

          {contextMenu.event.status === 'CONFIRMED' && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
              onClick={() => {
                onStatusUpdate?.(contextMenu.event.resource, 'IN_PROGRESS')
                setContextMenu(null)
              }}
            >
              <Play className="w-4 h-4" />
              Iniciar Atendimento
            </button>
          )}

          {contextMenu.event.status === 'IN_PROGRESS' && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
              onClick={() => {
                onStatusUpdate?.(contextMenu.event.resource, 'COMPLETED')
                setContextMenu(null)
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Finalizar Atendimento
            </button>
          )}

          {(!contextMenu.event.paymentStatus || contextMenu.event.paymentStatus === 'PENDENTE') && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
              onClick={() => {
                onPaymentAction?.(contextMenu.event.resource)
                setContextMenu(null)
              }}
            >
              <CreditCard className="w-4 h-4" />
              Marcar como Pago
            </button>
          )}

          <div className="border-t my-2"></div>
          
          <button
            className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
            onClick={() => {
              onDeleteAppointment?.(contextMenu.event.resource)
              setContextMenu(null)
            }}
          >
            <Trash2 className="w-4 h-4" />
            Excluir Agendamento
          </button>
        </div>
      )}

      {/* Selected Event Details Panel */}
      {selectedEvent && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Detalhes do Agendamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-slate-600">Serviço:</span>
              <div className="font-medium">{selectedEvent.title}</div>
            </div>
            <div>
              <span className="text-sm text-slate-600">Data e Hora:</span>
              <div className="font-medium">
                {moment(selectedEvent.start).format('DD/MM/YYYY HH:mm')}
              </div>
            </div>
            <div>
              <span className="text-sm text-slate-600">Duração:</span>
              <div className="font-medium">
                {Math.round((selectedEvent.end.getTime() - selectedEvent.start.getTime()) / 60000)} minutos
              </div>
            </div>
            <div>
              <span className="text-sm text-slate-600">Status:</span>
              <Badge className="ml-2">
                {selectedEvent.status === 'CONFIRMED' ? 'Confirmado' :
                 selectedEvent.status === 'SCHEDULED' ? 'Agendado' :
                 selectedEvent.status === 'IN_PROGRESS' ? 'Em Andamento' :
                 selectedEvent.status === 'COMPLETED' ? 'Concluído' :
                 selectedEvent.status === 'CANCELLED' ? 'Cancelado' : 'Não Compareceu'}
              </Badge>
            </div>
            {selectedEvent.paymentStatus && (
              <div>
                <span className="text-sm text-slate-600">Pagamento:</span>
                <Badge className="ml-2">
                  {selectedEvent.paymentStatus === 'PAGO' ? 'Pago' :
                   selectedEvent.paymentStatus === 'PAGA_COM_PACOTE' ? 'Pacote' :
                   selectedEvent.paymentStatus === 'CORTESIA' ? 'Cortesia' : 'Pendente'}
                </Badge>
              </div>
            )}
            <div>
              <span className="text-sm text-slate-600">Tipo:</span>
              <div className="font-medium">
                {selectedEvent.type === 'CONSULTATION' ? 'Consulta' :
                 selectedEvent.type === 'TREATMENT' ? 'Tratamento' :
                 selectedEvent.type === 'ASSESSMENT' ? 'Avaliação' :
                 selectedEvent.type === 'FOLLOW_UP' ? 'Retorno' : 'Teleconsulta'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => onEditAppointment?.(selectedEvent.resource)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onPaymentAction?.(selectedEvent.resource)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pagamento
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedEvent(null)}
            >
              Fechar
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  )
}
