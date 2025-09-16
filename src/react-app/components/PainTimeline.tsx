import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingDown, TrendingUp, Minus, Eye, FileText } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface PainTimelineEntry {
  id: number
  sessionDate: string
  overallPainLevel: number
  painPoints: Array<{
    id: number
    bodyPart: string
    painLevel: number
    description?: string
  }>
  notes?: string
}

interface PainTimelineProps {
  patientId?: number
  timelineData: PainTimelineEntry[]
  onViewSession: (sessionId: number) => void
}

const painColors = {
  0: '#22c55e',  // Verde
  1: '#22c55e',
  2: '#22c55e',
  3: '#f59e0b',  // Amarelo
  4: '#f59e0b',
  5: '#f59e0b',
  6: '#f97316',  // Laranja
  7: '#f97316',
  8: '#f97316',
  9: '#ef4444',  // Vermelho
  10: '#ef4444'
}

export function PainTimeline({ timelineData, onViewSession }: PainTimelineProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getPainTrend = (current: number, previous?: number) => {
    if (!previous) return null
    if (current < previous) return 'improvement'
    if (current > previous) return 'worsening'
    return 'stable'
  }

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'improvement':
        return <TrendingDown className="h-4 w-4 text-green-600" />
      case 'worsening':
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-slate-500" />
      default:
        return null
    }
  }

  const filteredData = timelineData.filter(entry => {
    const entryDate = new Date(entry.sessionDate)
    const now = new Date()
    
    switch (selectedPeriod) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return entryDate >= weekAgo
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return entryDate >= monthAgo
      default:
        return true
    }
  }).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Evolução da Dor
          </h3>
        </div>
        
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : 'Tudo'}
            </Button>
          ))}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma avaliação encontrada neste período</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((entry, index) => {
            const previousEntry = filteredData[index + 1]
            const trend = getPainTrend(entry.overallPainLevel, previousEntry?.overallPainLevel)

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline line */}
                {index < filteredData.length - 1 && (
                  <div className="absolute left-6 top-16 h-8 w-0.5 bg-slate-200" />
                )}

                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                    style={{
                      backgroundColor: painColors[entry.overallPainLevel as keyof typeof painColors]
                    }}
                  >
                    {entry.overallPainLevel}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900">
                            {formatDate(entry.sessionDate)}
                          </h4>
                          {getTrendIcon(trend)}
                        </div>
                        <p className="text-sm text-slate-600">
                          Dor geral: {entry.overallPainLevel}/10
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSession(entry.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver detalhes
                      </Button>
                    </div>

                    {/* Pain points summary */}
                    {entry.painPoints.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-2">
                          Pontos de dor identificados:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {entry.painPoints.slice(0, 4).map(point => (
                            <Badge
                              key={point.id}
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `${painColors[point.painLevel as keyof typeof painColors]}20`,
                                color: painColors[point.painLevel as keyof typeof painColors],
                                borderColor: painColors[point.painLevel as keyof typeof painColors]
                              }}
                            >
                              {point.bodyPart} ({point.painLevel})
                            </Badge>
                          ))}
                          {entry.painPoints.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.painPoints.length - 4} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2">{entry.notes}</p>
                      </div>
                    )}

                    {/* Trend indicator */}
                    {trend && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-sm">
                          {getTrendIcon(trend)}
                          <span className={`
                            ${trend === 'improvement' ? 'text-green-600' : 
                              trend === 'worsening' ? 'text-red-600' : 'text-slate-500'}
                          `}>
                            {trend === 'improvement' ? 'Melhora na dor' :
                             trend === 'worsening' ? 'Piora na dor' : 'Dor estável'}
                            {previousEntry && (
                              <span className="ml-1 text-slate-500">
                                (era {previousEntry.overallPainLevel}/10)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
