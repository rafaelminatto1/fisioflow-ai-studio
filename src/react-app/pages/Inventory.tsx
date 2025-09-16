import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Wrench,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  AlertCircle,
  Package2,
  ShoppingCart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { AdvancedSearchFilter } from '@/react-app/components/enhanced/AdvancedSearchFilter'
import { InventoryForm } from '@/react-app/components/InventoryForm'
import { DefectForm } from '@/react-app/components/DefectForm'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: number
  name: string
  description?: string
  category: string
  current_quantity: number
  min_quantity: number
  unit: string
  location?: string
  supplier?: string
  cost_per_unit?: number
  last_purchase_date?: string
  stock_status: 'OK' | 'LOW' | 'CRITICAL'
  defect_count: number
  open_defects: number
  created_at: string
  updated_at: string
}

interface InventoryAlert {
  id: number
  name: string
  current_quantity: number
  min_quantity: number
  category: string
  alert_level: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK'
}

const categoryOptions = [
  { value: 'CONSUMIVEL', label: 'Consumível' },
  { value: 'EQUIPAMENTO', label: 'Equipamento' },
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'ESCRITORIO', label: 'Escritório' },
  { value: 'LIMPEZA', label: 'Limpeza' },
  { value: 'OUTROS', label: 'Outros' }
]

const stockStatusColors = {
  'OK': 'bg-green-100 text-green-800',
  'LOW': 'bg-yellow-100 text-yellow-800',
  'CRITICAL': 'bg-red-100 text-red-800'
}

const stockStatusIcons = {
  'OK': CheckCircle,
  'LOW': AlertTriangle,
  'CRITICAL': XCircle
}

