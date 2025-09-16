import { useState, useEffect, memo, useMemo } from 'react'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { PageSkeleton } from '@/react-app/components/PageSkeleton'
import { StatCard } from '@/react-app/components/enhanced/StatCard'
import { motion } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Eye,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { DashboardData } from '@/shared/types'
import { formatCurrency, formatDate } from '@/lib/utils'

// Memoized components for better performance

const QuickAction = memo(({ icon: Icon, title, onClick, variant = "outline" }: any) => (
  <Button variant={variant} className="w-full justify-start" onClick={onClick}>
    <Icon className="w-4 h-4 mr-3" />
    {title}
  </Button>
));

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    activePatients: 0,
    monthlyRevenue: 0,
    noShowRate: 0,
    avgSatisfaction: 0,
    todayAppointments: 0,
    user: { name: 'Dr. Ana Silva' },
    revenueChart: [],
    specialtyDistribution: [],
    todaySchedule: [],
    alerts: [
      { type: 'warning', title: 'Pacientes em Atraso', message: '3 pacientes não compareceram hoje' },
      { type: 'info', title: 'Agenda Lotada', message: 'Semana que vem está 95% ocupada' },
      { type: 'error', title: 'Equipamento', message: 'Manutenção do ultrassom agendada' }
    ]
  })

  // Use optimized authenticated fetch for dashboard data
  const { 
    data: dashboardData, 
    loading, 
    isRevalidating,
    refetch 
  } = useOptimizedAuthFetch('dashboard-data', '/api/dashboard', {
    staleTime: 60 * 1000, // 1 minute fresh
    cacheTime: 5 * 60 * 1000, // 5 minutes total cache
    refetchOnWindowFocus: true
  })

  // Update local state when optimized fetch returns data
  useEffect(() => {
    if (dashboardData) {
      setData(prevData => ({ ...prevData, ...dashboardData }))
    }
  }, [dashboardData])

  const statusColors = {
    CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
    SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Memoize heavy computations
  const alertIcons = useMemo(() => ({
    warning: AlertTriangle,
    error: AlertTriangle,
    info: CheckCircle
  }), [])

  const alertColors = useMemo(() => ({
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }), [])

  const statCards = useMemo(() => [
    {
      title: "Pacientes Ativos",
      value: data.activePatients,
      trend: { value: 12, label: "este mês", type: "up" as const },
      icon: Users,
      color: "blue" as const
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(data.monthlyRevenue),
      trend: { value: 8.2, label: "este mês", type: "up" as const },
      icon: DollarSign,
      color: "green" as const
    },
    {
      title: "Taxa de Satisfação",
      value: `${data.avgSatisfaction}/5`,
      trend: { value: 2.1, label: "avaliação", type: "up" as const },
      icon: Star,
      color: "purple" as const
    },
    {
      title: "Taxa de Ausência",
      value: `${data.noShowRate}%`,
      trend: { value: 3.2, label: "da média", type: "down" as const },
      icon: Clock,
      color: "orange" as const
    }
  ], [data])

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bem-vinda, {data.user.name}!</h1>
            <p className="text-blue-100 mt-1">
              Aqui está um resumo da sua clínica hoje, {formatDate(new Date())}
              {isRevalidating && <span className="text-blue-200 ml-2">• Atualizando...</span>}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.todayAppointments}</div>
              <div className="text-sm text-blue-100">Consultas Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.activePatients}</div>
              <div className="text-sm text-blue-100">Pacientes Ativos</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics - Enhanced with new StatCard component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            delay={0.1 + index * 0.1}
            color={stat.color}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-md border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Agenda de Hoje
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.todaySchedule.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{appointment.time}</div>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {appointment.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{appointment.patientName}</h4>
                      <p className="text-sm text-slate-600">{appointment.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                      {appointment.status === 'CONFIRMED' ? 'Confirmado' : 'Agendado'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              
              {data.todaySchedule.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhum agendamento para hoje</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts and Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* Alerts */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.map((alert, index) => {
                const Icon = alertIcons[alert.type]
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`p-3 rounded-lg border ${alertColors[alert.type]}`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="text-sm font-medium">{alert.title}</h5>
                        <p className="text-xs mt-1 opacity-80">{alert.message}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>

          {/* Quick Actions - Optimized */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickAction
                icon={Calendar}
                title="Novo Agendamento"
                variant="default"
                onClick={() => window.location.href = '/appointments'}
              />
              <QuickAction
                icon={Users}
                title="Cadastrar Paciente"
                onClick={() => window.location.href = '/patients'}
              />
              <QuickAction
                icon={CheckCircle}
                title="Confirmar Consultas"
                onClick={() => refetch()}
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">
                    <strong>Maria Silva</strong> confirmou consulta
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600">
                    Novo paciente <strong>João Santos</strong> cadastrado
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-slate-600">
                    Prescrição criada para <strong>Ana Costa</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-slate-600">
                    <strong>Carlos Oliveira</strong> reagendou consulta
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
