import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, FileText, Video, Link as LinkIcon, Tag, Upload } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ImageUpload } from './ImageUpload'

interface KnowledgeArticleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: any
  mode: 'create' | 'edit'
}

const categoryOptions = [
  { value: 'ORTOPEDIA', label: 'Ortopedia' },
  { value: 'NEUROLOGIA', label: 'Neurologia' },
  { value: 'CARDIO', label: 'Cardiologia' },
  { value: 'RESPIRATORIA', label: 'Respiratória' },
  { value: 'PEDIATRICA', label: 'Pediátrica' },
  { value: 'GERIATRICA', label: 'Geriátrica' },
  { value: 'DERMATOFUNCIONAL', label: 'Dermatofuncional' },
  { value: 'ESPORTIVA', label: 'Esportiva' },
  { value: 'GESTAO', label: 'Gestão' },
  { value: 'PROTOCOLOS', label: 'Protocolos' },
  { value: 'ANATOMIA', label: 'Anatomia' },
  { value: 'FISIOLOGIA', label: 'Fisiologia' },
  { value: 'FARMACOLOGIA', label: 'Farmacologia' },
  { value: 'OUTROS', label: 'Outros' }
]

const fileTypeOptions = [
  { value: 'PDF', label: 'PDF', icon: FileText, description: 'Documentos em PDF' },
  { value: 'VIDEO', label: 'Vídeo', icon: Video, description: 'Links para vídeos (YouTube, Vimeo)' },
  { value: 'LINK', label: 'Link', icon: LinkIcon, description: 'Links externos para artigos/sites' },
  { value: 'DOCUMENT', label: 'Documento', icon: FileText, description: 'Outros tipos de documento' }
]

export function KnowledgeArticleForm({ isOpen, onClose, onSubmit, initialData, mode }: KnowledgeArticleFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentText: '',
    fileUrl: '',
    fileType: 'PDF',
    tags: '',
    category: 'OUTROS'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        contentText: initialData.content_text || '',
        fileUrl: initialData.file_url || '',
        fileType: initialData.file_type || 'PDF',
        tags: initialData.tags || '',
        category: initialData.category || 'OUTROS'
      })
    } else {
      setFormData({
        title: '',
        description: '',
        contentText: '',
        fileUrl: '',
        fileType: 'PDF',
        tags: '',
        category: 'OUTROS'
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.fileUrl.trim() && !formData.contentText.trim()) {
      newErrors.fileUrl = 'É necessário fornecer um arquivo/link ou conteúdo textual'
      newErrors.contentText = 'É necessário fornecer um arquivo/link ou conteúdo textual'
    }

    if (formData.fileUrl && formData.fileType === 'VIDEO') {
      const videoUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/
      if (!videoUrlPattern.test(formData.fileUrl)) {
        newErrors.fileUrl = 'Para vídeos, use links do YouTube ou Vimeo'
      }
    }

    if (formData.fileUrl && formData.fileType === 'LINK') {
      const urlPattern = /^https?:\/\/.+/
      if (!urlPattern.test(formData.fileUrl)) {
        newErrors.fileUrl = 'Link deve começar com http:// ou https://'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleTagsChange = (value: string) => {
    // Clean and format tags
    const cleanTags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .join(', ')
    
    handleChange('tags', cleanTags)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  {mode === 'edit' ? 'Editar Artigo' : 'Novo Artigo da Base de Conhecimento'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Título do Artigo *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.title ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="Ex: Protocolo de Reabilitação de LCA..."
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tipo de Conteúdo *
                      </label>
                      <select
                        value={formData.fileType}
                        onChange={(e) => handleChange('fileType', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {fileTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Descrição *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.description ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="Breve descrição do conteúdo do artigo..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Ex: LCA, joelho, futebol, reabilitação..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Tags ajudam na pesquisa e organização do conteúdo
                    </p>
                  </div>
                </div>

                {/* Content Upload/Link */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-green-500" />
                    Conteúdo
                  </h3>

                  {/* File Type Info */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    {fileTypeOptions.map((option) => {
                      const Icon = option.icon
                      return formData.fileType === option.value ? (
                        <div key={option.value} className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-slate-900">{option.label}</p>
                            <p className="text-sm text-slate-600">{option.description}</p>
                          </div>
                        </div>
                      ) : null
                    })}
                  </div>

                  {formData.fileType === 'PDF' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Upload de PDF ou URL
                      </label>
                      <ImageUpload
                        value={formData.fileUrl}
                        onChange={(url) => handleChange('fileUrl', url)}
                        label="Arquivo PDF"
                      />
                      {errors.fileUrl && <p className="text-red-500 text-sm mt-1">{errors.fileUrl}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {formData.fileType === 'VIDEO' ? 'URL do Vídeo' : 
                         formData.fileType === 'LINK' ? 'URL do Link' : 'URL do Documento'} *
                      </label>
                      <input
                        type="url"
                        value={formData.fileUrl}
                        onChange={(e) => handleChange('fileUrl', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.fileUrl ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder={
                          formData.fileType === 'VIDEO' ? 'https://youtube.com/watch?v=...' :
                          formData.fileType === 'LINK' ? 'https://exemplo.com/artigo' :
                          'https://exemplo.com/documento.pdf'
                        }
                      />
                      {errors.fileUrl && <p className="text-red-500 text-sm mt-1">{errors.fileUrl}</p>}
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-500" />
                    Conteúdo Textual (Opcional)
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Resumo ou Conteúdo Completo
                    </label>
                    <textarea
                      value={formData.contentText}
                      onChange={(e) => handleChange('contentText', e.target.value)}
                      rows={8}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.contentText ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="Digite aqui o conteúdo textual que será usado para pesquisas da IA. Pode ser um resumo do arquivo ou o conteúdo completo..."
                    />
                    {errors.contentText && <p className="text-red-500 text-sm mt-1">{errors.contentText}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      Este texto será usado pela IA para encontrar este artigo em pesquisas
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </div>
                    ) : (
                      mode === 'edit' ? 'Atualizar Artigo' : 'Criar Artigo'
                    )}
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
