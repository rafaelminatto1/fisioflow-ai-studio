import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, DollarSign, Tag, Percent } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'

interface PricingFormProps {
  isOpen: boolean
  onClose: () => void
  patientId: number
  patientName: string
  currentPricing?: {
    customSessionPrice?: number
    partnershipTag?: string
    discountPercentage?: number
  }
  onPricingUpdated: () => void
}

export function PricingForm({ 
  isOpen, 
  onClose, 
  patientId, 
  patientName, 
  currentPricing,
  onPricingUpdated 
}: PricingFormProps) {
  const [customPrice, setCustomPrice] = useState<number | string>('')
  const [partnershipTag, setPartnershipTag] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState<number | string>('')
  const [defaultPrice, setDefaultPrice] = useState(0)
  const [loading, setLoading] = useState(false)

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  useEffect(() => {
    if (isOpen) {
      loadDefaultPrice()
      if (currentPricing) {
        setCustomPrice(currentPricing.customSessionPrice || '')
        setPartnershipTag(currentPricing.partnershipTag || '')
        setDiscountPercentage(currentPricing.discountPercentage || '')
      }
    }
  }, [isOpen, currentPricing])

  const loadDefaultPrice = async () => {
    try {
      const response = await authFetch('/api/pricing/default')
      if (response.ok) {
        const data = await response.json()
        setDefaultPrice(data.data.defaultSessionPrice || 0)
      }
    } catch (err) {
      console.error('Error loading default price:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      const response = await authFetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSessionPrice: customPrice ? Number(customPrice) : null,
          partnershipTag: partnershipTag.trim() || null,
          discountPercentage: discountPercentage ? Number(discountPercentage) : null
        })
      })

      if (response.ok) {
        success('Precificação atualizada com sucesso')
        onPricingUpdated()
        onClose()
      } else {
        const data = await response.json()
        error(data.error || 'Erro ao atualizar precificação')
      }
    } catch (err) {
      error('Erro ao atualizar precificação')
    } finally {
      setLoading(false)
    }
  }

  const calculateEffectivePrice = () => {
    const basePrice = customPrice ? Number(customPrice) : defaultPrice
    const discount = discountPercentage ? Number(discountPercentage) : 0
    return basePrice * (1 - discount / 100)
  }

  const commonPartnershipTags = [
    'Academia Fitness',
    'Empresa Parceira',
    'Plano de Saúde',
    'Convenio Médico',
    'Desconto Funcionário',
    'Paciente VIP'
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
      >
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Configurar Precificação
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-slate-600">
              Paciente: <span className="font-medium">{patientName}</span>
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Default Price Info */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Valor padrão da clínica:</span>
                  <span className="font-medium text-slate-900">
                    R$ {defaultPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Custom Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor Personalizado (Opcional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Deixe vazio para usar o valor padrão"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Se preenchido, sobrescreve o valor padrão da clínica
                </p>
              </div>

              {/* Partnership Tag */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tag de Parceria (Opcional)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={partnershipTag}
                    onChange={(e) => setPartnershipTag(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: Academia Fitness"
                  />
                </div>
                
                {/* Common Tags */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {commonPartnershipTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => setPartnershipTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Desconto Percentual (Opcional)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: 10"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Desconto aplicado ao valor base (0-100%)
                </p>
              </div>

              {/* Price Preview */}
              {(customPrice || discountPercentage) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    Prévia do Valor Final
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Valor base:</span>
                      <span className="font-medium">
                        R$ {customPrice ? Number(customPrice).toFixed(2) : defaultPrice.toFixed(2)}
                      </span>
                    </div>
                    {discountPercentage && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Desconto ({discountPercentage}%):</span>
                        <span className="font-medium">
                          - R$ {((customPrice ? Number(customPrice) : defaultPrice) * Number(discountPercentage) / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-green-300">
                      <span className="font-medium text-green-800">Valor final:</span>
                      <span className="font-bold text-green-800">
                        R$ {calculateEffectivePrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Salvar Precificação
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
