import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { 
  FileText, 
  User, 
  Calendar,
  Clock,
  ArrowLeft,
  Save,
  Activity,
  Scissors,
  Clipboard
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { formatDate, formatTime, calculateAge } from '@/lib/utils'

export default function Consultation() {
  const { patientId, appointmentId } = useParams()
  const navigate = useNavigate()
  const authenticatedFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  const [activeTab, setActiveTab] = useState('consultation')
  const [consultationRecord, setConsultationRecord] = useState<any>(null)
  const [isCreatingRecord, setIsCreatingRecord] = useState(false)

  // Fetch patient data
  const { 
    data: patient,
    loading: patientLoading 
  } = useOptimizedAuthFetch<any>(`patient-${patientId}`, `/api/patients/${patientId}`)

  // Fetch appointment data
  const { 
    data: appointment,
    loading: appointmentLoading 
  } = useOptimizedAuthFetch<any>(`appointment-${appointmentId}`, `/api/appointments/${appointmentId}`)

  // Fetch existing consultation record for this appointment
  const { 
    data: existingRecord,
    loading: recordLoading,
    refetch: refetchRecord
  } = useOptimizedAuthFetch<any>(
    `consultation-record-${appointmentId}`, 
    `/api/appointments/${appointmentId}/consultation-record`
  )

  // Fetch patient's recent surgeries
  const { 
    data: surgeries 
  } = useOptimizedAuthFetch<any[]>(`patient-surgeries-${patientId}`, `/api/patients/${patientId}/surgeries`)

  useEffect(() => {
    if (existingRecord?.data) {
      setConsultationRecord(existingRecord.data)
    }
  }, [existingRecord])

  const handleSaveConsultation = async (consultationData: any) => {
    try {
      setIsCreatingRecord(true)

      if (consultationRecord) {
        // Update existing record
        const response = await authenticatedFetch(`/api/consultation-records/${consultationRecord.id}`, {
          method: 'PUT',
          body: JSON.stringify(consultationData),
        })
        const result = await response.json()
        if (result.success) {
          setConsultationRecord(result.data)
          success('Prontuário atualizado com sucesso!')
        } else {
          error('Erro ao atualizar prontuário')
        }
      } else {
        // Create new record
        const response = await authenticatedFetch('/api/consultation-records', {
          method: 'POST',
          body: JSON.stringify({
            ...consultationData,
            patientId: parseInt(patientId!),
            appointmentId: appointmentId ? parseInt(appointmentId) : null,
            sessionDate: appointment?.appointmentDate?.split('T')[0] || new Date().toISOString().split('T')[0]
          }),
        })
        const result = await response.json()
        if (result.success) {
          setConsultationRecord(result.data)
          await refetchRecord()
          success('Prontuário criado com sucesso!')
        } else {
          error('Erro ao criar prontuário')
        }
      }
    } catch (err) {
      console.error('Error saving consultation:', err)
      error('Erro ao salvar prontuário')
    } finally {
      setIsCreatingRecord(false)
    }
  }

  const handleFinishConsultation = async () => {
    if (consultationRecord && appointmentId) {
      try {
        // Update appointment status to COMPLETED
        const response = await authenticatedFetch(`/api/appointments/${appointmentId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'COMPLETED' }),
        })
        
        if (response.ok) {
          success('Atendimento finalizado com sucesso!')
          navigate(`/patients/${patientId}`)
        } else {
          error('Erro ao finalizar atendimento')
        }
      } catch (err) {
        console.error('Error finishing consultation:', err)
        error('Erro ao finalizar atendimento')
      }
    } else {
      error('É necessário salvar o prontuário antes de finalizar')
    }
  }

  if (patientLoading || appointmentLoading || recordLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-200 rounded-lg w-80 animate-pulse"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!patient || !appointment) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Consulta não encontrada</h3>
        <Button onClick={() => navigate('/appointments')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Agendamentos
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'consultation', label: 'Prontuário', icon: FileText },
    { id: 'body-map', label: 'Mapa Corporal', icon: Activity }
  ]

  const appointmentDate = new Date(appointment.appointmentDate)
  const currentSurgery = surgeries?.find(surgery => {
    const surgeryDate = new Date(surgery.surgeryDate)
    return surgeryDate <= appointmentDate
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(`/patients/${patientId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Consulta - {patient.name}</h1>
              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(appointment.appointmentDate)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(appointment.appointmentDate)}
                </div>
                <Badge className={
                  appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {appointment.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {consultationRecord && (
            <Button 
              onClick={handleFinishConsultation}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Finalizar Atendimento
            </Button>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {activeTab === 'consultation' ? (
          <>
            {/* Main Consultation Form */}
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prontuário de Consulta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Queixa Principal
                      </label>
                      <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Descreva a queixa principal do paciente..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Anamnese
                      </label>
                      <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="História da doença atual, antecedentes pessoais..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Exame Físico
                      </label>
                      <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Inspeção, palpação, testes especiais..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Diagnóstico
                      </label>
                      <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Diagnóstico fisioterapêutico..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Plano de Tratamento
                      </label>
                      <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Objetivos e estratégias de tratamento..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Observações
                      </label>
                      <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Observações adicionais..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={() => handleSaveConsultation({})}
                        disabled={isCreatingRecord}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isCreatingRecord ? 'Salvando...' : 'Salvar Prontuário'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Patient Context */}
            <div className="space-y-6">
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informações do Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-600">Idade:</span>
                    <div className="font-medium">{calculateAge(patient.birthDate)} anos</div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Telefone:</span>
                    <div className="font-medium">{patient.phone}</div>
                  </div>
                  {patient.medicalHistory && (
                    <div>
                      <span className="text-sm text-slate-600">Histórico Médico:</span>
                      <div className="text-sm mt-1 p-2 bg-slate-50 rounded">
                        {patient.medicalHistory.slice(0, 100)}
                        {patient.medicalHistory.length > 100 && '...'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Surgery Context */}
              {currentSurgery && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-red-600" />
                      Contexto Pós-Operatório
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="font-medium text-slate-900">{currentSurgery.surgeryName}</div>
                      <div className="text-sm text-slate-600">
                        {formatDate(currentSurgery.surgeryDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
                        {currentSurgery.postOpInfo?.displayText}
                      </Badge>
                    </div>
                    {currentSurgery.notes && (
                      <div className="text-sm p-2 bg-slate-50 rounded">
                        {currentSurgery.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="w-5 h-5 text-green-600" />
                    Últimas Sessões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Histórico de consultas será exibido aqui
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          /* Body Map Tab */
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  Mapa Corporal - {formatDate(appointment.appointmentDate)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Mapa corporal será integrado aqui</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