export default function Inventory() {
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({})
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showDefectForm, setShowDefectForm] = useState(false)
  const [defectItem, setDefectItem] = useState<InventoryItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  const authFetch = useAuthenticatedFetch()
  const notifications = useNotifications()

  // Fetch inventory items
  const { 
    data: inventoryItems, 
    refetch: refetchInventory,
    loading: loadingItems
  } = useOptimizedAuthFetch<InventoryItem[]>('inventory-items', `/api/inventory?category=${selectedCategory}&lowStock=${showLowStockOnly}`, {
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  })

  // Fetch inventory alerts
  const { 
    data: inventoryAlerts,
    refetch: refetchAlerts
  } = useOptimizedAuthFetch<InventoryAlert[]>('inventory-alerts', '/api/inventory/alerts', {
    staleTime: 1 * 60 * 1000,
    cacheTime: 3 * 60 * 1000
  })

  // Filter options for advanced search
  const filterOptions = [
    {
      key: 'category',
      label: 'Categoria',
      type: 'select' as const,
      options: categoryOptions
    },
    {
      key: 'location',
      label: 'Localização',
      type: 'text' as const
    },
    {
      key: 'supplier',
      label: 'Fornecedor',
      type: 'text' as const
    },
    {
      key: 'stockStatus',
      label: 'Status do Estoque',
      type: 'select' as const,
      options: [
        { value: 'OK', label: 'Adequado' },
        { value: 'LOW', label: 'Baixo' },
        { value: 'CRITICAL', label: 'Crítico' }
      ]
    }
  ]

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    if (!inventoryItems) return []
    
    return inventoryItems.filter(item => {
      // Apply search filters
      if (searchFilters.category && item.category !== searchFilters.category) return false
      if (searchFilters.location && !item.location?.toLowerCase().includes(searchFilters.location.toLowerCase())) return false
      if (searchFilters.supplier && !item.supplier?.toLowerCase().includes(searchFilters.supplier.toLowerCase())) return false
      if (searchFilters.stockStatus && item.stock_status !== searchFilters.stockStatus) return false
      
      return true
    })
  }, [inventoryItems, searchFilters])

  // Search function
  const handleSearch = async () => {
    // This will trigger a new API call with search term
    // For now, we'll refetch with the search parameter
    // In a real implementation, you'd pass the searchTerm to the API
    await refetchInventory()
  }

  // Stats calculations
  const stats = useMemo(() => {
    if (!inventoryItems) return { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }
    
    const lowStock = inventoryItems.filter(item => item.stock_status === 'LOW' || item.stock_status === 'CRITICAL').length
    const outOfStock = inventoryItems.filter(item => item.current_quantity === 0).length
    const totalValue = inventoryItems.reduce((sum, item) => {
      return sum + (item.current_quantity * (item.cost_per_unit || 0))
    }, 0)
    
    return {
      total: inventoryItems.length,
      lowStock,
      outOfStock,
      totalValue
    }
  }, [inventoryItems])

  const handleCreateItem = async (itemData: any) => {
    try {
      const response = await authFetch('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(itemData)
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Item criado com sucesso!')
        setShowForm(false)
        await refetchInventory()
        await refetchAlerts()
      } else {
        notifications.error(result.error || 'Erro ao criar item')
      }
    } catch (error) {
      notifications.error('Erro ao criar item')
    }
  }

  const handleUpdateItem = async (itemData: any) => {
    if (!editingItem) return
    
    try {
      const response = await authFetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Item atualizado com sucesso!')
        setEditingItem(null)
        setShowForm(false)
        await refetchInventory()
        await refetchAlerts()
      } else {
        notifications.error(result.error || 'Erro ao atualizar item')
      }
    } catch (error) {
      notifications.error('Erro ao atualizar item')
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    
    try {
      const response = await authFetch(`/api/inventory/${itemId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Item excluído com sucesso!')
        await refetchInventory()
        await refetchAlerts()
      } else {
        notifications.error(result.error || 'Erro ao excluir item')
      }
    } catch (error) {
      notifications.error('Erro ao excluir item')
    }
  }

  const handleReportDefect = async (defectData: any) => {
    if (!defectItem) return
    
    try {
      const response = await authFetch(`/api/inventory/${defectItem.id}/defect`, {
        method: 'POST',
        body: JSON.stringify(defectData)
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Defeito registrado com sucesso!')
        setShowDefectForm(false)
        setDefectItem(null)
        await refetchInventory()
      } else {
        notifications.error(result.error || 'Erro ao registrar defeito')
      }
    } catch (error) {
      notifications.error('Erro ao registrar defeito')
    }
  }

  const handleUpdateQuantity = async (itemId: number, quantity: number, operation: string = 'SET') => {
    try {
      const response = await authFetch(`/api/inventory/${itemId}/quantity`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity, operation })
      })
      
      const result = await response.json()
      if (result.success) {
        notifications.success('Quantidade atualizada com sucesso!')
        await refetchInventory()
        await refetchAlerts()
      } else {
        notifications.error(result.error || 'Erro ao atualizar quantidade')
      }
    } catch (error) {
      notifications.error('Erro ao atualizar quantidade')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Inventário da Clínica
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie insumos, equipamentos e controle de estoque
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={showLowStockOnly ? 'bg-red-50 border-red-200 text-red-700' : ''}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {showLowStockOnly ? 'Mostrar Todos' : 'Apenas Baixo Estoque'}
          </Button>
          
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">Total de Itens</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 font-medium">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {inventoryAlerts && inventoryAlerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Alertas de Estoque ({inventoryAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryAlerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{alert.name}</h4>
                    <Badge variant={alert.alert_level === 'OUT_OF_STOCK' ? 'destructive' : 'warning'}>
                      {alert.alert_level === 'OUT_OF_STOCK' ? 'Sem Estoque' : 
                       alert.alert_level === 'CRITICAL' ? 'Crítico' : 'Baixo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Atual: {alert.current_quantity} / Mínimo: {alert.min_quantity}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{alert.category}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <AdvancedSearchFilter
        onSearch={handleSearch}
        onFilter={setSearchFilters}
        filterOptions={filterOptions}
        searchPlaceholder="Buscar por nome ou descrição..."
      />

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('ALL')}
        >
          Todos
        </Button>
        {categoryOptions.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map((item, index) => {
            const StatusIcon = stockStatusIcons[item.stock_status]
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge className={stockStatusColors[item.stock_status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {item.stock_status === 'OK' ? 'Adequado' : 
                             item.stock_status === 'LOW' ? 'Baixo' : 'Crítico'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingItem(item)
                            setShowForm(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Quantidade</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, 1, 'SUBTRACT')}
                            disabled={item.current_quantity === 0}
                          >
                            <TrendingDown className="w-3 h-3" />
                          </Button>
                          <span className="font-semibold px-3 py-1 bg-slate-100 rounded">
                            {item.current_quantity} {item.unit}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, 1, 'ADD')}
                          >
                            <TrendingUp className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Mínimo: {item.min_quantity} {item.unit}</span>
                        {item.cost_per_unit && (
                          <span className="text-slate-600">
                            {formatCurrency(item.cost_per_unit)}/{item.unit}
                          </span>
                        )}
                      </div>

                      {item.location && (
                        <div className="text-sm text-slate-600">
                          📍 {item.location}
                        </div>
                      )}

                      {item.open_defects > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-700">
                            {item.open_defects} defeito(s) em aberto
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDefectItem(item)
                            setShowDefectForm(true)
                          }}
                          className="flex-1"
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          Reportar Defeito
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loadingItems && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loadingItems && filteredItems.length === 0 && (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package2 className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum item encontrado</h3>
            <p className="text-slate-500 text-center mb-4">
              {searchFilters && Object.keys(searchFilters).length > 0 
                ? 'Nenhum item corresponde aos filtros aplicados' 
                : 'Comece adicionando itens ao seu inventário'}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <InventoryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingItem(null)
        }}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        initialData={editingItem}
        mode={editingItem ? 'edit' : 'create'}
      />

      <DefectForm
        isOpen={showDefectForm}
        onClose={() => {
          setShowDefectForm(false)
          setDefectItem(null)
        }}
        onSubmit={handleReportDefect}
        item={defectItem}
      />
    </div>
  )
}
