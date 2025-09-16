import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  DollarSign,
  Clock,
  Target,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Badge } from '@/react-app/components/ui/badge'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
}

function StatsCard({ title, value, change, changeLabel, icon, trend = 'neutral', delay = 0 }: StatsCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />
    return null
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-slate-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              {icon}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </h3>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            {changeLabel && (
              <p className="text-xs text-slate-500">{changeLabel}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface StatsDashboardProps {
  data: {
    totalPatients: number
    activePatients: number
    todayAppointments: number
    weeklyAppointments: number
    monthlyRevenue: number
    monthlyExpenses: number
    netProfit: number
    averageSessionDuration: number
    completionRate: number
    noShowRate: number
    patientGrowth: number
    revenueGrowth: number
  }
}

export function StatsDashboard({ data }: StatsDashboardProps) {
  const stats = [
    {
      title: 'Pacientes Ativos',
      value: data.activePatients,
      change: data.patientGrowth,
      changeLabel: 'vs mês anterior',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      trend: (data.patientGrowth > 0 ? 'up' : data.patientGrowth < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral'
    },
    {
      title: 'Agendamentos Hoje',
      value: data.todayAppointments,
      icon: <Calendar className="w-6 h-6 text-green-600" />
    },
    {
      title: 'Esta Semana',
      value: data.weeklyAppointments,
      icon: <Clock className="w-6 h-6 text-purple-600" />
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${data.monthlyRevenue.toLocaleString('pt-BR')}`,
      change: data.revenueGrowth,
      changeLabel: 'vs mês anterior',
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      trend: (data.revenueGrowth > 0 ? 'up' : data.revenueGrowth < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral'
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${data.netProfit.toLocaleString('pt-BR')}`,
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />
    },
    {
      title: 'Taxa de Conclusão',
      value: `${data.completionRate}%`,
      icon: <Target className="w-6 h-6 text-indigo-600" />
    },
    {
      title: 'Taxa de Faltas',
      value: `${data.noShowRate}%`,
      icon: <Activity className="w-6 h-6 text-red-600" />
    },
    {
      title: 'Duração Média',
      value: `${data.averageSessionDuration} min`,
      icon: <Clock className="w-6 h-6 text-teal-600" />
    }
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Estatísticas da Clínica</h2>
          <p className="text-slate-600">Acompanhe o desempenho da sua clínica</p>
        </div>
        <Badge variant="info" className="text-sm">
          Atualizado agora
        </Badge>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeLabel={stat.changeLabel}
            icon={stat.icon}
            trend={stat.trend}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Insights Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">📈 Crescimento</h4>
                <p className="text-slate-600">
                  {data.patientGrowth > 0 ? 'Crescimento positivo' : 'Estabilidade'} na base de pacientes
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">💰 Financeiro</h4>
                <p className="text-slate-600">
                  Margem de lucro: {((data.netProfit / data.monthlyRevenue) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">⏰ Eficiência</h4>
                <p className="text-slate-600">
                  {data.noShowRate < 10 ? 'Baixa' : 'Alta'} taxa de faltas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
