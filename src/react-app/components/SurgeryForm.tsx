import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Scissors, Calendar } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'

interface SurgeryFormProps {
  isOpen: boolean
  onClose: () => void
  patientId: number
  patientName: string
  editingSurgery?: {
    id: number
    surgeryName: string
    surgeryDate: string
    notes?: string
  } | null
  onSurgeryUpdated: () => void
}

export function SurgeryForm({ 
  isOpen, 
  onClose, 
  patientId, 
  patientName, 
  editingSurgery, 
  onSurgeryUpdated 
}: SurgeryFormProps) {
  const [surgeryName, setSurgeryName] = useState('')
  const [surgeryDate, setSurgeryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  useEffect(() => {
    if (editingSurgery) {
      setSurgeryName(editingSurgery.surgeryName)
      setSurgeryDate(editingSurgery.surgeryDate)
      setNotes(editingSurgery.notes || '')
    } else {
      resetForm()
    }
  }, [editingSurgery])

  const resetForm = () => {
    setSurgeryName('')
    setSurgeryDate('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!surgeryName.trim()) {
      error('Nome da cirurgia é obrigatório')
      return
    }

    if (!surgeryDate) {
      error('Data da cirurgia é obrigatória')
      return
    }

    try {
      setLoading(true)

      const url = editingSurgery ? `/api/surgeries/${editingSurgery.id}` : '/api/surgeries'
      const method = editingSurgery ? 'PUT' : 'POST'

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          surgeryName: surgeryName.trim(),
          surgeryDate,
          notes: notes.trim() || undefined
        })
      })

      if (response.ok) {
        success(editingSurgery ? 'Cirurgia atualizada com sucesso' : 'Cirurgia cadastrada com sucesso')
        onSurgeryUpdated()
        onClose()
        resetForm()
      } else {
        const data = await response.json()
        error(data.error || 'Erro ao salvar cirurgia')
      }
    } catch (err) {
      error('Erro ao salvar cirurgia')
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
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
      >
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-purple-600" />
                {editingSurgery ? 'Editar Cirurgia' : 'Nova Cirurgia'}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Surgery Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da Cirurgia *
                </label>
                <input
                  type="text"
                  value={surgeryName}
                  onChange={(e) => setSurgeryName(e.target.value)}
                  placeholder="Ex: Artroscopia de Joelho Direito"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              {/* Surgery Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data da Cirurgia *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                {surgeryDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(surgeryDate) <= new Date() 
                      ? `${Math.floor((new Date().getTime() - new Date(surgeryDate).getTime()) / (1000 * 60 * 60 * 24))} dias pós-operatório`
                      : `Cirurgia agendada para ${Math.floor((new Date(surgeryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias`
                    }
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observações (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre a cirurgia..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
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
                  {editingSurgery ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
