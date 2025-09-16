import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, X, Calendar, User, Tag } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface FilterOption {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'multiselect'
  options?: { value: string; label: string }[]
}

interface AdvancedSearchFilterProps {
  onSearch: (searchTerm: string) => void
  onFilter: (filters: Record<string, any>) => void
  filterOptions: FilterOption[]
  searchPlaceholder?: string
  className?: string
}

export function AdvancedSearchFilter({
  onSearch,
  onFilter,
  filterOptions,
  searchPlaceholder = "Buscar...",
  className = ""
}: AdvancedSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters }
    if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    setActiveFilters(newFilters)
    onFilter(newFilters)
  }

  const clearFilter = (key: string) => {
    const newFilters = { ...activeFilters }
    delete newFilters[key]
    setActiveFilters(newFilters)
    onFilter(newFilters)
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    onFilter({})
  }

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'date': return Calendar
      case 'select': return Tag
      case 'multiselect': return Tag
      default: return User
    }
  }

  const activeFilterCount = Object.keys(activeFilters).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="shadow-sm relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-blue-500">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2 items-center"
        >
          <span className="text-sm text-slate-600">Filtros ativos:</span>
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filterOptions.find(f => f.key === key)
            if (!filter) return null
            
            const displayValue = Array.isArray(value) 
              ? `${value.length} selecionado(s)`
              : filter.options?.find(opt => opt.value === value)?.label || value

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="outline"
                  className="pr-1 bg-blue-50 text-blue-700 border-blue-200"
                >
                  <span className="mr-1">{filter.label}: {displayValue}</span>
                  <button
                    onClick={() => clearFilter(key)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-slate-500 hover:text-slate-700"
          >
            Limpar tudo
          </Button>
        </motion.div>
      )}

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterOptions.map((filter) => {
                    const Icon = getFilterIcon(filter.type)
                    
                    return (
                      <div key={filter.key} className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-700">
                          <Icon className="w-4 h-4 mr-2 text-slate-500" />
                          {filter.label}
                        </label>
                        
                        {filter.type === 'text' && (
                          <input
                            type="text"
                            value={activeFilters[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder={`Filtrar por ${filter.label.toLowerCase()}`}
                          />
                        )}
                        
                        {filter.type === 'select' && (
                          <select
                            value={activeFilters[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          >
                            <option value="">Todos</option>
                            {filter.options?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {filter.type === 'date' && (
                          <input
                            type="date"
                            value={activeFilters[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        )}
                        
                        {filter.type === 'multiselect' && (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {filter.options?.map(option => (
                              <label key={option.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={(activeFilters[filter.key] || []).includes(option.value)}
                                  onChange={(e) => {
                                    const currentValues = activeFilters[filter.key] || []
                                    const newValues = e.target.checked
                                      ? [...currentValues, option.value]
                                      : currentValues.filter((v: string) => v !== option.value)
                                    handleFilterChange(filter.key, newValues)
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
