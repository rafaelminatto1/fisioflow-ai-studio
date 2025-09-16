import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Dumbbell, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Play,
  Clock,
  Target,
  Heart,
  Zap,
  Eye,
  Edit,
  Trash2,
  Download,
  BookOpen,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { ExerciseType } from '@/shared/types'

export default function Exercises() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<ExerciseType | null>(null)

  const { success, error } = useNotifications()

  // Fetch exercises data
  const { 
    data: exercises, 
    loading, 
    isRevalidating,
    refetch 
  } = useOptimizedAuthFetch<ExerciseType[]>('exercises-list', '/api/exercises', {
    staleTime: 5 * 60 * 1000, // 5 minutes fresh (exercises don't change often)
    cacheTime: 15 * 60 * 1000, // 15 minutes total cache
    refetchOnWindowFocus: false // Don't refetch on focus for exercises
  })

  // Filter and search exercises
  const filteredExercises = useMemo(() => {
    if (!exercises) return []

    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.bodyParts?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.conditions?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.equipment?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory

      const matchesDifficulty = selectedDifficulty === 'all' || 
                               exercise.difficulty.toString() === selectedDifficulty

      return matchesSearch && matchesCategory && matchesDifficulty && exercise.isActive
    })
  }, [exercises, searchTerm, selectedCategory, selectedDifficulty])

  const handleDeleteExercise = async (exerciseId: number) => {
    if (!confirm('Tem certeza que deseja excluir este exercício?')) return

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('fisioflow_token')}`
        }
      })

      if (response.ok) {
        success('Exercício excluído com sucesso')
        refetch()
      } else {
        throw new Error('Falha ao excluir exercício')
      }
    } catch (err) {
      error('Erro ao excluir exercício')
    }
  }

  const difficultyLabels = {
    1: { label: 'Iniciante', color: 'bg-green-100 text-green-800 border-green-200', icon: '●' },
    2: { label: 'Fácil', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '●●' },
    3: { label: 'Moderado', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '●●●' },
    4: { label: 'Difícil', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '●●●●' },
    5: { label: 'Avançado', color: 'bg-red-100 text-red-800 border-red-200', icon: '●●●●●' }
  }

  const categoryIcons = {
    'Alongamento': Target,
    'Fortalecimento': Dumbbell,
    'Mobilização': Play,
    'Respiratória': Heart,
    'Propriocepção': Zap,
    'Cardiovascular': Heart
  }

  // Get unique categories and their counts
  const categories = useMemo(() => {
    if (!exercises) return []
    const categoryCount = exercises.reduce((acc: Record<string, number>, exercise) => {
      if (exercise.isActive && exercise.category) {
        acc[exercise.category] = (acc[exercise.category] || 0) + 1
      }
      return acc
    }, {})
    
    return [
      { value: 'all', label: 'Todas', count: exercises.filter(e => e.isActive).length },
      ...Object.entries(categoryCount).map(([category, count]) => ({
        value: category,
        label: category,
        count: count as number
      }))
    ]
  }, [exercises])

  const difficulties = [
    { value: 'all', label: 'Todas', count: exercises?.filter(e => e.isActive).length || 0 },
    { value: '1', label: 'Iniciante', count: exercises?.filter(e => e.isActive && e.difficulty === 1).length || 0 },
    { value: '2', label: 'Fácil', count: exercises?.filter(e => e.isActive && e.difficulty === 2).length || 0 },
    { value: '3', label: 'Moderado', count: exercises?.filter(e => e.isActive && e.difficulty === 3).length || 0 },
    { value: '4', label: 'Difícil', count: exercises?.filter(e => e.isActive && e.difficulty === 4).length || 0 },
    { value: '5', label: 'Avançado', count: exercises?.filter(e => e.isActive && e.difficulty === 5).length || 0 }
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Dumbbell className="w-8 h-8 text-blue-600" />
            Biblioteca de Exercícios
            {isRevalidating && <span className="text-sm text-blue-600">• Atualizando...</span>}
          </h1>
          <p className="text-slate-600 mt-1">
            Catálogo completo de exercícios terapêuticos
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowExerciseForm(true)}>
            <Plus className="w-4 h-4" />
            Novo Exercício
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Total de Exercícios</p>
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {exercises?.filter(e => e.isActive).length || 0}
              </h3>
              <p className="text-xs text-slate-500">Ativos no sistema</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Categorias</p>
                <Filter className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {categories.length - 1}
              </h3>
              <p className="text-xs text-slate-500">Diferentes tipos</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Mais Usados</p>
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {exercises?.filter(e => e.category === 'Fortalecimento').length || 0}
              </h3>
              <p className="text-xs text-slate-500">Fortalecimento</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-600">Duração Média</p>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {exercises?.length ? Math.round(
                  exercises.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / 
                  exercises.filter(e => e.duration).length
                ) : 0}
              </h3>
              <p className="text-xs text-slate-500">minutos</p>
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
            placeholder="Buscar por nome, descrição, equipamento ou região do corpo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label} ({difficulty.count})
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Exercises Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredExercises.map((exercise, index) => {
          const difficulty = difficultyLabels[exercise.difficulty as keyof typeof difficultyLabels]
          const CategoryIcon = categoryIcons[exercise.category as keyof typeof categoryIcons] || Target

          return (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card className="shadow-md border-0 hover:shadow-lg transition-all duration-300 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white">
                        <CategoryIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-2">
                          {exercise.name}
                        </CardTitle>
                        {exercise.category && (
                          <Badge variant="outline" className="mt-1">
                            {exercise.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {exercise.description || 'Sem descrição disponível'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={difficulty.color}>
                      {difficulty.icon} {difficulty.label}
                    </Badge>
                    {exercise.duration && (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {exercise.duration}min
                      </Badge>
                    )}
                  </div>

                  {exercise.bodyParts && (
                    <div className="text-xs text-slate-500">
                      <strong>Região:</strong> {exercise.bodyParts}
                    </div>
                  )}

                  {exercise.equipment && (
                    <div className="text-xs text-slate-500">
                      <strong>Equipamento:</strong> {exercise.equipment}
                    </div>
                  )}

                  {exercise.conditions && (
                    <div className="text-xs text-slate-500">
                      <strong>Indicações:</strong> {exercise.conditions}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" title="Ver detalhes">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {exercise.videoUrl && (
                        <Button variant="ghost" size="icon" title="Assistir vídeo">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Editar"
                        onClick={() => setEditingExercise(exercise)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Excluir"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Empty State */}
      {filteredExercises.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Dumbbell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'Nenhum exercício encontrado' : 'Nenhum exercício cadastrado'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Adicione exercícios à sua biblioteca terapêutica.'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <Button onClick={() => setShowExerciseForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Exercício
            </Button>
          )}
        </motion.div>
      )}

      {/* TODO: Add ExerciseForm modal component when showExerciseForm or editingExercise */}
      {(showExerciseForm || editingExercise) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
            </h3>
            <p className="text-slate-600 mb-4">
              Formulário de exercício será implementado em breve.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowExerciseForm(false)
                  setEditingExercise(null)
                }}
              >
                Cancelar
              </Button>
              <Button>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
