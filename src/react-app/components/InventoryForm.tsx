import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, DollarSign, MapPin, Truck } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface InventoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: any
  mode: 'create' | 'edit'
}

const categoryOptions = [
  { value: 'CONSUMIVEL', label: 'Consumível' },
  { value: 'EQUIPAMENTO', label: 'Equipamento' },
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'ESCRITORIO', label: 'Escritório' },
  { value: 'LIMPEZA', label: 'Limpeza' },
  { value: 'OUTROS', label: 'Outros' }
]

const unitOptions = [
  { value: 'UN', label: 'Unidade' },
  { value: 'CX', label: 'Caixa' },
  { value: 'PC', label: 'Pacote' },
  { value: 'L', label: 'Litro' },
  { value: 'ML', label: 'Mililitro' },
  { value: 'KG', label: 'Quilograma' },
  { value: 'G', label: 'Grama' },
  { value: 'M', label: 'Metro' },
  { value: 'CM', label: 'Centímetro' }
]

export function InventoryForm({ isOpen, onClose, onSubmit, initialData, mode }: InventoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CONSUMIVEL',
    currentQuantity: 0,
    minQuantity: 10,
    unit: 'UN',
    location: '',
    supplier: '',
    costPerUnit: '',
    lastPurchaseDate: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || 'CONSUMIVEL',
        currentQuantity: initialData.current_quantity || 0,
        minQuantity: initialData.min_quantity || 10,
        unit: initialData.unit || 'UN',
        location: initialData.location || '',
        supplier: initialData.supplier || '',
        costPerUnit: initialData.cost_per_unit ? String(initialData.cost_per_unit) : '',
        lastPurchaseDate: initialData.last_purchase_date || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'CONSUMIVEL',
        currentQuantity: 0,
        minQuantity: 10,
        unit: 'UN',
        location: '',
        supplier: '',
        costPerUnit: '',
        lastPurchaseDate: ''
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (formData.currentQuantity < 0) {
      newErrors.currentQuantity = 'Quantidade não pode ser negativa'
    }

    if (formData.minQuantity < 0) {
      newErrors.minQuantity = 'Quantidade mínima não pode ser negativa'
    }

    if (formData.costPerUnit && isNaN(Number(formData.costPerUnit))) {
      newErrors.costPerUnit = 'Custo deve ser um número válido'
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
        costPerUnit: formData.costPerUnit ? Number(formData.costPerUnit) : undefined,
        lastPurchaseDate: formData.lastPurchaseDate || undefined
      }
      
      await onSubmit(submitData)
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

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  {mode === 'edit' ? 'Editar Item' : 'Novo Item do Inventário'}
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
                    <Package className="w-5 h-5 mr-2 text-blue-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome do Item *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.name ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="Ex: Álcool 70%, Ultrassom..."
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Categoria
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Descrição detalhada do item..."
                    />
                  </div>
                </div>

                {/* Quantity Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-green-500" />
                    Controle de Estoque
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Quantidade Atual *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.currentQuantity}
                        onChange={(e) => handleChange('currentQuantity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.currentQuantity ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.currentQuantity && <p className="text-red-500 text-sm mt-1">{errors.currentQuantity}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Quantidade Mínima *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minQuantity}
                        onChange={(e) => handleChange('minQuantity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.minQuantity ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.minQuantity && <p className="text-red-500 text-sm mt-1">{errors.minQuantity}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Unidade
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {unitOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-purple-500" />
                    Informações Adicionais
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Localização
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: Sala 1, Armário A..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Truck className="w-4 h-4 inline mr-1" />
                        Fornecedor
                      </label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => handleChange('supplier', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Nome do fornecedor..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Custo por Unidade
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costPerUnit}
                        onChange={(e) => handleChange('costPerUnit', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.costPerUnit ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.costPerUnit && <p className="text-red-500 text-sm mt-1">{errors.costPerUnit}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Última Compra
                      </label>
                      <input
                        type="date"
                        value={formData.lastPurchaseDate}
                        onChange={(e) => handleChange('lastPurchaseDate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
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
                      mode === 'edit' ? 'Atualizar Item' : 'Criar Item'
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
