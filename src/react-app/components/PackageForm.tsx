import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Package, Calendar, DollarSign } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch'
import { useNotifications } from '../hooks/useNotifications'

interface PackageFormProps {
  isOpen: boolean
  onClose: () => void
  patientId: number
  patientName: string
  onPackageCreated: () => void
}

export function PackageForm({ isOpen, onClose, patientId, patientName, onPackageCreated }: PackageFormProps) {
  const [packageType, setPackageType] = useState('10_SESSIONS')
  const [totalSessions, setTotalSessions] = useState(10)
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(false)

  const authFetch = useAuthenticatedFetch()
  const { success, error } = useNotifications()

  const packageOptions = [
    { value: '10_SESSIONS', label: '10 Sessões', sessions: 10 },
    { value: '20_SESSIONS', label: '20 Sessões', sessions: 20 },
    { value: '30_SESSIONS', label: '30 Sessões', sessions: 30 },
    { value: 'CUSTOM', label: 'Personalizado', sessions: 0 }
  ]

  const handlePackageTypeChange = (value: string) => {
    setPackageType(value)
    const option = packageOptions.find(opt => opt.value === value)
    if (option && option.sessions > 0) {
      setTotalSessions(option.sessions)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (totalSessions <= 0) {
      error('Número de sessões deve ser maior que zero')
      return
    }

    if (purchasePrice <= 0) {
      error('Preço deve ser maior que zero')
      return
    }

    try {
      setLoading(true)

      const response = await authFetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          packageType,
          totalSessions,
          purchasePrice,
          purchaseDate,
          expiryDate: expiryDate || undefined
        })
      })

      if (response.ok) {
        success('Pacote criado com sucesso')
        onPackageCreated()
        onClose()
        resetForm()
      } else {
        const data = await response.json()
        error(data.error || 'Erro ao criar pacote')
      }
    } catch (err) {
      error('Erro ao criar pacote')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPackageType('10_SESSIONS')
    setTotalSessions(10)
    setPurchasePrice(0)
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setExpiryDate('')
  }

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
                <Package className="w-5 h-5 text-blue-600" />
                Novo Pacote de Sessões
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-slate-600">
              Criando pacote para: <span className="font-medium">{patientName}</span>
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Package Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Pacote
                </label>
                <select
                  value={packageType}
                  onChange={(e) => handlePackageTypeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {packageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Sessions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de Sessões
                </label>
                <input
                  type="number"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={packageType !== 'CUSTOM'}
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor Total do Pacote
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>
                {totalSessions > 0 && purchasePrice > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    Valor por sessão: R$ {(purchasePrice / totalSessions).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data de Compra
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Expiry Date (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data de Validade (Opcional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={purchaseDate}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Deixe vazio para pacotes sem data de validade
                </p>
              </div>

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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Criar Pacote
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
