import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface CalendarEvent {
  id: string
  title: string
  patientName: string
  start: Date
  end: Date
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  type: string
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onNewEvent?: () => void
  className?: string
}

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
  CONFIRMED: 'bg-green-100 text-green-700 border-green-200', 
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200'
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarView({ 
  events, 
  onEventClick, 
  onDateClick, 
  onNewEvent, 
  className = '' 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
      return newDate
    })
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        navigateMonth(direction)
        break
      case 'week':
        navigateWeek(direction)
        break
      case 'day':
        navigateDay(direction)
        break
    }
  }

  const monthViewData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === current.toDateString()
      })
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        events: dayEvents
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [currentDate, events])

  const weekViewData = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === date.toDateString()
      }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      
      days.push({
        date,
        isToday: date.toDateString() === new Date().toDateString(),
        events: dayEvents
      })
    }
    
    return days
  }, [currentDate, events])

  const dayViewData = useMemo(() => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === currentDate.toDateString()
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    
    return dayEvents
  }, [currentDate, events])

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {weekDays.map(day => (
        <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 bg-slate-50">
          {day}
        </div>
      ))}
      {monthViewData.map((day, index) => (
        <motion.div
          key={index}
          className={`min-h-24 p-1 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${
            !day.isCurrentMonth ? 'bg-slate-50 opacity-50' : 'bg-white'
          } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => onDateClick?.(day.date)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`text-sm font-medium mb-1 ${
            day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
          }`}>
            {day.date.getDate()}
          </div>
          <div className="space-y-1">
            {day.events.slice(0, 2).map(event => (
              <motion.div
                key={event.id}
                className={`text-xs p-1 rounded text-center cursor-pointer ${statusColors[event.status]}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick?.(event)
                }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="font-medium truncate">{event.patientName}</div>
                <div className="truncate">
                  {new Date(event.start).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </motion.div>
            ))}
            {day.events.length > 2 && (
              <div className="text-xs text-slate-500 text-center">
                +{day.events.length - 2} mais
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-2">
      {weekViewData.map((day, index) => (
        <motion.div
          key={index}
          className={`border border-slate-200 rounded-lg p-3 min-h-96 ${
            day.isToday ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className={`text-center mb-3 ${day.isToday ? 'text-blue-600' : 'text-slate-900'}`}>
            <div className="text-xs font-medium">{weekDays[day.date.getDay()]}</div>
            <div className="text-lg font-bold">{day.date.getDate()}</div>
          </div>
          <div className="space-y-2">
            {day.events.map(event => (
              <motion.div
                key={event.id}
                className={`p-2 rounded-lg cursor-pointer ${statusColors[event.status]}`}
                onClick={() => onEventClick?.(event)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="font-medium text-sm">{event.patientName}</div>
                <div className="text-xs flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(event.start).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-xs">{event.type}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderDayView = () => (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {currentDate.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        <p className="text-sm text-slate-600">{dayViewData.length} agendamento(s)</p>
      </div>
      
      <div className="space-y-3">
        {dayViewData.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum agendamento para este dia</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={onNewEvent}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          </div>
        ) : (
          dayViewData.map(event => (
            <motion.div
              key={event.id}
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${statusColors[event.status]}`}
              onClick={() => onEventClick?.(event)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{event.patientName}</h4>
                <Badge variant="outline" className="text-xs">
                  {event.status === 'SCHEDULED' ? 'Agendado' : 
                   event.status === 'CONFIRMED' ? 'Confirmado' : 
                   event.status === 'IN_PROGRESS' ? 'Em Andamento' : 
                   event.status === 'COMPLETED' ? 'Concluído' : 'Cancelado'}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-slate-600 mb-1">
                <Clock className="w-4 h-4 mr-2" />
                {new Date(event.start).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} - {new Date(event.end).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <User className="w-4 h-4 mr-2" />
                {event.type}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <Card className={`shadow-md border-0 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {view === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {view === 'week' && `Semana de ${currentDate.toLocaleDateString('pt-BR')}`}
              {view === 'day' && currentDate.toLocaleDateString('pt-BR')}
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map(viewOption => (
                <Button
                  key={viewOption}
                  variant={view === viewOption ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView(viewOption)}
                  className={view === viewOption ? 'bg-white shadow-sm' : ''}
                >
                  {viewOption === 'month' ? 'Mês' : 
                   viewOption === 'week' ? 'Semana' : 'Dia'}
                </Button>
              ))}
            </div>
            {onNewEvent && (
              <Button 
                onClick={onNewEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </CardContent>
    </Card>
  )
}
