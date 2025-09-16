import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, History, User, Calendar } from 'lucide-react'
import { Layout } from '../components/Layout'
import { BodyMapAdvanced } from '../components/BodyMapAdvanced'
import { PainTimeline } from '../components/PainTimeline'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'

interface PainPoint {
  id?: number
  bodyPart: string
  xCoordinate: number
  yCoordinate: number
  painLevel: number
  description?: string
  notes?: string
  imageUrl?: string
  sessionDate: string
}

interface BodyMapSession {
  id?: number
  patientId: number
  sessionDate: string
  sessionType: string
  generalNotes?: string
  overallPainLevel?: number
  painPoints: PainPoint[]
}

interface Patient {
  id: number
  name: string
  phone: string
  email?: string
  birthDate: string
  gender: string
}

export default function BodyMap() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [currentSession, setCurrentSession] = useState<BodyMapSession | null>(null)
  const [sessions, setSessions] = useState<BodyMapSession[]>([])
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [activeTab, setActiveTab] = useState<'current' | 'timeline'>('current')
  const [isLoading, setIsLoading] = useState(true)
  const [generalNotes, setGeneralNotes] = useState('')
  const [overallPainLevel, setOverallPainLevel] = useState<number>(5)

  const authFetch = useAuthenticatedFetch()
  const showNotification = useNotifications()

  useEffect(() => {
    if (patientId) {
      loadPatientData()
      loadSessions()
    }
  }, [patientId])

  const loadPatientData = async () => {
    try {
      const response = await authFetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data.patient)
      }
    } catch (error) {
      showNotification.error('Erro ao carregar dados do paciente')
    }
  }

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const response = await authFetch(`/api/patients/${patientId}/body-map-sessions`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        
        // Get current session or create new one
        const today = new Date().toISOString().split('T')[0]
        const todaySession = data.sessions?.find((s: BodyMapSession) => s.sessionDate === today)
        
        if (todaySession) {
          setCurrentSession(todaySession)
          setPainPoints(todaySession.painPoints || [])
          setGeneralNotes(todaySession.generalNotes || '')
          setOverallPainLevel(todaySession.overallPainLevel || 5)
        } else {
          // Create new session for today
          const newSession: BodyMapSession = {
            patientId: parseInt(patientId!),
            sessionDate: today,
            sessionType: 'ASSESSMENT',
            painPoints: []
          }
          setCurrentSession(newSession)
          setPainPoints([])
        }
      }
    } catch (error) {
      showNotification.error('Erro ao carregar sessões')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePainPoint = async (painPoint: Omit<PainPoint, 'sessionDate'>) => {
    try {
      const response = await authFetch('/api/pain-points', {
        method: painPoint.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...painPoint,
          patientId: parseInt(patientId!),
          sessionId: currentSession?.id,
          sessionDate: new Date().toISOString().split('T')[0]
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (painPoint.id) {
          // Update existing pain point
          setPainPoints(prev => prev.map(pp => pp.id === painPoint.id ? data.painPoint : pp))
        } else {
          // Add new pain point
          setPainPoints(prev => [...prev, data.painPoint])
        }
      }
    } catch (error) {
      throw new Error('Erro ao salvar ponto de dor')
    }
  }

  const handleDeletePainPoint = async (id: number) => {
    try {
      const response = await authFetch(`/api/pain-points/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPainPoints(prev => prev.filter(pp => pp.id !== id))
      }
    } catch (error) {
      throw new Error('Erro ao remover ponto de dor')
    }
  }

  const handleSaveSession = async () => {
    try {
      const sessionData = {
        ...currentSession,
        generalNotes,
        overallPainLevel,
        painPoints
      }

      const response = await authFetch('/api/body-map-sessions', {
        method: currentSession?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
        await loadSessions() // Reload sessions to update timeline
        showNotification.success('Sessão salva com sucesso')
      }
    } catch (error) {
      throw new Error('Erro ao salvar sessão')
    }
  }

  const handleViewSession = async (sessionId: number) => {
    try {
      const response = await authFetch(`/api/body-map-sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
        setPainPoints(data.session.painPoints || [])
        setGeneralNotes(data.session.generalNotes || '')
        setOverallPainLevel(data.session.overallPainLevel || 5)
        setActiveTab('current')
      }
    } catch (error) {
      showNotification.error('Erro ao carregar sessão')
    }
  }

  const formatAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    return age
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/patients')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Mapa Corporal - {patient?.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {formatAge(patient?.birthDate || '')} anos
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={activeTab === 'current' ? 'default' : 'outline'}
              onClick={() => setActiveTab('current')}
            >
              Sessão Atual
            </Button>
            <Button
              variant={activeTab === 'timeline' ? 'default' : 'outline'}
              onClick={() => setActiveTab('timeline')}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {activeTab === 'current' ? (
            <motion.div
              key="current"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-6"
            >
              {/* Body Map */}
              <div className="xl:col-span-2">
                <BodyMapAdvanced
                  patientId={parseInt(patientId!)}
                  sessionId={currentSession?.id}
                  painPoints={painPoints}
                  onSavePainPoint={handleSavePainPoint}
                  onDeletePainPoint={handleDeletePainPoint}
                  onSaveSession={handleSaveSession}
                />
              </div>

              {/* Session Details */}
              <div className="space-y-6">
                {/* Session Info */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Informações da Sessão
                  </h3>

                  <div className="space-y-4">
                    {/* Overall Pain Level */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nível Geral de Dor (0-10)
                      </label>
                      <div className="grid grid-cols-11 gap-1">
                        {Array.from({ length: 11 }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setOverallPainLevel(i)}
                            className={`
                              h-8 rounded text-xs font-medium transition-all
                              ${overallPainLevel === i 
                                ? 'ring-2 ring-offset-2 ring-slate-400 transform scale-110' 
                                : 'hover:scale-105'
                              }
                            `}
                            style={{
                              backgroundColor: i <= 2 ? '#22c55e' : i <= 5 ? '#f59e0b' : i <= 8 ? '#f97316' : '#ef4444',
                              color: '#ffffff'
                            }}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* General Notes */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Observações Gerais
                      </label>
                      <textarea
                        value={generalNotes}
                        onChange={(e) => setGeneralNotes(e.target.value)}
                        placeholder="Observações sobre a sessão..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </Card>

                {/* Session Summary */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Resumo da Sessão
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pontos de dor:</span>
                      <Badge variant="secondary">{painPoints.length}</Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dor média:</span>
                      <Badge variant="secondary">
                        {painPoints.length > 0 
                          ? (painPoints.reduce((acc, p) => acc + p.painLevel, 0) / painPoints.length).toFixed(1)
                          : '0'
                        }/10
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dor máxima:</span>
                      <Badge variant="secondary">
                        {painPoints.length > 0 
                          ? Math.max(...painPoints.map(p => p.painLevel))
                          : '0'
                        }/10
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveSession}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Sessão
                  </Button>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PainTimeline
                patientId={parseInt(patientId!)}
                timelineData={sessions.map(session => ({
                  id: session.id!,
                  sessionDate: session.sessionDate,
                  overallPainLevel: session.overallPainLevel || 0,
                  painPoints: session.painPoints.map(point => ({
                    id: point.id!,
                    bodyPart: point.bodyPart,
                    painLevel: point.painLevel,
                    description: point.description
                  })),
                  notes: session.generalNotes
                }))}
                onViewSession={handleViewSession}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
