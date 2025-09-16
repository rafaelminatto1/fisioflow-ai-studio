import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, Clock, Edit, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'
import { ConsultationForm } from './ConsultationForm'
import { formatDate } from '@/lib/utils'

interface ConsultationRecord {
  id: number
  patientId: number
  appointmentId?: number
  sessionDate: string
  sessionDuration: number
  mainComplaint: string
  anamnesis?: string
  physicalExam?: string
  diagnosis?: string
  treatmentPlan?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface ConsultationHistoryProps {
  patientId: number
  patientName: string
}

export function ConsultationHistory({ patientId, patientName }: ConsultationHistoryProps) {
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showConsultationForm, setShowConsultationForm] = useState(false)
  const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(3)

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  useEffect(() => {
    loadConsultations()
  }, [patientId])

  const loadConsultations = async () => {
    try {
      setLoading(true)
      const response = await authFetch(`/api/patients/${patientId}/consultations`)
      
      if (response.ok) {
        const data = await response.json()
        setConsultations(data.data || [])
      }
    } catch (err) {
      error('Erro ao carregar consultas')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConsultation = async (consultationId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta consulta?')) return

    try {
      const response = await authFetch(`/api/consultation-records/${consultationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        success('Consulta excluída com sucesso')
        loadConsultations()
      } else {
        const data = await response.json()
        error(data.error || 'Erro ao excluir consulta')
      }
    } catch (err) {
      error('Erro ao excluir consulta')
    }
  }

  const handleConsultationSaved = () => {
    loadConsultations()
    setShowConsultationForm(false)
  }

  const toggleExpanded = (consultationId: number) => {
    setExpandedConsultation(expandedConsultation === consultationId ? null : consultationId)
  }

  const visibleConsultations = consultations.slice(0, visibleCount)
  const hasMore = consultations.length > visibleCount

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Histórico de Consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Histórico de Consultas
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowConsultationForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {consultations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">Nenhuma consulta registrada</p>
              <Button
                onClick={() => setShowConsultationForm(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primeira Consulta
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleConsultations.map((consultation, index) => (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
                >
                  {/* Header */}
                  <div className="p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(consultation.sessionDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{consultation.sessionDuration} min</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Consulta #{consultation.id}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(consultation.id)}
                        >
                          {expandedConsultation === consultation.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {expandedConsultation === consultation.id ? 'Menos' : 'Mais'}
                        </Button>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar consulta"
                            className="h-8 w-8"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteConsultation(consultation.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            title="Excluir consulta"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Main Complaint Preview */}
                    <div className="mt-3">
                      <h4 className="font-medium text-slate-900 mb-1">Queixa Principal</h4>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {consultation.mainComplaint}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedConsultation === consultation.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 border-t border-slate-200"
                    >
                      <div className="grid grid-cols-1 gap-4">
                        {consultation.anamnesis && (
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Anamnese</h5>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {consultation.anamnesis}
                            </p>
                          </div>
                        )}

                        {consultation.physicalExam && (
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Exame Físico</h5>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {consultation.physicalExam}
                            </p>
                          </div>
                        )}

                        {consultation.diagnosis && (
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Diagnóstico</h5>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {consultation.diagnosis}
                            </p>
                          </div>
                        )}

                        {consultation.treatmentPlan && (
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Plano de Tratamento</h5>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {consultation.treatmentPlan}
                            </p>
                          </div>
                        )}

                        {consultation.notes && (
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Observações</h5>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {consultation.notes}
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            Registrado em {formatDate(consultation.createdAt)}
                            {consultation.updatedAt !== consultation.createdAt && 
                              ` • Atualizado em ${formatDate(consultation.updatedAt)}`
                            }
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(prev => prev + 5)}
                  >
                    Carregar mais consultas ({consultations.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConsultationForm
        isOpen={showConsultationForm}
        onClose={() => setShowConsultationForm(false)}
        patientId={patientId}
        patientName={patientName}
        onConsultationSaved={handleConsultationSaved}
      />
    </>
  )
}
