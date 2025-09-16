import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Dumbbell, FileText, Play, Target, Star } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ImageUpload } from './ImageUpload'
import { BodyMapInteractive } from './BodyMapInteractive'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { ExerciseType } from '@/shared/types'

interface ExerciseFormProps {
  exercise?: ExerciseType
  isOpen: boolean
  onClose: () => void
  onSave: (exerciseData: any) => void
}

const difficultyOptions = [
  { value: 1, label: 'Iniciante', description: 'Baixa intensidade, movimentos básicos' },
  { value: 2, label: 'Básico', description: 'Intensidade leve, técnica simples' },
  { value: 3, label: 'Intermediário', description: 'Intensidade moderada, coordenação' },
  { value: 4, label: 'Avançado', description: 'Alta intensidade, técnica complexa' },
  { value: 5, label: 'Expert', description: 'Máxima intensidade, alta coordenação' }
]

const categoryOptions = [
  'Ortopedia',
  'Neurologia',
  'Respiratória',
  'Cardiologia',
  'Pediátrica',
  'Geriátrica',
  'Esportiva',
  'Postura',
  'Fortalecimento',
  'Alongamento',
  'Pilates',
  'RPG',
  'Hidroterapia'
]

const specialtyOptions = [
  'Fisioterapia Ortopédica',
  'Fisioterapia Neurológica',
  'Fisioterapia Respiratória',
  'Fisioterapia Cardiovascular',
  'Fisioterapia Pediátrica',
  'Fisioterapia Geriátrica',
  'Fisioterapia Esportiva',
  'RPG',
  'Pilates Clínico',
  'Hidroterapia',
  'Osteopatia'
]

export function ExerciseForm({ exercise, isOpen, onClose, onSave }: ExerciseFormProps) {
  const notifications = useNotifications()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 0,
    difficulty: 1,
    equipment: '',
    bodyParts: '',
    selectedBodyParts: [] as string[],
    conditions: '',
    contraindications: '',
    category: '',
    specialty: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name || '',
        description: exercise.description || '',
        instructions: exercise.instructions || '',
        videoUrl: exercise.videoUrl || '',
        thumbnailUrl: exercise.thumbnailUrl || '',
        duration: exercise.duration || 0,
        difficulty: exercise.difficulty || 1,
        equipment: exercise.equipment || '',
        bodyParts: exercise.bodyParts || '',
        selectedBodyParts: exercise.bodyParts ? exercise.bodyParts.split(', ') : [],
        conditions: exercise.conditions || '',
        contraindications: exercise.contraindications || '',
        category: exercise.category || '',
        specialty: exercise.specialty || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        instructions: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: 0,
        difficulty: 1,
        equipment: '',
        bodyParts: '',
        selectedBodyParts: [],
        conditions: '',
        contraindications: '',
        category: '',
        specialty: ''
      })
    }
    setErrors({})
  }, [exercise, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do exercício é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (formData.videoUrl && !isValidUrl(formData.videoUrl)) {
      newErrors.videoUrl = 'URL do vídeo inválida'
    }

    if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
      newErrors.thumbnailUrl = 'URL da imagem inválida'
    }

    if (formData.duration && formData.duration < 0) {
      newErrors.duration = 'Duração deve ser positiva'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        bodyParts: formData.selectedBodyParts.length > 0 ? formData.selectedBodyParts.join(', ') : null,
        duration: formData.duration || null,
        videoUrl: formData.videoUrl || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        equipment: formData.equipment || null,
        conditions: formData.conditions || null,
        contraindications: formData.contraindications || null,
        category: formData.category || null,
        specialty: formData.specialty || null
      }
      
      await onSave(submitData)
      notifications.success(exercise ? 'Exercício atualizado com sucesso!' : 'Exercício criado com sucesso!')
    } catch (error) {
      console.error('Error saving exercise:', error)
      notifications.error('Erro ao salvar exercício. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBodyPartsChange = (selectedParts: string[]) => {
    setFormData(prev => ({ ...prev, selectedBodyParts: selectedParts }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {exercise ? 'Editar Exercício' : 'Novo Exercício'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Dumbbell className="w-5 h-5 mr-2 text-blue-600" />
                    Informações Básicas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome do Exercício *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.name ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="Digite o nome do exercício"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Categoria
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categoryOptions.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Especialidade
                      </label>
                      <select
                        value={formData.specialty}
                        onChange={(e) => handleChange('specialty', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Selecione uma especialidade</option>
                        {specialtyOptions.map(specialty => (
                          <option key={specialty} value={specialty}>{specialty}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descrição *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.description ? 'border-red-300' : 'border-slate-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none`}
                      placeholder="Descreva o exercício de forma clara e objetiva"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Detalhes Técnicos
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Duração (minutos)
                      </label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                        min="0"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.duration ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="0"
                      />
                      {errors.duration && (
                        <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nível de Dificuldade
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {difficultyOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.difficulty === option.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name="difficulty"
                              value={option.value}
                              checked={formData.difficulty === option.value}
                              onChange={(e) => handleChange('difficulty', parseInt(e.target.value))}
                              className="sr-only"
                            />
                            <div className="flex items-center mb-1">
                              {Array.from({ length: option.value }, (_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                            <span className="text-xs font-medium">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Regiões Corporais
                      </label>
                      <div className="space-y-4">
                        <BodyMapInteractive
                          selectedParts={formData.selectedBodyParts}
                          onSelectionChange={handleBodyPartsChange}
                          className="bg-white border border-slate-300 rounded-lg p-4"
                        />
                        <input
                          type="text"
                          value={formData.bodyParts}
                          onChange={(e) => handleChange('bodyParts', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Ou digite manualmente: Ex: Coluna lombar, Joelhos, Ombros..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Equipamentos Necessários
                      </label>
                      <input
                        type="text"
                        value={formData.equipment}
                        onChange={(e) => handleChange('equipment', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: Bola suíça, halteres, elástico"
                      />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Instruções e Orientações
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Instruções de Execução
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => handleChange('instructions', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Descreva passo a passo como executar o exercício"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Indicações/Condições
                      </label>
                      <textarea
                        value={formData.conditions}
                        onChange={(e) => handleChange('conditions', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        placeholder="Para quais condições este exercício é indicado"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contraindicações
                      </label>
                      <textarea
                        value={formData.contraindications}
                        onChange={(e) => handleChange('contraindications', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        placeholder="Quando este exercício não deve ser realizado"
                      />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Play className="w-5 h-5 mr-2 text-orange-600" />
                    Mídia
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <ImageUpload
                        label="Imagem/Thumbnail do Exercício"
                        value={formData.thumbnailUrl}
                        onChange={(url) => handleChange('thumbnailUrl', url)}
                        className="mb-4"
                      />
                      {errors.thumbnailUrl && (
                        <p className="text-red-500 text-sm mt-1">{errors.thumbnailUrl}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        URL do Vídeo
                      </label>
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => handleChange('videoUrl', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.videoUrl ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="https://example.com/video.mp4"
                      />
                      {errors.videoUrl && (
                        <p className="text-red-500 text-sm mt-1">{errors.videoUrl}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Cole a URL de um vídeo online (YouTube, Vimeo, etc.)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : (exercise ? 'Atualizar' : 'Cadastrar')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
