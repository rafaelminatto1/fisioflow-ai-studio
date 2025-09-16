import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  User,
  Tag,
  X,
  ChevronDown,
  CheckSquare
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface TaskFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedPriority: string
  onPriorityChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  selectedPatient: string
  onPatientChange: (value: string) => void
  patients?: any[]
  showAdvanced?: boolean
  onClearFilters: () => void
}

const priorities = [
  { value: 'all', label: 'Todas Prioridades', color: 'bg-gray-100' },
  { value: 'LOW', label: 'Baixa', color: 'bg-gray-100' },
  { value: 'MEDIUM', label: 'Média', color: 'bg-blue-100' },
  { value: 'HIGH', label: 'Alta', color: 'bg-orange-100' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100' }
]

const statuses = [
  { value: 'all', label: 'Todos Status', color: 'bg-gray-100' },
  { value: 'PENDING', label: 'Pendente', color: 'bg-yellow-100' },
  { value: 'IN_PROGRESS', label: 'Em Progresso', color: 'bg-blue-100' },
  { value: 'COMPLETED', label: 'Concluída', color: 'bg-green-100' },
  { value: 'CANCELLED', label: 'Cancelada', color: 'bg-gray-100' }
]

const categories = [
  { value: 'all', label: 'Todas Categorias' },
  { value: 'GENERAL', label: 'Geral' },
  { value: 'PATIENT_CARE', label: 'Cuidados com Paciente' },
  { value: 'ADMINISTRATIVE', label: 'Administrativo' },
  { value: 'EQUIPMENT', label: 'Equipamentos' },
  { value: 'FOLLOW_UP', label: 'Follow-up' }
]

export function TaskFilters({
  searchTerm,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  selectedPatient,
  onPatientChange,
  patients = [],
  showAdvanced = false,
  onClearFilters
}: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(showAdvanced)

  const activeFiltersCount = [
    selectedPriority !== 'all',
    selectedStatus !== 'all',
    selectedCategory !== 'all',
    selectedPatient !== 'all',
    searchTerm.length > 0
  ].filter(Boolean).length

  const hasActiveFilters = activeFiltersCount > 0

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar tarefas por título ou descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="text-slate-600 hover:text-slate-900"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Quick filter badges */}
      {!showFilters && hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {searchTerm && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              "{searchTerm}"
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => onSearchChange('')}
              />
            </Badge>
          )}
          
          {selectedPriority !== 'all' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {priorities.find(p => p.value === selectedPriority)?.label}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => onPriorityChange('all')}
              />
            </Badge>
          )}
          
          {selectedStatus !== 'all' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              {statuses.find(s => s.value === selectedStatus)?.label}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => onStatusChange('all')}
              />
            </Badge>
          )}
          
          {selectedCategory !== 'all' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {categories.find(c => c.value === selectedCategory)?.label}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => onCategoryChange('all')}
              />
            </Badge>
          )}
          
          {selectedPatient !== 'all' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {patients.find(p => p.id.toString() === selectedPatient)?.name || 'Paciente'}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => onPatientChange('all')}
              />
            </Badge>
          )}
        </motion.div>
      )}

      {/* Advanced filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Prioridade
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => onPatientChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">Todos os Pacientes</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id.toString()}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  )
}
