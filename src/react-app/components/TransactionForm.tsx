import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { PatientType } from '@/shared/types'

interface FinancialTransaction {
  id?: number
  patientId?: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  amount: number
  date: string
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  paymentMethod?: string
  notes?: string
}

interface TransactionFormProps {
  transaction?: FinancialTransaction
  patients: PatientType[]
  isOpen: boolean
  onClose: () => void
  onSave: (transactionData: any) => void
}

const incomeCategories = [
  'Consulta',
  'Sessão',
  'Avaliação',
  'Pilates',
  'RPG',
  'Hidroterapia',
  'Pacote Mensal',
  'Outros'
]

const expenseCategories = [
  'Aluguel',
  'Equipamentos',
  'Material',
  'Salários',
  'Energia',
  'Água',
  'Internet',
  'Marketing',
  'Manutenção',
  'Outros'
]

const paymentMethods = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência',
  'Boleto'
]

export function TransactionForm({ transaction, patients, isOpen, onClose, onSave }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    patientId: 0,
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    description: '',
    amount: 0,
    date: '',
    status: 'PAID' as 'PAID' | 'PENDING' | 'OVERDUE',
    paymentMethod: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setFormData({
        patientId: transaction.patientId || 0,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod || '',
        notes: transaction.notes || ''
      })
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0]
      
      setFormData({
        patientId: 0,
        type: 'INCOME',
        category: '',
        description: '',
        amount: 0,
        date: today,
        status: 'PAID',
        paymentMethod: '',
        notes: ''
      })
    }
    setErrors({})
  }, [transaction, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.category.trim()) {
      newErrors.category = 'Categoria é obrigatória'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero'
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        patientId: formData.patientId || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes || undefined
      }
      await onSave(submitData)
    } catch (error) {
      console.error('Error saving transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Reset category when type changes
    if (field === 'type') {
      setFormData(prev => ({ ...prev, category: '' }))
    }
  }

  const availableCategories = formData.type === 'INCOME' ? incomeCategories : expenseCategories

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {transaction ? 'Editar Transação' : 'Nova Transação'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Type */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                    Tipo de Transação
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.type === 'INCOME'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="INCOME"
                        checked={formData.type === 'INCOME'}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="sr-only"
                      />
                      <TrendingUp className="w-5 h-5 mr-2" />
                      <span className="font-medium">Receita</span>
                    </label>

                    <label
                      className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.type === 'EXPENSE'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="EXPENSE"
                        checked={formData.type === 'EXPENSE'}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="sr-only"
                      />
                      <TrendingDown className="w-5 h-5 mr-2" />
                      <span className="font-medium">Despesa</span>
                    </label>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.category ? 'border-red-300' : 'border-slate-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                    >
                      <option value="">Selecione uma categoria</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.amount ? 'border-red-300' : 'border-slate-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      placeholder="0,00"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.description ? 'border-red-300' : 'border-slate-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                    placeholder="Descreva a transação"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.date ? 'border-red-300' : 'border-slate-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                    />
                    {errors.date && (
                      <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="PAID">Pago</option>
                      <option value="PENDING">Pendente</option>
                      <option value="OVERDUE">Vencido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.type === 'INCOME' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Paciente
                      </label>
                      <select
                        value={formData.patientId}
                        onChange={(e) => handleChange('patientId', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value={0}>Selecione um paciente (opcional)</option>
                        {patients.map(patient => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => handleChange('paymentMethod', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Selecione a forma de pagamento</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Observações adicionais sobre a transação"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : (transaction ? 'Atualizar' : 'Cadastrar')}
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
