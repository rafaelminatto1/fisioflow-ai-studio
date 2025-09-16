import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, ZoomIn, ZoomOut, Save } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { PainPointModal } from './PainPointModal'
import { useNotifications } from '../hooks/useNotifications'

interface PainPoint {
  id?: number
  bodyPart: string
  xCoordinate: number
  yCoordinate: number
  painLevel: number
  description?: string
  notes?: string
  imageUrl?: string
  sessionDate: string
}

interface BodyMapAdvancedProps {
  patientId: number
  sessionId?: number
  painPoints: PainPoint[]
  onSavePainPoint: (painPoint: Omit<PainPoint, 'sessionDate'>) => Promise<void>
  onDeletePainPoint: (id: number) => Promise<void>
  onSaveSession: () => Promise<void>
  readOnly?: boolean
  className?: string
}

const bodyParts: Record<string, { name: string; x: number; y: number; width: number; height: number }> = {
  head: { name: 'Cabeça', x: 50, y: 8, width: 8, height: 10 },
  neck: { name: 'Pescoço', x: 50, y: 18, width: 4, height: 6 },
  leftShoulder: { name: 'Ombro Esquerdo', x: 35, y: 24, width: 8, height: 6 },
  rightShoulder: { name: 'Ombro Direito', x: 65, y: 24, width: 8, height: 6 },
  leftArm: { name: 'Braço Esquerdo', x: 28, y: 30, width: 6, height: 15 },
  rightArm: { name: 'Braço Direito', x: 72, y: 30, width: 6, height: 15 },
  leftForearm: { name: 'Antebraço Esquerdo', x: 25, y: 45, width: 5, height: 12 },
  rightForearm: { name: 'Antebraço Direito', x: 75, y: 45, width: 5, height: 12 },
  leftHand: { name: 'Mão Esquerda', x: 22, y: 57, width: 4, height: 6 },
  rightHand: { name: 'Mão Direita', x: 78, y: 57, width: 4, height: 6 },
  chest: { name: 'Tórax', x: 50, y: 30, width: 16, height: 12 },
  abdomen: { name: 'Abdômen', x: 50, y: 42, width: 12, height: 10 },
  pelvis: { name: 'Pelve', x: 50, y: 52, width: 10, height: 8 },
  leftHip: { name: 'Quadril Esquerdo', x: 40, y: 60, width: 6, height: 8 },
  rightHip: { name: 'Quadril Direito', x: 60, y: 60, width: 6, height: 8 },
  leftThigh: { name: 'Coxa Esquerda', x: 38, y: 68, width: 8, height: 18 },
  rightThigh: { name: 'Coxa Direita', x: 62, y: 68, width: 8, height: 18 },
  leftKnee: { name: 'Joelho Esquerdo', x: 40, y: 86, width: 6, height: 6 },
  rightKnee: { name: 'Joelho Direito', x: 60, y: 86, width: 6, height: 6 },
  leftCalf: { name: 'Panturrilha Esquerda', x: 39, y: 92, width: 7, height: 15 },
  rightCalf: { name: 'Panturrilha Direita', x: 61, y: 92, width: 7, height: 15 },
  leftFoot: { name: 'Pé Esquerdo', x: 38, y: 107, width: 8, height: 6 },
  rightFoot: { name: 'Pé Direito', x: 62, y: 107, width: 8, height: 6 },
}

const painColors = {
  0: '#22c55e', 1: '#22c55e', 2: '#22c55e',
  3: '#f59e0b', 4: '#f59e0b', 5: '#f59e0b',
  6: '#f97316', 7: '#f97316', 8: '#f97316',
  9: '#ef4444', 10: '#ef4444'
}

