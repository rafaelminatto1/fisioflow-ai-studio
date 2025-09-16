import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, FileText, Calendar, Clock, User } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'

interface ConsultationFormProps {
  isOpen: boolean
  onClose: () => void
  patientId: number
  patientName: string
  appointmentId?: number
  onConsultationSaved: () => void
}

export function ConsultationForm({ 
  isOpen, 
  onClose, 
  patientId, 
  patientName, 
  appointmentId,
  onConsultationSaved 
}: ConsultationFormProps) {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionDuration, setSessionDuration] = useState(60)
  const [mainComplaint, setMainComplaint] = useState('')
  const [anamnesis, setAnamnesis] = useState('')
  const [physicalExam, setPhysicalExam] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setSessionDate(new Date().toISOString().split('T')[0])
      setSessionDuration(60)
      setMainComplaint('')
      setAnamnesis('')
      setPhysicalExam('')
      setDiagnosis('')
      setTreatmentPlan('')
      setNotes('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mainComplaint.trim()) {
      error('Queixa principal é obrigatória')
      return
    }

    try {
      setLoading(true)

      const response = await authFetch('/api/consultation-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          appointmentId: appointmentId || null,
          sessionDate,
          sessionDuration,
          mainComplaint: mainComplaint.trim(),
          anamnesis: anamnesis.trim() || null,
          physicalExam: physicalExam.trim() || null,
          diagnosis: diagnosis.trim() || null,
          treatmentPlan: treatmentPlan.trim() || null,
          notes: notes.trim() || null
        })
      })

      if (response.ok) {
        success('Consulta registrada com sucesso')
        onConsultationSaved()
        onClose()
      } else {
        const data = await response.json()
        error(data.error || 'Erro ao registrar consulta')
      }
    } catch (err) {
      error('Erro ao registrar consulta')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Nova Consulta - Prontuário
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-slate-600">
              Paciente: <span className="font-medium">{patientName}</span>
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data da Sessão *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duração (minutos)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="number"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(Number(e.target.value))}
                      min="15"
                      max="180"
                      step="15"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paciente
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={patientName}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Main Complaint */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Queixa Principal *
                </label>
                <textarea
                  value={mainComplaint}
                  onChange={(e) => setMainComplaint(e.target.value)}
                  placeholder="Descreva a queixa principal do paciente..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  required
                />
              </div>

              {/* Anamnesis */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Anamnese
                </label>
                <textarea
                  value={anamnesis}
                  onChange={(e) => setAnamnesis(e.target.value)}
                  placeholder="História da doença atual, antecedentes, medicações em uso..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Physical Exam */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Exame Físico
                </label>
                <textarea
                  value={physicalExam}
                  onChange={(e) => setPhysicalExam(e.target.value)}
                  placeholder="Inspeção, palpação, testes especiais, amplitude de movimento..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Diagnóstico Fisioterapêutico
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Diagnóstico baseado na avaliação realizada..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Plano de Tratamento
                </label>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Objetivos, condutas, exercícios, recursos utilizados..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Orientações ao paciente, próximos passos, observações gerais..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Salvar Consulta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
