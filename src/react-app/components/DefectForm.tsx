import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Wrench, DollarSign, FileText } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface DefectFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  item: any
}

const defectTypeOptions = [
  { value: 'MECANICO', label: 'Mecânico' },
  { value: 'ELETRICO', label: 'Elétrico' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'DESGASTE', label: 'Desgaste' },
  { value: 'QUEBRA', label: 'Quebra' },
  { value: 'OUTROS', label: 'Outros' }
]

const severityOptions = [
  { value: 'BAIXO', label: 'Baixo', color: 'bg-green-100 text-green-800' },
  { value: 'MEDIO', label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ALTO', label: 'Alto', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICO', label: 'Crítico', color: 'bg-red-100 text-red-800' }
]

export function DefectForm({ isOpen, onClose, onSubmit, item }: DefectFormProps) {
  const [formData, setFormData] = useState({
    defectDate: new Date().toISOString().split('T')[0],
    description: '',
    defectType: 'MECANICO',
    severity: 'MEDIO',
    repairNotes: '',
    partsNeeded: '',
    estimatedCost: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        defectDate: new Date().toISOString().split('T')[0],
        description: '',
        defectType: 'MECANICO',
        severity: 'MEDIO',
        repairNotes: '',
        partsNeeded: '',
        estimatedCost: ''
      })
      setErrors({})
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.defectDate) {
      newErrors.defectDate = 'Data do defeito é obrigatória'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (formData.estimatedCost && isNaN(Number(formData.estimatedCost))) {
      newErrors.estimatedCost = 'Custo deve ser um número válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const submitData = {
        ...formData,
        estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : undefined
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting defect:', error)
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

  if (!isOpen || !item) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Reportar Defeito
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Item Information */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Item Selecionado</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Defect Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Data do Defeito *
                      </label>
                      <input
                        type="date"
                        value={formData.defectDate}
                        onChange={(e) => handleChange('defectDate', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.defectDate ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.defectDate && <p className="text-red-500 text-sm mt-1">{errors.defectDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tipo de Defeito
                      </label>
                      <select
                        value={formData.defectType}
                        onChange={(e) => handleChange('defectType', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {defectTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nível de Gravidade
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {severityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleChange('severity', option.value)}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            formData.severity === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Badge className={option.color}>{option.label}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Descrição do Defeito *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.description ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="Descreva detalhadamente o problema encontrado..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>
                </div>

                {/* Repair Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Wrench className="w-5 h-5 mr-2 text-blue-500" />
                    Informações de Reparo
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Notas de Reparo
                    </label>
                    <textarea
                      value={formData.repairNotes}
                      onChange={(e) => handleChange('repairNotes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Procedimentos recomendados, observações técnicas..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Peças/Materiais Necessários
                    </label>
                    <textarea
                      value={formData.partsNeeded}
                      onChange={(e) => handleChange('partsNeeded', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Ex: Cabo USB, fusível 10A, tela LCD..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Custo Estimado de Reparo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.estimatedCost}
                      onChange={(e) => handleChange('estimatedCost', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.estimatedCost ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.estimatedCost && <p className="text-red-500 text-sm mt-1">{errors.estimatedCost}</p>}
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
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registrando...
                      </div>
                    ) : (
                      'Registrar Defeito'
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
