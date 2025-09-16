import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  FileText,
  Video,
  Link as LinkIcon,
  Eye,
  Brain,
  Calendar,
  User,
  Edit,
  Trash2,
  ExternalLink,
  Bot,
  MessageSquare,
  Filter
} from 'lucide-react'
import { Card, CardContent } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { useAuth } from '@/react-app/contexts/AuthContext'
import { AdvancedSearchFilter } from '@/react-app/components/enhanced/AdvancedSearchFilter'
import { KnowledgeArticleForm } from '@/react-app/components/KnowledgeArticleForm'
import { AISearchChat } from '@/react-app/components/AISearchChat'
import { formatDateTime } from '@/lib/utils'

interface KnowledgeArticle {
  id: number
  title: string
  description?: string
  content_text?: string
  file_url?: string
  file_type: 'PDF' | 'VIDEO' | 'LINK' | 'DOCUMENT'
  tags?: string
  category: string
  view_count: number
  author_name: string
  user_id: number
  created_at: string
  updated_at: string
}

interface ArticleCategory {
  category: string
  count: number
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

const fileTypeIcons = {
  'PDF': FileText,
  'VIDEO': Video,
  'LINK': LinkIcon,
  'DOCUMENT': FileText
}

const fileTypeColors = {
  'PDF': 'bg-red-100 text-red-800',
  'VIDEO': 'bg-blue-100 text-blue-800',
  'LINK': 'bg-green-100 text-green-800',
  'DOCUMENT': 'bg-purple-100 text-purple-800'
}

export default function KnowledgeBase() {
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({})
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const { user } = useAuth()
  const authFetch = useAuthenticatedFetch()
  const notifications = useNotifications()

  // Fetch knowledge articles
  const { 
    data: articles, 
    refetch: refetchArticles,
    loading: loadingArticles
  } = useOptimizedAuthFetch<KnowledgeArticle[]>('knowledge-articles', `/api/knowledge?category=${selectedCategory}&search=${searchTerm}`, {
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })

  // Fetch category statistics
  const { 
    data: categories,
    refetch: refetchCategories
  } = useOptimizedAuthFetch<ArticleCategory[]>('knowledge-categories', '/api/knowledge/categories', {
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000
  })

  // Filter options for advanced search
  const filterOptions = [
    {
      key: 'category',
      label: 'Categoria',
      type: 'select' as const,
      options: categoryOptions
    },
    {
      key: 'fileType',
      label: 'Tipo de Arquivo',
      type: 'select' as const,
      options: [
        { value: 'PDF', label: 'PDF' },
        { value: 'VIDEO', label: 'Vídeo' },
        { value: 'LINK', label: 'Link' },
        { value: 'DOCUMENT', label: 'Documento' }
      ]
    },
    {
      key: 'author',
      label: 'Autor',
      type: 'text' as const
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'text' as const
    }
  ]

  // Filter articles based on search and filters
  const filteredArticles = useMemo(() => {
    if (!articles) return []
    
    return articles.filter(article => {
      // Apply search filters
      if (searchFilters.category && article.category !== searchFilters.category) return false
      if (searchFilters.fileType && article.file_type !== searchFilters.fileType) return false
      if (searchFilters.author && !article.author_name?.toLowerCase().includes(searchFilters.author.toLowerCase())) return false
      if (searchFilters.tags && !article.tags?.toLowerCase().includes(searchFilters.tags.toLowerCase())) return false
      
      return true
    })
  }, [articles, searchFilters])

  // Stats calculations
  const stats = useMemo(() => {
    if (!articles) return { total: 0, totalViews: 0, myArticles: 0, categories: 0 }
    
    const totalViews = articles.reduce((sum, article) => sum + article.view_count, 0)
    const myArticles = articles.filter(article => article.user_id === user?.id).length
    const uniqueCategories = new Set(articles.map(article => article.category)).size
    
    return {
      total: articles.length,
      totalViews,
      myArticles,
      categories: uniqueCategories
    }
  }, [articles, user?.id])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleCreateArticle = async (articleData: any) => {
    try {
      const response = await authFetch('/api/knowledge', {
        method: 'POST',
        body: JSON.stringify(articleData)
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Artigo criado com sucesso!')
        setShowForm(false)
        await refetchArticles()
        await refetchCategories()
      } else {
        notifications.error(result.error || 'Erro ao criar artigo')
      }
    } catch (error) {
      notifications.error('Erro ao criar artigo')
    }
  }

  const handleUpdateArticle = async (articleData: any) => {
    if (!editingArticle) return
    
    try {
      const response = await authFetch(`/api/knowledge/${editingArticle.id}`, {
        method: 'PUT',
        body: JSON.stringify(articleData)
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Artigo atualizado com sucesso!')
        setEditingArticle(null)
        setShowForm(false)
        await refetchArticles()
        await refetchCategories()
      } else {
        notifications.error(result.error || 'Erro ao atualizar artigo')
      }
    } catch (error) {
      notifications.error('Erro ao atualizar artigo')
    }
  }

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return
    
    try {
      const response = await authFetch(`/api/knowledge/${articleId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Artigo excluído com sucesso!')
        await refetchArticles()
        await refetchCategories()
      } else {
        notifications.error(result.error || 'Erro ao excluir artigo')
      }
    } catch (error) {
      notifications.error('Erro ao excluir artigo')
    }
  }

  const handleViewArticle = async (article: KnowledgeArticle) => {
    if (article.file_url) {
      window.open(article.file_url, '_blank')
    }
  }

  const canEditArticle = (article: KnowledgeArticle) => {
    return user?.role === 'ADMIN' || article.user_id === user?.id
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Base de Conhecimento
          </h1>
          <p className="text-slate-600 mt-1">
            Centro de informações e pesquisa inteligente para sua equipe
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAIChat(true)}
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
          >
            <Brain className="w-4 h-4 mr-2" />
            Pesquisa IA
          </Button>
          
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            Novo Artigo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">Total de Artigos</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Visualizações</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalViews}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-medium">Meus Artigos</p>
                <p className="text-2xl font-bold text-purple-900">{stats.myArticles}</p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-medium">Categorias</p>
                <p className="text-2xl font-bold text-orange-900">{stats.categories}</p>
              </div>
              <Filter className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Search Feature Highlight */}
      <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Pesquisa Inteligente com IA</h3>
              <p className="text-slate-600 mb-3">
                Faça perguntas específicas sobre fisioterapia e nossa IA buscará nas suas bases de conhecimento. 
                Se não encontrar informações, sugerirá fontes externas confiáveis.
              </p>
              <Button
                onClick={() => setShowAIChat(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Começar Pesquisa IA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <AdvancedSearchFilter
        onSearch={handleSearch}
        onFilter={setSearchFilters}
        filterOptions={filterOptions}
        searchPlaceholder="Buscar artigos por título, descrição ou conteúdo..."
      />

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('ALL')}
        >
          Todos
        </Button>
        {categoryOptions.map((category) => {
          const categoryData = categories?.find(c => c.category === category.value)
          return (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="whitespace-nowrap"
            >
              {category.label}
              {categoryData && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {categoryData.count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredArticles.map((article, index) => {
            const FileIcon = fileTypeIcons[article.file_type]
            const canEdit = canEditArticle(article)
            
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fileTypeColors[article.file_type]}`}>
                          <FileIcon className="w-4 h-4" />
                        </div>
                        <Badge variant="outline">{article.category}</Badge>
                      </div>
                      
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingArticle(article)
                              setShowForm(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{article.title}</h3>
                      {article.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-3">{article.description}</p>
                      )}
                      
                      {article.tags && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {article.tags.split(',').slice(0, 3).map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{article.author_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{article.view_count}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(article.created_at)}
                      </div>

                      <div className="flex gap-2 pt-2">
                        {article.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewArticle(article)}
                            className="flex-1"
                          >
                            {article.file_type === 'LINK' ? (
                              <ExternalLink className="w-4 h-4 mr-1" />
                            ) : (
                              <Eye className="w-4 h-4 mr-1" />
                            )}
                            {article.file_type === 'LINK' ? 'Abrir Link' : 'Visualizar'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loadingArticles && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loadingArticles && filteredArticles.length === 0 && (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum artigo encontrado</h3>
            <p className="text-slate-500 text-center mb-4">
              {searchFilters && Object.keys(searchFilters).length > 0 || searchTerm
                ? 'Nenhum artigo corresponde aos filtros aplicados' 
                : 'Comece adicionando artigos à sua base de conhecimento'}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Artigo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <KnowledgeArticleForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingArticle(null)
        }}
        onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle}
        initialData={editingArticle}
        mode={editingArticle ? 'edit' : 'create'}
      />

      <AISearchChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />
    </div>
  )
}
