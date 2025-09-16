import React from 'react'
import { useVirtualList } from '@/react-app/hooks/useVirtualList'

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  height: number
  className?: string
  overscan?: number
  emptyState?: React.ReactNode
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  className = '',
  overscan = 5,
  emptyState
}: VirtualizedListProps<T>) {
  const { virtualItems, scrollElementProps, containerProps } = useVirtualList({
    items,
    itemHeight,
    containerHeight: height,
    overscan
  })

  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  return (
    <div className={className}>
      <div {...scrollElementProps}>
        <div {...containerProps}>
          {virtualItems.map(({ index, start, item }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: start,
                left: 0,
                right: 0,
                height: itemHeight
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente específico para lista de pacientes virtualizada
interface VirtualizedPatientListProps {
  patients: any[]
  onPatientClick?: (patient: any) => void
  onPatientEdit?: (patient: any) => void
  onPatientDelete?: (patient: any) => void
  height?: number
  className?: string
}

export function VirtualizedPatientList({
  patients,
  onPatientClick,
  onPatientEdit,
  onPatientDelete,
  height = 400,
  className = ''
}: VirtualizedPatientListProps) {
  const renderPatientItem = (patient: any) => (
    <div className="p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{patient.name}</h3>
            <p className="text-sm text-slate-600">{patient.phone}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {onPatientClick && (
            <button
              onClick={() => onPatientClick(patient)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Ver
            </button>
          )}
          {onPatientEdit && (
            <button
              onClick={() => onPatientEdit(patient)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              Editar
            </button>
          )}
          {onPatientDelete && (
            <button
              onClick={() => onPatientDelete(patient)}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <VirtualizedList
      items={patients}
      renderItem={renderPatientItem}
      itemHeight={80}
      height={height}
      className={className}
      emptyState={
        <div className="text-center py-8 text-slate-500">
          Nenhum paciente encontrado
        </div>
      }
    />
  )
}

// Componente específico para lista de agendamentos virtualizada
interface VirtualizedAppointmentListProps {
  appointments: any[]
  onAppointmentClick?: (appointment: any) => void
  onStatusChange?: (appointment: any, newStatus: string) => void
  height?: number
  className?: string
}

export function VirtualizedAppointmentList({
  appointments,
  onAppointmentClick,
  onStatusChange,
  height = 500,
  className = ''
}: VirtualizedAppointmentListProps) {
  const renderAppointmentItem = (appointment: any) => {
    const statusColors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }

    return (
      <div className="p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-medium text-slate-900">
                {appointment.service || appointment.type}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {appointment.status}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              <p>Paciente ID: {appointment.patientId}</p>
              <p>{new Date(appointment.appointmentDate).toLocaleString('pt-BR')}</p>
              <p>Duração: {appointment.duration} minutos</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {onAppointmentClick && (
              <button
                onClick={() => onAppointmentClick(appointment)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Ver
              </button>
            )}
            {onStatusChange && appointment.status !== 'COMPLETED' && (
              <button
                onClick={() => onStatusChange(appointment, 'COMPLETED')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <VirtualizedList
      items={appointments}
      renderItem={renderAppointmentItem}
      itemHeight={120}
      height={height}
      className={className}
      emptyState={
        <div className="text-center py-8 text-slate-500">
          Nenhum agendamento encontrado
        </div>
      }
    />
  )
}
