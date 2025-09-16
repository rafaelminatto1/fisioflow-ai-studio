import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, User, Send, Loader2, ExternalLink, BookOpen } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'

interface AISearchChatProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  foundArticles?: any[]
  externalSuggestions?: any[]
  timestamp: Date
}

export function AISearchChat({ isOpen, onClose }: AISearchChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const authFetch = useAuthenticatedFetch()
  const notifications = useNotifications()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      // Welcome message
      setMessages([{
        id: '1',
        type: 'assistant',
        content: 'Olá! Sou seu assistente de pesquisa inteligente. Faça perguntas sobre fisioterapia e buscarei na sua base de conhecimento. Como posso ajudar?',
        timestamp: new Date()
      }])
    }
  }, [isOpen])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await authFetch('/api/knowledge/search-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const result = await response.json()
      
      if (result.success) {
        const data = result.data
        let assistantContent = ''
        
        if (data.found_articles && data.found_articles.length > 0) {
          assistantContent = `Encontrei ${data.found_articles.length} artigo(s) relevante(s) na sua base de conhecimento:`
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: assistantContent,
            foundArticles: data.found_articles,
            timestamp: new Date()
          }
          
          setMessages(prev => [...prev, assistantMessage])
        } else if (data.ai_suggestion) {
          assistantContent = data.ai_suggestion.message
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: assistantContent,
            externalSuggestions: data.ai_suggestion.external_suggestions,
            timestamp: new Date()
          }
          
          setMessages(prev => [...prev, assistantMessage])
        }
      } else {
        throw new Error(result.error || 'Erro na pesquisa')
      }
    } catch (error) {
      console.error('Search error:', error)
      notifications.error('Erro ao realizar pesquisa')
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro na pesquisa. Tente novamente.',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(inputValue)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl h-[80vh] flex flex-col"
        >
          <Card className="border-0 shadow-2xl h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  FisioFlow AI - Pesquisa Inteligente
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className={`rounded-lg p-3 ${
                            message.type === 'user' 
                              ? 'bg-blue-500 text-white ml-auto' 
                              : 'bg-slate-100 text-slate-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          
                          <div className="text-xs text-slate-500 mt-1 px-1">
                            {formatTime(message.timestamp)}
                          </div>

                          {/* Found Articles */}
                          {message.foundArticles && message.foundArticles.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.foundArticles.map((article) => (
                                <Card key={article.id} className="border border-slate-200">
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                      <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                                      <div className="flex-1">
                                        <h4 className="font-medium text-slate-900 mb-1">{article.title}</h4>
                                        {article.description && (
                                          <p className="text-sm text-slate-600 mb-2">{article.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                          <span>Por: {article.author_name}</span>
                                          <span>•</span>
                                          <span>{article.category}</span>
                                          {article.file_url && (
                                            <>
                                              <span>•</span>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-auto p-0 text-blue-500 hover:text-blue-700"
                                                onClick={() => window.open(article.file_url, '_blank')}
                                              >
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                Ver documento
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}

                          {/* External Suggestions */}
                          {message.externalSuggestions && message.externalSuggestions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-slate-600 mb-3">
                                Sugestão: Tente pesquisar em uma IA externa:
                              </p>
                              <div className="space-y-2">
                                {message.externalSuggestions.map((suggestion, index) => (
                                  <Card key={index} className="border border-purple-200 bg-purple-50">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h4 className="font-medium text-purple-900">{suggestion.name}</h4>
                                          <p className="text-sm text-purple-700">{suggestion.description}</p>
                                        </div>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => window.open(suggestion.url, '_blank')}
                                          className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                        >
                                          <ExternalLink className="w-4 h-4 mr-1" />
                                          Abrir
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-100 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          <span className="text-sm text-slate-600">Pesquisando...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 p-4 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ex: Tempo de recuperação de LCA no futebol..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                
                <div className="mt-2 text-xs text-slate-500">
                  💡 Dica: Seja específico em suas perguntas para obter melhores resultados
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
