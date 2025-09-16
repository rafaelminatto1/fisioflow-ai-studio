import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Download,
  Phone,
  Mail,
  Calendar,
  Package,
  Grid,
  List
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { useAdaptiveBehavior } from '@/react-app/hooks/useConnectionAware'
import { usePageRefresh } from '@/react-app/hooks/useSmartRefresh'
import { ErrorBoundary } from '@/react-app/components/ErrorBoundary'
import { VirtualizedPatientList } from '@/react-app/components/VirtualizedList'
import { PackageForm } from '@/react-app/components/PackageForm'
import { PatientType } from '@/shared/types'
import { calculateAge, formatDate } from '@/lib/utils'

export default function Patients() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientType | null>(null)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [selectedPatientForPackage, setSelectedPatientForPackage] = useState<PatientType | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { success, error } = useNotifications()
  const { behavior } = useAdaptiveBehavior()

  // Fetch patients data
  const { 
    data: patients, 
    loading, 
    isRevalidating,
    refetch 
  } = useOptimizedAuthFetch<PatientType[]>('patients-list', '/api/patients', {
    staleTime: behavior.staleTime,
    cacheTime: behavior.cacheTime,
    refetchOnWindowFocus: true
  })

  // Smart refresh for this page
  usePageRefresh('patients', refetch)

  // Filter and search patients
  const filteredPatients = useMemo(() => {
    if (!patients) return []

    return patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.phone.includes(searchTerm) ||
                           patient.cpf?.includes(searchTerm)

      const matchesFilter = selectedFilter === 'all' || 
                           (selectedFilter === 'active' && patient.isActive) ||
                           (selectedFilter === 'inactive' && !patient.isActive) ||
                           (selectedFilter === 'recent' && isRecentPatient(patient))

      return matchesSearch && matchesFilter
    })
  }, [patients, searchTerm, selectedFilter])

  const isRecentPatient = (patient: PatientType) => {
    const createdDate = new Date(patient.createdAt)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return createdDate > thirtyDaysAgo
  }

  const handleDeletePatient = async (patientId: number) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('fisioflow_token')}`
        }
      })

      if (response.ok) {
        success('Paciente excluído com sucesso')
        refetch()
      } else {
        throw new Error('Falha ao excluir paciente')
      }
    } catch (err) {
      error('Erro ao excluir paciente')
    }
  }

  const handleExportData = () => {
    if (!patients) return

    const csvContent = [
      'Nome,Email,Telefone,CPF,Data de Nascimento,Gênero,Endereço',
      ...patients.map(p => 
        `"${p.name}","${p.email || ''}","${p.phone}","${p.cpf || ''}","${p.birthDate}","${p.gender}","${p.address || ''}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pacientes_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    success('Dados exportados com sucesso')
  }

  const handlePackageCreated = () => {
    // Could trigger a refetch of patient data if we want to show package info in patient cards
    success('Pacote criado com sucesso')
  }

  const genderLabels = {
    'MASCULINO': 'Masculino',
    'FEMININO': 'Feminino',
    'OUTRO': 'Outro'
  }

  const filterOptions = [
    { value: 'all', label: 'Todos', count: patients?.length || 0 },
    { value: 'active', label: 'Ativos', count: patients?.filter(p => p.isActive).length || 0 },
    { value: 'recent', label: 'Recentes', count: patients?.filter(p => isRecentPatient(p)).length || 0 }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-slate-200 rounded-lg w-80 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-60 animate-pulse"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Pacientes
            {isRevalidating && <span className="text-sm text-blue-600">• Atualizando...</span>}
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie os pacientes da sua clínica
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4 mr-2" />
              Grade
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowPatientForm(true)}>
            <UserPlus className="w-4 h-4" />
            Novo Paciente
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Total de Pacientes</p>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{patients?.length || 0}</h3>
              <p className="text-xs text-slate-500">Todos os pacientes</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Pacientes Ativos</p>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {patients?.filter(p => p.isActive).length || 0}
              </h3>
              <p className="text-xs text-slate-500">Em tratamento</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Novos este Mês</p>
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {patients?.filter(p => isRecentPatient(p)).length || 0}
              </h3>
              <p className="text-xs text-slate-500">Últimos 30 dias</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Média de Idade</p>
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {patients?.length ? Math.round(
                  patients.reduce((sum, p) => sum + calculateAge(p.birthDate), 0) / patients.length
                ) : 0}
              </h3>
              <p className="text-xs text-slate-500">anos</p>
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
            placeholder="Buscar por nome, email, telefone ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {filterOptions.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? "default" : "outline"}
              onClick={() => setSelectedFilter(filter.value)}
              className="whitespace-nowrap"
            >
              <Filter className="w-4 h-4 mr-2" />
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Patients Grid/List */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <ErrorBoundary>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="shadow-md border-0 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">
                              {patient.name}
                            </CardTitle>
                            <p className="text-sm text-slate-500">
                              {calculateAge(patient.birthDate)} anos • {genderLabels[patient.gender as keyof typeof genderLabels]}
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {patient.email && (
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>Paciente desde {formatDate(patient.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={patient.isActive ? "success" : "secondary"}>
                          {patient.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Ver detalhes"
                            onClick={() => navigate(`/patients/${patient.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            onClick={() => setEditingPatient(patient)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Comprar Pacote"
                            onClick={() => {
                              setSelectedPatientForPackage(patient)
                              setShowPackageForm(true)
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Package className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Excluir"
                            onClick={() => handleDeletePatient(patient.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="shadow-md border-0">
              <CardContent className="p-0">
                <VirtualizedPatientList
                  patients={filteredPatients}
                  onPatientClick={(patient) => navigate(`/patients/${patient.id}`)}
                  onPatientEdit={(patient) => setEditingPatient(patient)}
                  onPatientDelete={(patient) => handleDeletePatient(patient.id)}
                  height={600}
                />
              </CardContent>
            </Card>
          )}
        </ErrorBoundary>
      </motion.div>

      {/* Empty State */}
      {filteredPatients.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm 
              ? 'Tente ajustar os filtros de busca.'
              : 'Cadastre seu primeiro paciente para começar.'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowPatientForm(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Paciente
            </Button>
          )}
        </motion.div>
      )}

      {/* TODO: Add PatientForm modal component when showPatientForm or editingPatient */}
      {(showPatientForm || editingPatient) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
            </h3>
            <p className="text-slate-600 mb-4">
              Formulário de paciente será implementado em breve.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPatientForm(false)
                  setEditingPatient(null)
                }}
              >
                Cancelar
              </Button>
              <Button>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Package Form Modal */}
      <PackageForm
        isOpen={showPackageForm}
        onClose={() => {
          setShowPackageForm(false)
          setSelectedPatientForPackage(null)
        }}
        patientId={selectedPatientForPackage?.id || 0}
        patientName={selectedPatientForPackage?.name || ''}
        onPackageCreated={handlePackageCreated}
      />
    </div>
  )
}
