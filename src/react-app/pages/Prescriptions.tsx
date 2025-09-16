import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Send,
  User,
  Calendar,
  Clock,
  Printer
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { PrescriptionForm } from '@/react-app/components/PrescriptionForm'

import { formatDate } from '@/lib/utils'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { PageSkeleton } from '@/react-app/components/PageSkeleton'

interface PrescriptionType {
  id: number
  patientId: number
  patientName: string
  title: string
  description: string
  exercises: Array<{
    exerciseId: number
    exerciseName: string
    sets: number
    reps: string
    duration: number
    frequency: string
    notes: string
  }>
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED'
  notes: string
  createdAt: string
  updatedAt: string
}

export default function Prescriptions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState<PrescriptionType | undefined>(undefined)
  const authenticatedFetch = useAuthenticatedFetch()

  // Fetch prescriptions with optimized authenticated caching
  const { 
    data: prescriptionsData, 
    loading: prescriptionsLoading,
    isRevalidating: prescriptionsRevalidating,
    refetch: refetchPrescriptions 
  } = useOptimizedAuthFetch<PrescriptionType[]>('prescriptions', '/api/prescriptions', {
    staleTime: 2 * 60 * 1000, // 2 minutes fresh
    cacheTime: 10 * 60 * 1000, // 10 minutes total cache
    refetchOnWindowFocus: true
  })

  // Fetch patients with optimized authenticated caching
  const { 
    data: patientsData, 
    loading: patientsLoading 
  } = useOptimizedAuthFetch<any[]>('patients', '/api/patients', {
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    cacheTime: 15 * 60 * 1000 // 15 minutes total cache
  })

  // Fetch exercises with optimized authenticated caching
  const { 
    data: exercisesData, 
    loading: exercisesLoading 
  } = useOptimizedAuthFetch<any[]>('exercises', '/api/exercises', {
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    cacheTime: 15 * 60 * 1000 // 15 minutes total cache
  })

  const loading = prescriptionsLoading || patientsLoading || exercisesLoading

  // Ensure we always have arrays to work with
  const prescriptions = prescriptionsData || []
  const patients = patientsData || []
  const exercises = exercisesData || []

  

  const handleSavePrescription = async (prescriptionData: any) => {
    try {
      const url = editingPrescription ? `/api/prescriptions/${editingPrescription.id}` : '/api/prescriptions'
      const method = editingPrescription ? 'PUT' : 'POST'
      
      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(prescriptionData),
      })

      const result = await response.json()
      
      if (result.success) {
        await refetchPrescriptions()
        setShowForm(false)
        setEditingPrescription(undefined)
      } else {
        console.error('Failed to save prescription:', result.error)
      }
    } catch (error) {
      console.error('Error saving prescription:', error)
    }
  }

  const handleEditPrescription = (prescription: PrescriptionType) => {
    setEditingPrescription(prescription)
    setShowForm(true)
  }

  const handleDeletePrescription = async (prescriptionId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta prescrição?')) {
      return
    }

    try {
      const response = await authenticatedFetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        await refetchPrescriptions()
      } else {
        console.error('Failed to delete prescription:', result.error)
      }
    } catch (error) {
      console.error('Error deleting prescription:', error)
    }
  }

  const handleNewPrescription = () => {
    setEditingPrescription(undefined)
    setShowForm(true)
  }

  const filteredPrescriptions = prescriptions.filter((prescription: PrescriptionType) => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || prescription.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    PAUSED: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }

  const statusLabels = {
    ACTIVE: 'Ativo',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    PAUSED: 'Pausado'
  }

  // Memoize expensive computations
  const prescriptionStats = useMemo(() => ({
    total: prescriptions.length,
    active: prescriptions.filter((p: PrescriptionType) => p.status === 'ACTIVE').length,
    completed: prescriptions.filter((p: PrescriptionType) => p.status === 'COMPLETED').length,
    paused: prescriptions.filter((p: PrescriptionType) => p.status === 'PAUSED').length,
  }), [prescriptions])

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão de Prescrições
          </h1>
          <p className="text-slate-600 mt-1">
            Crie e gerencie protocolos de exercícios personalizados
            {prescriptionsRevalidating && <span className="text-blue-500 ml-2">• Atualizando...</span>}
          </p>
        </div>
        <Button 
          onClick={handleNewPrescription}
          className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Prescrição
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total de Prescrições</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{prescriptionStats.total}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Ativas</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{prescriptionStats.active}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Concluídas</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{prescriptionStats.completed}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Pausadas</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{prescriptionStats.paused}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por paciente, título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="all">Todos os Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="PAUSED">Pausado</option>
          </select>
          
          <Button variant="outline" className="shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </motion.div>

      {/* Prescriptions List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        {filteredPrescriptions.map((prescription: PrescriptionType, index: number) => (
          <motion.div
            key={prescription.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{prescription.title}</h3>
                        <Badge className={statusColors[prescription.status as keyof typeof statusColors]}>
                          {statusLabels[prescription.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {prescription.patientName}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(prescription.startDate)} - {formatDate(prescription.endDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {prescription.exercises.length} exercício{prescription.exercises.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{prescription.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" title="Visualizar">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Imprimir">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Enviar">
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Download">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEditPrescription(prescription)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeletePrescription(prescription.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Exercises Preview */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Exercícios Prescritos:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {prescription.exercises.slice(0, 3).map((exercise: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3">
                        <h5 className="font-medium text-slate-900 text-sm">{exercise.exerciseName}</h5>
                        <div className="text-xs text-slate-600 mt-1">
                          {exercise.sets} séries × {exercise.reps} | {exercise.frequency}
                        </div>
                        {exercise.notes && (
                          <p className="text-xs text-slate-500 mt-1">{exercise.notes}</p>
                        )}
                      </div>
                    ))}
                    {prescription.exercises.length > 3 && (
                      <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-center">
                        <span className="text-sm text-slate-500">
                          +{prescription.exercises.length - 3} exercício{prescription.exercises.length - 3 !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {prescription.notes && (
                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Observações:</h4>
                    <p className="text-sm text-slate-600">{prescription.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Prescription Form Modal */}
      <PrescriptionForm
        prescription={editingPrescription}
        patients={patients}
        exercises={exercises}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingPrescription(undefined)
        }}
        onSave={handleSavePrescription}
      />

      {filteredPrescriptions.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.6 }}
          className="text-center py-12"
        >
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma prescrição encontrada</h3>
          <p className="text-slate-600 mb-6">
            {searchTerm || selectedStatus !== 'all' 
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece criando sua primeira prescrição de exercícios'}
          </p>
          <Button 
            onClick={handleNewPrescription}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Prescrição
          </Button>
        </motion.div>
      )}
    </div>
  )
}
