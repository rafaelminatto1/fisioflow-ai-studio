import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Save, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface PainPoint {
  id?: number
  bodyPart: string
  xCoordinate: number
  yCoordinate: number
  painLevel: number
  description?: string
  notes?: string
  imageUrl?: string
}

interface PainPointModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (painPoint: PainPoint) => void
  onDelete?: (id: number) => void
  painPoint?: PainPoint | null
  bodyPartName: string
  coordinates: { x: number; y: number }
}

const painColors = {
  0: '#22c55e',  // Verde - Sem dor
  1: '#22c55e',
  2: '#22c55e',
  3: '#f59e0b',  // Amarelo - Dor leve
  4: '#f59e0b',
  5: '#f59e0b',
  6: '#f97316',  // Laranja - Dor moderada
  7: '#f97316',
  8: '#f97316',
  9: '#ef4444',  // Vermelho - Dor intensa
  10: '#ef4444'
}

const painLabels = {
  0: 'Sem dor',
  1: 'Dor muito leve',
  2: 'Dor leve',
  3: 'Dor leve a moderada',
  4: 'Dor moderada',
  5: 'Dor moderada',
  6: 'Dor moderada a intensa',
  7: 'Dor intensa',
  8: 'Dor muito intensa',
  9: 'Dor severa',
  10: 'Dor insuportável'
}

export function PainPointModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  painPoint,
  bodyPartName,
  coordinates
}: PainPointModalProps) {
  const [painLevel, setPainLevel] = useState(painPoint?.painLevel ?? 5)
  const [description, setDescription] = useState(painPoint?.description ?? '')
  const [notes, setNotes] = useState(painPoint?.notes ?? '')
  const [isUploading, setIsUploading] = useState(false)

  const handleSave = () => {
    const newPainPoint: PainPoint = {
      id: painPoint?.id,
      bodyPart: bodyPartName,
      xCoordinate: coordinates.x,
      yCoordinate: coordinates.y,
      painLevel,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      imageUrl: painPoint?.imageUrl
    }

    onSave(newPainPoint)
    onClose()
  }

  const handleDelete = () => {
    if (painPoint?.id && onDelete) {
      onDelete(painPoint.id)
      onClose()
    }
  }

  const handleImageUpload = async (_file: File) => {
    setIsUploading(true)
    // TODO: Implement image upload to storage
    // For now, just simulate upload
    setTimeout(() => {
      setIsUploading(false)
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <Card className="border-0">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {painPoint ? 'Editar' : 'Adicionar'} Ponto de Dor
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {bodyPartName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Pain Level Scale */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Nível de Dor (0-10)
                  </label>
                  
                  {/* Visual Pain Scale */}
                  <div className="grid grid-cols-11 gap-1 mb-4">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPainLevel(i)}
                        className={`
                          h-8 w-full rounded text-xs font-medium transition-all
                          ${painLevel === i 
                            ? 'ring-2 ring-offset-2 ring-slate-400 transform scale-110' 
                            : 'hover:scale-105'
                          }
                        `}
                        style={{
                          backgroundColor: painColors[i as keyof typeof painColors],
                          color: i <= 2 ? '#1f2937' : '#ffffff'
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  
                  {/* Pain Level Description */}
                  <div className="text-center">
                    <div 
                      className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${painColors[painLevel as keyof typeof painColors]}20`,
                        color: painColors[painLevel as keyof typeof painColors]
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: painColors[painLevel as keyof typeof painColors] }}
                      />
                      {painLabels[painLevel as keyof typeof painLabels]}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrição da Dor
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Dor pulsátil, queimação, pontada..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionais sobre o ponto de dor..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Foto da Região (Opcional)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Camera className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-600">
                        {isUploading ? 'Enviando...' : 'Clique para adicionar foto'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                <div>
                  {painPoint && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
