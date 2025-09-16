import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Package, 
  Gift, 
  X, 
  DollarSign,
  Calendar,
  User
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'
import { AppointmentType } from '@/shared/types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentType | null
  onPaymentUpdated: () => void
}

interface PatientPackage {
  id: number
  packageType: string
  totalSessions: number
  sessionsUsed: number
  remainingSessions: number
  status: string
  isActive: boolean
  isExpired: boolean
  purchaseDate: string
  expiryDate?: string
}

interface PricingInfo {
  patientName: string
  effectivePrice: number
  discountAmount: number
  discountPercentage: number
  partnershipTag?: string
  hasCustomPrice: boolean
  hasPartnership: boolean
}

export function PaymentModal({ isOpen, onClose, appointment, onPaymentUpdated }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO')
  const [customAmount, setCustomAmount] = useState<number>(0)
  const [packages, setPackages] = useState<PatientPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [paymentType, setPaymentType] = useState<'individual' | 'package' | 'courtesy'>('individual')
  const [loading, setLoading] = useState(false)
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null)

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  useEffect(() => {
    if (isOpen && appointment) {
      loadPatientData()
    }
  }, [isOpen, appointment])

  const loadPatientData = async () => {
    if (!appointment) return

    try {
      setLoading(true)

      // Load patient packages
      const packagesResponse = await authFetch(`/api/patients/${appointment.patientId}/packages`)
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json()
        setPackages(packagesData.data || [])
      }

      // Load pricing info
      const pricingResponse = await authFetch(`/api/patients/${appointment.patientId}/pricing`)
      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json()
        setPricingInfo(pricingData.data)
        setCustomAmount(pricingData.data.effectivePrice)
      }
    } catch (err) {
      error('Erro ao carregar dados do paciente')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!appointment) return

    try {
      setLoading(true)

      let paymentStatus = 'PENDENTE'
      let priceCharged = 0

      if (paymentType === 'individual') {
        paymentStatus = 'PAGO'
        priceCharged = customAmount
      } else if (paymentType === 'package') {
        paymentStatus = 'PAGA_COM_PACOTE'
        priceCharged = 0
      } else if (paymentType === 'courtesy') {
        paymentStatus = 'CORTESIA'
        priceCharged = 0
      }

      const response = await authFetch(`/api/appointments/${appointment.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus,
          priceCharged,
          paymentMethod: paymentType === 'individual' ? paymentMethod : null,
          packageId: paymentType === 'package' ? selectedPackage : null
        })
      })

      if (response.ok) {
        success('Pagamento atualizado com sucesso')
        onPaymentUpdated()
        onClose()
      } else {
        const data = await response.json()
        error(data.error || 'Erro ao atualizar pagamento')
      }
    } catch (err) {
      error('Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const activePackages = packages.filter(pkg => pkg.isActive && !pkg.isExpired && pkg.remainingSessions > 0)

  const paymentMethods = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'CARTAO_DEBITO', label: 'Cartão Débito' },
    { value: 'CARTAO_CREDITO', label: 'Cartão Crédito' },
    { value: 'TRANSFERENCIA', label: 'Transferência' }
  ]

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Marcar Pagamento
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Appointment Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <User className="w-4 h-4" />
                    {pricingInfo?.patientName || 'Carregando...'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(appointment.appointmentDate).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900">
                    {appointment.service || appointment.type}
                  </div>
                  {pricingInfo?.partnershipTag && (
                    <Badge variant="outline" className="mt-1">
                      {pricingInfo.partnershipTag}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Individual Payment */}
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    paymentType === 'individual' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setPaymentType('individual')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      Pagamento Individual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      R$ {pricingInfo?.effectivePrice.toFixed(2) || '0,00'}
                    </div>
                    {pricingInfo?.discountAmount && pricingInfo.discountAmount > 0 && (
                      <div className="text-sm text-slate-600">
                        <span className="line-through">
                          R$ {(pricingInfo.effectivePrice + pricingInfo.discountAmount).toFixed(2)}
                        </span>
                        <span className="text-green-600 ml-2">
                          -{pricingInfo.discountPercentage}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Package Payment */}
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    paymentType === 'package' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  } ${activePackages.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => activePackages.length > 0 && setPaymentType('package')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="w-5 h-5 text-blue-600" />
                      Usar Pacote
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {activePackages.length > 0 ? 'Disponível' : 'Indisponível'}
                    </div>
                    <div className="text-sm text-slate-600">
                      {activePackages.length > 0 
                        ? `${activePackages.reduce((acc, pkg) => acc + pkg.remainingSessions, 0)} sessões restantes`
                        : 'Nenhum pacote ativo'
                      }
                    </div>
                  </CardContent>
                </Card>

                {/* Courtesy */}
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    paymentType === 'courtesy' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setPaymentType('courtesy')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Gift className="w-5 h-5 text-purple-600" />
                      Cortesia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      R$ 0,00
                    </div>
                    <div className="text-sm text-slate-600">
                      Sessão gratuita
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Payment Details */}
              {paymentType === 'individual' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Valor
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {paymentMethods.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Package Selection */}
              {paymentType === 'package' && activePackages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="block text-sm font-medium text-slate-700">
                    Selecionar Pacote
                  </label>
                  {activePackages.map(pkg => (
                    <Card 
                      key={pkg.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedPackage === pkg.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-900">
                              {pkg.packageType.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-slate-600">
                              Comprado em {new Date(pkg.purchaseDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">
                              {pkg.remainingSessions} restantes
                            </div>
                            <div className="text-sm text-slate-600">
                              de {pkg.totalSessions} sessões
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={loading || (paymentType === 'package' && !selectedPackage)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Confirmar Pagamento
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
