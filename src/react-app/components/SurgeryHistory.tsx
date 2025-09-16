import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Scissors, Calendar, Edit, Trash2, Plus, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'
import { SurgeryForm } from './SurgeryForm'

interface Surgery {
  id: number
  patientId: number
  surgeryName: string
  surgeryDate: string
  notes?: string
  postOpInfo: {
    days: number
    weeks: number
    isPostOp: boolean
    displayText: string
  }
  createdAt: string
  updatedAt: string
}

interface SurgeryHistoryProps {
  patientId: number
  patientName: string
}

export function SurgeryHistory({ patientId, patientName }: SurgeryHistoryProps) {
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loading, setLoading] = useState(true)
  const [showSurgeryForm, setShowSurgeryForm] = useState(false)
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null)

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  useEffect(() => {
    loadSurgeries()
  }, [patientId])

  const loadSurgeries = async () => {
    try {
      setLoading(true)
      const response = await authFetch(`/api/patients/${patientId}/surgeries`)
      
      if (response.ok) {
        const data = await response.json()
        setSurgeries(data.data || [])
      }
    } catch (err) {
      error('Erro ao carregar cirurgias')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSurgery = async (surgeryId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta cirurgia?')) return

    try {
      const response = await authFetch(`/api/surgeries/${surgeryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        success('Cirurgia excluída com sucesso')
        loadSurgeries()
      } else {
        const data = await response.json()
        error(data.error || 'Erro ao excluir cirurgia')
      }
    } catch (err) {
      error('Erro ao excluir cirurgia')
    }
  }

  const handleEditSurgery = (surgery: Surgery) => {
    setEditingSurgery(surgery)
    setShowSurgeryForm(true)
  }

  const handleSurgeryUpdated = () => {
    loadSurgeries()
    setEditingSurgery(null)
  }

  const formatPostOpTime = (surgery: Surgery) => {
    const surgeryDate = new Date(surgery.surgeryDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - surgeryDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    
    if (surgeryDate > now) {
      return {
        text: `Cirurgia em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Calendar
      }
    } else {
      return {
        text: `${diffDays} dia${diffDays !== 1 ? 's' : ''} pós-op (${diffWeeks} semana${diffWeeks !== 1 ? 's' : ''})`,
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Clock
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-purple-600" />
            Histórico Cirúrgico
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
              <Scissors className="w-5 h-5 text-purple-600" />
              Histórico Cirúrgico
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowSurgeryForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cirurgia
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {surgeries.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">Nenhuma cirurgia cadastrada</p>
              <Button
                onClick={() => setShowSurgeryForm(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeira Cirurgia
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {surgeries.map((surgery, index) => {
                const postOpInfo = formatPostOpTime(surgery)
                const PostOpIcon = postOpInfo.icon
                
                return (
                  <motion.div
                    key={surgery.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-slate-900">
                            {surgery.surgeryName}
                          </h4>
                          <Badge className={postOpInfo.color}>
                            <PostOpIcon className="w-3 h-3 mr-1" />
                            {postOpInfo.text}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(surgery.surgeryDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {surgery.notes && (
                          <p className="text-sm text-slate-600 mt-2">
                            {surgery.notes}
                          </p>
                        )}
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSurgery(surgery)}
                          title="Editar cirurgia"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSurgery(surgery.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Excluir cirurgia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SurgeryForm
        isOpen={showSurgeryForm}
        onClose={() => {
          setShowSurgeryForm(false)
          setEditingSurgery(null)
        }}
        patientId={patientId}
        patientName={patientName}
        editingSurgery={editingSurgery}
        onSurgeryUpdated={handleSurgeryUpdated}
      />
    </>
  )
}