export function BodyMapAdvanced({
  painPoints,
  onSavePainPoint,
  onDeletePainPoint,
  onSaveSession,
  readOnly = false,
  className = ''
}: BodyMapAdvancedProps) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [zoom, setZoom] = useState(1)
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null)
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null)
  const [isPainModalOpen, setIsPainModalOpen] = useState(false)
  const [editingPainPoint, setEditingPainPoint] = useState<PainPoint | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const showNotification = useNotifications()

  const getBodyPartAt = useCallback((x: number, y: number): string | null => {
    for (const [key, part] of Object.entries(bodyParts)) {
      const minX = part.x - part.width / 2
      const maxX = part.x + part.width / 2
      const minY = part.y - part.height / 2
      const maxY = part.y + part.height / 2
      
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return key
      }
    }
    return null
  }, [])

  const handleSVGClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return

    const svg = event.currentTarget
    const rect = svg.getBoundingClientRect()
    const svgX = ((event.clientX - rect.left) / rect.width) * 100
    const svgY = ((event.clientY - rect.top) / rect.height) * 110

    const bodyPart = getBodyPartAt(svgX, svgY)
    
    if (bodyPart) {
      // Check if there's already a pain point at this location
      const existingPainPoint = painPoints.find(point => 
        point.bodyPart === bodyPart && 
        Math.abs(point.xCoordinate - svgX) < 3 && 
        Math.abs(point.yCoordinate - svgY) < 3
      )

      setSelectedBodyPart(bodyPart)
      setClickCoordinates({ x: svgX, y: svgY })
      setEditingPainPoint(existingPainPoint || null)
      setIsPainModalOpen(true)
    }
  }, [readOnly, painPoints, getBodyPartAt])

  const handleSavePainPoint = async (painPoint: Omit<PainPoint, 'sessionDate'>) => {
    try {
      await onSavePainPoint(painPoint)
      setHasUnsavedChanges(true)
      showNotification.success('Ponto de dor salvo com sucesso')
    } catch (error) {
      showNotification.error('Erro ao salvar ponto de dor')
    }
  }

  const handleDeletePainPoint = async (id: number) => {
    try {
      await onDeletePainPoint(id)
      setHasUnsavedChanges(true)
      showNotification.success('Ponto de dor removido')
    } catch (error) {
      showNotification.error('Erro ao remover ponto de dor')
    }
  }

  const handleSaveSession = async () => {
    try {
      await onSaveSession()
      setHasUnsavedChanges(false)
      showNotification.success('Sessão salva com sucesso')
    } catch (error) {
      showNotification.error('Erro ao salvar sessão')
    }
  }

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const resetZoom = () => setZoom(1)

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Mapa Corporal Interativo
          </h3>
          <p className="text-sm text-slate-600">
            {readOnly ? 'Visualização dos pontos de dor' : 'Clique no corpo para adicionar pontos de dor'}
          </p>
        </div>

        <div className="flex gap-2">
          {!readOnly && hasUnsavedChanges && (
            <Button
              onClick={handleSaveSession}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Sessão
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 p-3 bg-slate-50 rounded-lg">
        <div className="flex gap-2">
          <Button
            variant={view === 'front' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('front')}
          >
            Vista Frontal
          </Button>
          <Button
            variant={view === 'back' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('back')}
          >
            Vista Traseira
          </Button>
        </div>

        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body Map SVG */}
      <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden">
        <motion.div
          className="flex justify-center p-4"
          animate={{ scale: zoom }}
          transition={{ type: "tween", duration: 0.2 }}
        >
          <svg
            viewBox="0 0 100 110"
            className="w-full max-w-md cursor-crosshair"
            style={{ maxHeight: '600px' }}
            onClick={handleSVGClick}
          >
            {/* Body outline */}
            <path
              d="M50 8 C46 8 42 10 42 14 L42 24 C38 24 34 26 34 30 L32 32 L28 32 L28 46 L25 46 L25 58 L30 58 L30 48 L35 48 L38 62 L38 82 L40 82 L40 88 L39 88 L39 102 L46 102 L46 88 L44 88 L44 82 L46 82 L46 62 L50 54 L54 62 L54 82 L56 82 L56 88 L54 88 L54 102 L61 102 L61 88 L60 88 L60 82 L62 82 L62 62 L65 48 L70 48 L70 58 L75 58 L75 46 L72 46 L72 32 L68 32 L66 30 C66 26 62 24 58 24 L58 14 C58 10 54 8 50 8 Z"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.5"
              opacity="0.6"
            />

            {/* Pain points */}
            <AnimatePresence>
              {painPoints.map((point) => (
                <motion.g
                  key={point.id || `${point.xCoordinate}-${point.yCoordinate}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.2 }}
                >
                  <circle
                    cx={point.xCoordinate}
                    cy={point.yCoordinate}
                    r="2"
                    fill={painColors[point.painLevel as keyof typeof painColors]}
                    stroke="white"
                    strokeWidth="0.5"
                    className="cursor-pointer drop-shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!readOnly) {
                        setEditingPainPoint(point)
                        setSelectedBodyPart(point.bodyPart)
                        setClickCoordinates({ x: point.xCoordinate, y: point.yCoordinate })
                        setIsPainModalOpen(true)
                      }
                    }}
                  />
                  <text
                    x={point.xCoordinate}
                    y={point.yCoordinate + 0.5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="1.5"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {point.painLevel}
                  </text>
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>
        </motion.div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Pain Points Summary */}
      {painPoints.length > 0 && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-3">
            Pontos de Dor Identificados ({painPoints.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {painPoints.map((point) => (
              <div
                key={point.id || `${point.xCoordinate}-${point.yCoordinate}`}
                className="flex items-center gap-3 p-3 bg-white rounded border border-slate-200"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{
                    backgroundColor: painColors[point.painLevel as keyof typeof painColors]
                  }}
                >
                  {point.painLevel}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {bodyParts[point.bodyPart]?.name || point.bodyPart}
                  </p>
                  {point.description && (
                    <p className="text-sm text-slate-600 truncate">
                      {point.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pain Point Modal */}
      <PainPointModal
        isOpen={isPainModalOpen}
        onClose={() => {
          setIsPainModalOpen(false)
          setEditingPainPoint(null)
          setSelectedBodyPart(null)
          setClickCoordinates(null)
        }}
        onSave={handleSavePainPoint}
        onDelete={editingPainPoint?.id ? handleDeletePainPoint : undefined}
        painPoint={editingPainPoint}
        bodyPartName={selectedBodyPart ? bodyParts[selectedBodyPart]?.name || selectedBodyPart : ''}
        coordinates={clickCoordinates || { x: 0, y: 0 }}
      />
    </Card>
  )
}
