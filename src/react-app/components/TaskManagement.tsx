import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckSquare, 
  Clock, 
  Plus, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { Progress } from '@/react-app/components/ui/progress'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { TaskFilters } from './TaskFilters'
import { formatDate } from '@/lib/utils'

interface Task {
  id: number
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  due_date?: string
  assigned_to?: number
  patient_id?: number
  category: string
  progress: number
  created_at: string
  updated_at: string
}

interface TaskFormProps {
  task?: Task
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: any) => Promise<void>
}

function TaskForm({ task, isOpen, onClose, onSave }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    due_date: '',
    category: 'GENERAL',
    patient_id: ''
  })

  const { data: patients } = useOptimizedAuthFetch<any[]>('patients', '/api/patients')

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        category: task.category,
        patient_id: task.patient_id?.toString() || ''
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        due_date: '',
        category: 'GENERAL',
        patient_id: ''
      })
    }
  }, [task, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      patient_id: formData.patient_id ? parseInt(formData.patient_id) : null
    }
    await onSave(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="IN_PROGRESS">Em Progresso</option>
                    <option value="COMPLETED">Concluída</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GENERAL">Geral</option>
                    <option value="PATIENT_CARE">Cuidados com Paciente</option>
                    <option value="ADMINISTRATIVE">Administrativo</option>
                    <option value="EQUIPMENT">Equipamentos</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Paciente (Opcional)</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Não relacionado a paciente</option>
                  {patients?.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {task ? 'Atualizar' : 'Criar'} Tarefa
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export function TaskManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [selectedView, setSelectedView] = useState<'all' | 'urgent' | 'overdue' | 'today'>('all')

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  const { data: tasks, loading, refetch } = useOptimizedAuthFetch<Task[]>('tasks', '/api/tasks', {
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  const { data: patients } = useOptimizedAuthFetch<any[]>('patients', '/api/patients')

  const filteredTasks = (tasks || []).filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory
    const matchesPatient = selectedPatient === 'all' || task.patient_id?.toString() === selectedPatient

    // View filters
    let matchesView = true
    if (selectedView === 'urgent') {
      matchesView = task.priority === 'URGENT' && task.status !== 'COMPLETED'
    } else if (selectedView === 'overdue') {
      matchesView = Boolean(task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED')
    } else if (selectedView === 'today') {
      const today = new Date().toDateString()
      matchesView = Boolean(task.due_date && new Date(task.due_date).toDateString() === today)
    }

    return matchesSearch && matchesPriority && matchesStatus && matchesCategory && matchesPatient && matchesView
  })

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700'
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700'
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PUT' : 'POST'
      
      const response = await authFetch(url, {
        method,
        body: JSON.stringify(taskData),
      })

      const result = await response.json()
      
      if (result.success) {
        success(editingTask ? 'Tarefa atualizada!' : 'Tarefa criada!')
        await refetch()
        setShowForm(false)
        setEditingTask(undefined)
      } else {
        error(result.error || 'Erro ao salvar tarefa')
      }
    } catch (err) {
      error('Erro ao salvar tarefa')
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    try {
      const response = await authFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        success('Tarefa excluída!')
        await refetch()
      } else {
        error(result.error || 'Erro ao excluir tarefa')
      }
    } catch (err) {
      error('Erro ao excluir tarefa')
    }
  }

  const getPatientName = (patientId: number) => {
    const patient = patients?.find(p => p.id === patientId)
    return patient?.name || 'Paciente não encontrado'
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedPriority('all')
    setSelectedStatus('all')
    setSelectedCategory('all')
    setSelectedPatient('all')
    setSelectedView('all')
  }

  const taskStats = {
    total: tasks?.length || 0,
    pending: tasks?.filter(t => t.status === 'PENDING').length || 0,
    inProgress: tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0,
    completed: tasks?.filter(t => t.status === 'COMPLETED').length || 0,
    overdue: tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length || 0,
    urgentPending: tasks?.filter(t => t.priority === 'URGENT' && t.status !== 'COMPLETED').length || 0,
    dueSoon: tasks?.filter(t => {
      if (!t.due_date || t.status === 'COMPLETED') return false
      const dueDate = new Date(t.due_date)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return dueDate <= tomorrow && dueDate >= new Date()
    }).length || 0
  }

  const quickViewOptions = [
    { key: 'all', label: 'Todas', count: taskStats.total },
    { key: 'urgent', label: 'Urgentes', count: taskStats.urgentPending },
    { key: 'overdue', label: 'Atrasadas', count: taskStats.overdue },
    { key: 'today', label: 'Hoje', count: taskStats.dueSoon }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded animate-pulse"></div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Tarefas</h1>
          <p className="text-slate-600">Organize e acompanhe as tarefas da clínica</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </motion.div>

      {/* Quick View Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {quickViewOptions.map((option) => (
          <Button
            key={option.key}
            variant={selectedView === option.key ? "default" : "outline"}
            onClick={() => setSelectedView(option.key as any)}
            className="flex items-center gap-2"
          >
            {option.label}
            <Badge 
              variant={selectedView === option.key ? "secondary" : "outline"}
              className="text-xs"
            >
              {option.count}
            </Badge>
          </Button>
        ))}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedView('all')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold">{taskStats.total}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Em Progresso</p>
                  <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedView('urgent')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Urgentes</p>
                  <p className="text-2xl font-bold text-red-600">{taskStats.urgentPending}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedView('overdue')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Atrasadas</p>
                  <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedPatient={selectedPatient}
          onPatientChange={setSelectedPatient}
          patients={patients || []}
          onClearFilters={clearAllFilters}
        />
      </motion.div>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <AnimatePresence>
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{task.title}</h3>
                          <Badge className={priorityColors[task.priority]}>
                            {task.priority === 'LOW' ? 'Baixa' :
                             task.priority === 'MEDIUM' ? 'Média' :
                             task.priority === 'HIGH' ? 'Alta' : 'Urgente'}
                          </Badge>
                          <Badge className={statusColors[task.status]}>
                            {task.status === 'PENDING' ? 'Pendente' :
                             task.status === 'IN_PROGRESS' ? 'Em Progresso' :
                             task.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-slate-600 text-sm mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Vence em {formatDate(task.due_date)}</span>
                            </div>
                          )}
                          {task.patient_id && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{getPatientName(task.patient_id)}</span>
                            </div>
                          )}
                        </div>

                        {task.status === 'IN_PROGRESS' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTask(task)
                            setShowForm(true)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma tarefa encontrada</h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm || selectedPriority !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie sua primeira tarefa para começar'}
                </p>
                {!searchTerm && selectedPriority === 'all' && selectedStatus === 'all' && selectedCategory === 'all' && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Tarefa
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingTask(undefined)
        }}
        onSave={handleSaveTask}
      />
    </div>
  )
}
