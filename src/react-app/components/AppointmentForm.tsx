import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, User, FileText, Tag } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { PatientAutocomplete } from './PatientAutocomplete'

import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useOptimisticMutation } from '@/react-app/hooks/useOptimisticMutation'
import { AppointmentType, PatientType } from '@/shared/types'

interface AppointmentFormProps {
  appointment?: AppointmentType
  patients: PatientType[]
  isOpen: boolean
  onClose: () => void
  onSave: (appointmentData: any) => Promise<void>
  onPatientsRefresh?: () => void
  initialDate?: Date
  onOptimisticUpdate?: (data: any) => void
}

const appointmentTypes = [
  { value: 'CONSULTATION', label: 'Consulta' },
  { value: 'TREATMENT', label: 'Tratamento' },
  { value: 'ASSESSMENT', label: 'Avaliação' },
  { value: 'FOLLOW_UP', label: 'Retorno' },
  { value: 'TELECONSULTATION', label: 'Teleconsulta' }
]

const statusOptions = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não Compareceu' }
]

export function AppointmentForm({ 
  appointment, 
  patients, 
  isOpen, 
  onClose, 
  onSave,
  onPatientsRefresh,
  initialDate,
  onOptimisticUpdate
}: AppointmentFormProps) {
  

  // Fetch fresh patients data with caching
  const { 
    data: freshPatients, 
    refetch: refetchPatients 
  } = useOptimizedAuthFetch<PatientType[]>('patients-autocomplete', '/api/patients', {
    staleTime: 1 * 60 * 1000, // 1 minute fresh
    cacheTime: 5 * 60 * 1000 // 5 minutes total cache
  })

  const currentPatients = freshPatients || patients
  
  const [formData, setFormData] = useState({
    patientId: 0,
    appointmentDate: '',
    duration: 60,
    status: 'SCHEDULED',
    type: 'CONSULTATION',
    service: '',
    notes: '',
    isRecurring: false,
    recurringPattern: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mutation otimista para criar/atualizar agendamentos
  const { mutate, mutateUpdate, isLoading } = useOptimisticMutation({
    onOptimisticUpdate: (data: any) => {
      // Update otimista - aplica mudança imediatamente na UI
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data)
      }
    },
    onSuccess: (data: any) => {
      // Quando o servidor confirma, executa callback de sucesso
      onSave(data)
    },
    successMessage: appointment ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!',
    errorMessage: 'Erro ao salvar agendamento. Tente novamente.'
  })

  useEffect(() => {
    if (appointment) {
      // Format datetime for input field
      const date = new Date(appointment.appointmentDate)
      const formattedDate = date.toISOString().slice(0, 16)

      setFormData({
        patientId: appointment.patientId || 0,
        appointmentDate: formattedDate,
        duration: appointment.duration || 60,
        status: appointment.status || 'SCHEDULED',
        type: appointment.type || 'CONSULTATION',
        service: appointment.service || '',
        notes: appointment.notes || '',
        isRecurring: appointment.isRecurring || false,
        recurringPattern: appointment.recurringPattern || ''
      })
    } else {
      // Set default date
      let defaultDate = new Date()
      if (initialDate) {
        defaultDate = new Date(initialDate)
      } else {
        // Set to tomorrow at 9 AM if no initial date
        defaultDate.setDate(defaultDate.getDate() + 1)
        defaultDate.setHours(9, 0, 0, 0)
      }
      
      setFormData({
        patientId: 0,
        appointmentDate: defaultDate.toISOString().slice(0, 16),
        duration: 60,
        status: 'SCHEDULED',
        type: 'CONSULTATION',
        service: '',
        notes: '',
        isRecurring: false,
        recurringPattern: ''
      })
    }
    setErrors({})
  }, [appointment, isOpen, initialDate])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patientId) {
      newErrors.patientId = 'Selecione um paciente'
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Data e hora são obrigatórias'
    } else {
      const appointmentDate = new Date(formData.appointmentDate)
      const now = new Date()
      if (appointmentDate <= now) {
        newErrors.appointmentDate = 'Data deve ser no futuro'
      }
    }

    if (formData.duration < 15) {
      newErrors.duration = 'Duração deve ser de pelo menos 15 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData = {
      ...formData,
      patientId: Number(formData.patientId),
      // Para update otimista, adiciona ID se editando
      ...(appointment && { id: appointment.id })
    }

    let result
    if (appointment) {
      // Update existing appointment usando mutation otimista
      result = await mutateUpdate(`/api/appointments/${appointment.id}`, submitData)
    } else {
      // Create new appointment usando mutation otimista
      result = await mutate('/api/appointments', submitData)
    }

    // Se sucesso, fecha o modal
    if (result) {
      onClose()
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Paciente
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Selecionar Paciente *
                    </label>
                    <PatientAutocomplete
                      value={formData.patientId}
                      onChange={(patientId, patient) => {
                        handleChange('patientId', patientId)
                        // If it's a new patient, we might want to refresh the parent list
                        if (patient && onPatientsRefresh) {
                          onPatientsRefresh()
                        }
                      }}
                      patients={currentPatients}
                      onPatientsRefresh={async () => {
                        await refetchPatients()
                        if (onPatientsRefresh) {
                          onPatientsRefresh()
                        }
                      }}
                      error={errors.patientId}
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-green-600" />
                    Data e Hora
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Data e Hora *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.appointmentDate}
                        onChange={(e) => handleChange('appointmentDate', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.appointmentDate ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      />
                      {errors.appointmentDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.appointmentDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Duração (minutos) *
                      </label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                        min="15"
                        step="15"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.duration ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      />
                      {errors.duration && (
                        <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-purple-600" />
                    Detalhes do Agendamento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tipo de Consulta *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {appointmentTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Serviço/Especialidade
                    </label>
                    <input
                      type="text"
                      value={formData.service}
                      onChange={(e) => handleChange('service', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Ex: Fisioterapia Ortopédica, RPG, Pilates..."
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-orange-600" />
                    Observações
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notas e Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Observações sobre o agendamento, preparos necessários, etc."
                    />
                  </div>
                </div>

                {/* Recurring Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    Recorrência
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isRecurring}
                        onChange={(e) => handleChange('isRecurring', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Agendamento recorrente
                      </span>
                    </label>

                    {formData.isRecurring && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Padrão de Recorrência
                        </label>
                        <select
                          value={formData.recurringPattern}
                          onChange={(e) => handleChange('recurringPattern', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="">Selecione o padrão</option>
                          <option value="weekly">Semanal</option>
                          <option value="biweekly">Quinzenal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : (appointment ? 'Atualizar' : 'Agendar')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
