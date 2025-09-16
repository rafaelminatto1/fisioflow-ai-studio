import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Calendar,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { TransactionForm } from '@/react-app/components/TransactionForm'

import { formatCurrency, formatDate } from '@/lib/utils'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { PageSkeleton } from '@/react-app/components/PageSkeleton'

interface FinancialTransaction {
  id: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  amount: number
  date: string
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  patientName?: string
  paymentMethod?: string
  notes?: string
}



export default function Finance() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState('month')
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>(undefined)
  const authenticatedFetch = useAuthenticatedFetch()

  // Fetch transactions with optimized authenticated caching
  const { 
    data: transactionsData, 
    loading: transactionsLoading,
    isRevalidating: transactionsRevalidating,
    refetch: refetchTransactions 
  } = useOptimizedAuthFetch<FinancialTransaction[]>('finance-transactions', '/api/finance/transactions', {
    staleTime: 30 * 1000, // 30 seconds fresh
    cacheTime: 5 * 60 * 1000, // 5 minutes total cache
    refetchOnWindowFocus: true
  })

  // Fetch financial summary with optimized authenticated caching
  const { 
    data: summaryData, 
    loading: summaryLoading 
  } = useOptimizedAuthFetch<{
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    pendingPayments: number
    monthlyGrowth: number
  }>('finance-summary', '/api/finance/summary', {
    staleTime: 2 * 60 * 1000, // 2 minutes fresh
    cacheTime: 10 * 60 * 1000 // 10 minutes total cache
  })

  // Fetch patients with optimized authenticated caching
  const { 
    data: patientsData, 
    loading: patientsLoading 
  } = useOptimizedAuthFetch<any[]>('patients', '/api/patients', {
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    cacheTime: 15 * 60 * 1000 // 15 minutes total cache
  })

  // Fetch revenue chart data with optimized authenticated caching
  const { 
    data: revenueDataRaw
  } = useOptimizedAuthFetch<any[]>('revenue-chart', '/api/finance/revenue-chart', {
    staleTime: 10 * 60 * 1000, // 10 minutes fresh
    cacheTime: 30 * 60 * 1000, // 30 minutes total cache
    enabled: true // Always try to fetch, fallback to mock data if needed
  })

  const loading = transactionsLoading || summaryLoading || patientsLoading

  // Ensure we always have safe data to work with
  const transactions = transactionsData || []
  const patients = patientsData || []
  const summary = summaryData || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    monthlyGrowth: 0
  }
  const revenueData = revenueDataRaw || [
    { month: 'Jan', revenue: 0 },
    { month: 'Fev', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Abr', revenue: 0 },
    { month: 'Mai', revenue: 0 },
    { month: 'Jun', revenue: 0 }
  ]

  

  const filteredTransactions = transactions.filter((transaction: FinancialTransaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.patientName && transaction.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || transaction.type === selectedType
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pago'
      case 'PENDING': return 'Pendente'
      case 'OVERDUE': return 'Vencido'
      default: return status
    }
  }

  

  const handleSaveTransaction = async (transactionData: any) => {
    try {
      const url = editingTransaction ? `/api/finance/transactions/${editingTransaction.id}` : '/api/finance/transactions'
      const method = editingTransaction ? 'PUT' : 'POST'
      
      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(transactionData),
      })

      const result = await response.json()
      
      if (result.success) {
        await refetchTransactions()
        setShowForm(false)
        setEditingTransaction(undefined)
      } else {
        console.error('Failed to save transaction:', result.error)
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }

    try {
      const response = await authenticatedFetch(`/api/finance/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        await refetchTransactions()
      } else {
        console.error('Failed to delete transaction:', result.error)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleNewTransaction = () => {
    setEditingTransaction(undefined)
    setShowForm(true)
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão Financeira
          </h1>
          <p className="text-slate-600 mt-1">
            Controle completo das finanças da sua clínica
            {transactionsRevalidating && <span className="text-blue-500 ml-2">• Atualizando...</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
          <Button 
            onClick={handleNewTransaction}
            className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </motion.div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-green-50 to-green-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Receita Total</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +{summary.monthlyGrowth}% este mês
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-red-50 to-red-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Despesas</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</div>
              <p className="text-xs text-red-600 mt-1">
                <TrendingDown className="inline w-3 h-3 mr-1" />
                -5.2% este mês
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Lucro Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(summary.netProfit)}</div>
              <p className="text-xs text-blue-600 mt-1">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                Margem de {((summary.netProfit / summary.totalRevenue) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="shadow-md border-0 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">A Receber</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{formatCurrency(summary.pendingPayments)}</div>
              <p className="text-xs text-yellow-600 mt-1">
                {transactions.filter((t: FinancialTransaction) => t.status === 'PENDING' || t.status === 'OVERDUE').length} pendente{transactions.filter((t: FinancialTransaction) => t.status === 'PENDING' || t.status === 'OVERDUE').length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="all">Todas as Transações</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="all">Todos os Status</option>
            <option value="PAID">Pago</option>
            <option value="PENDING">Pendente</option>
            <option value="OVERDUE">Vencido</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Este Ano</option>
          </select>
          
          <Button variant="outline" className="shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.6 }}
      >
        <Card className="shadow-md border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Evolução da Receita
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Últimos 6 meses</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {revenueData.map((item: any, index: number) => (
                <div key={item.month} className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.revenue / 50000) * 100}%` }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-md min-h-[20px] flex items-end justify-center pb-2"
                  >
                    <span className="text-xs text-white font-medium">
                      {formatCurrency(item.revenue / 1000)}k
                    </span>
                  </motion.div>
                  <span className="text-xs text-slate-600 mt-2">{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.7 }}
      >
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Transações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTransactions.map((transaction: FinancialTransaction, index: number) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'INCOME' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'INCOME' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{transaction.description}</h4>
                      <div className="flex items-center space-x-3 text-sm text-slate-600">
                        <span>{transaction.category}</span>
                        {transaction.patientName && (
                          <>
                            <span>•</span>
                            <span>{transaction.patientName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      {transaction.paymentMethod && (
                        <p className="text-xs text-slate-500 mt-1">
                          Via {transaction.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                      <Badge className={getStatusColor(transaction.status)}>
                        {getStatusLabel(transaction.status)}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditTransaction(transaction)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma transação encontrada</h3>
                <p className="text-slate-600">
                  {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'As transações aparecerão aqui'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction Form Modal */}
      <TransactionForm
        transaction={editingTransaction}
        patients={patients}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingTransaction(undefined)
        }}
        onSave={handleSaveTransaction}
      />
    </div>
  )
}
