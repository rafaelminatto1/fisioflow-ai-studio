import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  TrendingUp,
  Eye,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { useNavigate } from 'react-router'

interface RecentActivityProps {
  appointments?: any[]
  transactions?: any[]
  patients?: any[]
  limit?: number
}

export function RecentActivity({ 
  appointments = [], 
  transactions = [], 
  patients = [],
  limit = 5 
}: RecentActivityProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'appointments' | 'patients' | 'transactions'>('all')

  // Create unified activity feed
  const activityItems = [
    ...appointments.slice(0, limit).map((apt: any) => ({
      id: `apt-${apt.id}`,
      type: 'appointment',
      title: `Consulta agendada - ${apt.patientName || 'Paciente'}`,
      description: apt.service || apt.type,
      time: apt.appointmentDate,
      status: apt.status,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => navigate(`/appointments`)
    })),
    ...transactions.slice(0, limit).map((txn: any) => ({
      id: `txn-${txn.id}`,
      type: 'transaction',
      title: txn.type === 'INCOME' ? 'Pagamento recebido' : 'Despesa registrada',
      description: `${txn.description} - ${formatCurrency(txn.amount)}`,
      time: txn.date,
      status: txn.status,
      icon: DollarSign,
      color: txn.type === 'INCOME' ? 'text-green-600' : 'text-red-600',
      bgColor: txn.type === 'INCOME' ? 'bg-green-50' : 'bg-red-50',
      onClick: () => navigate('/finance')
    })),
    ...patients.slice(0, limit).map((patient: any) => ({
      id: `patient-${patient.id}`,
      type: 'patient',
      title: `Novo paciente cadastrado`,
      description: patient.name,
      time: patient.createdAt,
      status: 'active',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => navigate(`/patients/${patient.id}`)
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, limit * 3)

  const filteredItems = activeTab === 'all' 
    ? activityItems 
    : activityItems.filter(item => item.type === activeTab.slice(0, -1) || (activeTab === 'appointments' && item.type === 'appointment'))

  const tabs = [
    { id: 'all', label: 'Todas', count: activityItems.length },
    { id: 'appointments', label: 'Consultas', count: appointments.length },
    { id: 'patients', label: 'Pacientes', count: patients.length },
    { id: 'transactions', label: 'Financeiro', count: transactions.length }
  ]

  const getStatusColor = (status: string, type: string) => {
    if (type === 'appointment') {
      switch (status) {
        case 'SCHEDULED': return 'bg-yellow-100 text-yellow-700'
        case 'CONFIRMED': return 'bg-green-100 text-green-700'
        case 'COMPLETED': return 'bg-blue-100 text-blue-700'
        case 'CANCELLED': return 'bg-red-100 text-red-700'
        default: return 'bg-slate-100 text-slate-700'
      }
    }
    if (type === 'transaction') {
      switch (status) {
        case 'PAID': return 'bg-green-100 text-green-700'
        case 'PENDING': return 'bg-yellow-100 text-yellow-700'
        case 'OVERDUE': return 'bg-red-100 text-red-700'
        default: return 'bg-slate-100 text-slate-700'
      }
    }
    return 'bg-slate-100 text-slate-700'
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
    if (diffHours > 0) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
    if (diffMinutes > 0) return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`
    return 'Agora há pouco'
  }

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Atividade Recente
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <Eye className="w-4 h-4 mr-2" />
            Ver Tudo
          </Button>
        </div>
        
        {/* Activity Tabs */}
        <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-xs rounded">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={item.onClick}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-all group"
                >
                  <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-2">
                        {item.status && (
                          <Badge className={`text-xs ${getStatusColor(item.status, item.type)}`}>
                            {item.status}
                          </Badge>
                        )}
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 truncate mb-1">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{getRelativeTime(item.time)}</span>
                      </div>
                      
                      <div className="text-xs text-slate-500">
                        {formatDate(item.time)} {formatTime(item.time)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            
            {filteredItems.length > limit && (
              <div className="pt-3 border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver mais atividades ({filteredItems.length - limit}+)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">Nenhuma atividade encontrada</p>
            <p className="text-sm text-slate-500">
              {activeTab === 'all' 
                ? 'Suas atividades recentes aparecerão aqui'
                : `Nenhuma atividade de ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} encontrada`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
