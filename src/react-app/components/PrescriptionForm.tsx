import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, User, Plus, Trash2, Dumbbell } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { PatientType, ExerciseType } from '@/shared/types'

interface PrescriptionFormProps {
  prescription?: any
  patients: PatientType[]
  exercises: ExerciseType[]
  isOpen: boolean
  onClose: () => void
  onSave: (prescriptionData: any) => void
}

interface ExercisePrescription {
  exerciseId: number
  exerciseName: string
  sets: number
  reps: string
  duration: number
  frequency: string
  notes: string
}

export function PrescriptionForm({ prescription, patients, exercises, isOpen, onClose, onSave }: PrescriptionFormProps) {
  const [formData, setFormData] = useState({
    patientId: 0,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    notes: '',
    exercises: [] as ExercisePrescription[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (prescription) {
      setFormData({
        patientId: prescription.patientId || 0,
        title: prescription.title || '',
        description: prescription.description || '',
        startDate: prescription.startDate || '',
        endDate: prescription.endDate || '',
        status: prescription.status || 'ACTIVE',
        notes: prescription.notes || '',
        exercises: prescription.exercises || []
      })
    } else {
      // Set default start date to today and end date to 3 months from now
      const today = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)
      
      setFormData({
        patientId: 0,
        title: '',
        description: '',
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'ACTIVE',
        notes: '',
        exercises: []
      })
    }
    setErrors({})
  }, [prescription, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patientId) {
      newErrors.patientId = 'Selecione um paciente'
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Data de fim é obrigatória'
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início'
    }

    if (formData.exercises.length === 0) {
      newErrors.exercises = 'Adicione pelo menos um exercício'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        patientId: Number(formData.patientId)
      }
      await onSave(submitData)
    } catch (error) {
      console.error('Error saving prescription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addExercise = () => {
    const newExercise: ExercisePrescription = {
      exerciseId: 0,
      exerciseName: '',
      sets: 1,
      reps: '',
      duration: 0,
      frequency: '',
      notes: ''
    }
    
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
  }

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const updateExercise = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => {
        if (i === index) {
          const updated = { ...exercise, [field]: value }
          
          // Auto-fill exercise name when exercise is selected
          if (field === 'exerciseId') {
            const selectedExercise = exercises.find(ex => ex.id === parseInt(value))
            if (selectedExercise) {
              updated.exerciseName = selectedExercise.name
              updated.duration = selectedExercise.duration || 0
            }
          }
          
          return updated
        }
        return exercise
      })
    }))
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
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {prescription ? 'Editar Prescrição' : 'Nova Prescrição'}
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
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Informações Básicas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Paciente *
                      </label>
                      <select
                        value={formData.patientId}
                        onChange={(e) => handleChange('patientId', parseInt(e.target.value))}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.patientId ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      >
                        <option value={0}>Selecione um paciente</option>
                        {patients.map(patient => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name}
                          </option>
                        ))}
                      </select>
                      {errors.patientId && (
                        <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>
                      )}
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
                        <option value="ACTIVE">Ativo</option>
                        <option value="COMPLETED">Concluído</option>
                        <option value="PAUSED">Pausado</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Título do Protocolo *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.title ? 'border-red-300' : 'border-slate-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      placeholder="Ex: Protocolo de Reabilitação Lombar"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descrição *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.description ? 'border-red-300' : 'border-slate-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none`}
                      placeholder="Descreva o objetivo e características do protocolo"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Data de Início *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.startDate ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Data de Fim *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.endDate ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exercises */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Dumbbell className="w-5 h-5 mr-2 text-green-600" />
                      Exercícios
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExercise}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Exercício
                    </Button>
                  </div>

                  {errors.exercises && (
                    <p className="text-red-500 text-sm">{errors.exercises}</p>
                  )}

                  <div className="space-y-4">
                    {formData.exercises.map((exercise, index) => (
                      <Card key={index} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="font-medium text-slate-900">Exercício {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Exercício
                              </label>
                              <select
                                value={exercise.exerciseId}
                                onChange={(e) => updateExercise(index, 'exerciseId', parseInt(e.target.value))}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              >
                                <option value={0}>Selecione um exercício</option>
                                {exercises.map(ex => (
                                  <option key={ex.id} value={ex.id}>
                                    {ex.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Séries
                              </label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                                min="1"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Repetições
                              </label>
                              <input
                                type="text"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                placeholder="Ex: 10-15, 30s"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Duração (min)
                              </label>
                              <input
                                type="number"
                                value={exercise.duration}
                                onChange={(e) => updateExercise(index, 'duration', parseInt(e.target.value) || 0)}
                                min="0"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Frequência
                              </label>
                              <input
                                type="text"
                                value={exercise.frequency}
                                onChange={(e) => updateExercise(index, 'frequency', e.target.value)}
                                placeholder="Ex: 2x ao dia, 3x por semana"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Observações
                              </label>
                              <textarea
                                value={exercise.notes}
                                onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                                rows={2}
                                placeholder="Instruções específicas para este exercício"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {formData.exercises.length === 0 && (
                      <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-3">Nenhum exercício adicionado</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addExercise}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeiro Exercício
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Observações Gerais
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notas e Orientações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Orientações gerais sobre o protocolo, progressões, cuidados especiais, etc."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : (prescription ? 'Atualizar' : 'Criar Prescrição')}
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
