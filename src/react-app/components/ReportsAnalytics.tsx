import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Activity,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

interface ReportsAnalyticsProps {
  data: {
    revenueChart: Array<{ month: string; revenue: number }>
    appointmentsBySpecialty: Array<{ name: string; value: number }>
    monthlyStats: Array<{ month: string; appointments: number; revenue: number; patients: number }>
    weeklyTrends: Array<{ day: string; appointments: number; completionRate: number }>
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function ReportsAnalytics({ data }: ReportsAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedReport, setSelectedReport] = useState('overview')

  const periodOptions = [
    { value: '1month', label: 'Último mês' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: '1year', label: 'Último ano' }
  ]

  const reportTypes = [
    { value: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { value: 'financial', label: 'Financeiro', icon: DollarSign },
    { value: 'appointments', label: 'Agendamentos', icon: Calendar },
    { value: 'patients', label: 'Pacientes', icon: Users }
  ]

  const generatePDF = () => {
    // TODO: Implement PDF generation
    console.log('Generating PDF report...')
  }

  const generateExcel = () => {
    // TODO: Implement Excel export
    console.log('Generating Excel report...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Relatórios e Análises</h2>
          <p className="text-slate-600">Análise detalhada do desempenho da clínica</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <Button variant="outline" onClick={generatePDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          
          <Button variant="outline" onClick={generateExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </motion.div>

      {/* Report Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {reportTypes.map(type => {
          const Icon = type.icon
          return (
            <Button
              key={type.value}
              variant={selectedReport === type.value ? 'default' : 'outline'}
              onClick={() => setSelectedReport(type.value)}
              className="whitespace-nowrap"
            >
              <Icon className="w-4 h-4 mr-2" />
              {type.label}
            </Button>
          )
        })}
      </motion.div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Specialty Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Distribuição por Especialidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.appointmentsBySpecialty}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.appointmentsBySpecialty.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {data.appointmentsBySpecialty.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Performance Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="appointments" fill="#3b82f6" name="Agendamentos" />
                    <Bar yAxisId="left" dataKey="patients" fill="#10b981" name="Pacientes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Financial Report */}
      {selectedReport === 'financial' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Relatório Financeiro Detalhado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    R$ {data.revenueChart.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-slate-600">Receita Total</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    R$ {(data.revenueChart.reduce((sum, item) => sum + item.revenue, 0) * 0.15).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-slate-600">Despesas (estimado)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    R$ {(data.revenueChart.reduce((sum, item) => sum + item.revenue, 0) * 0.85).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-slate-600">Lucro Líquido</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Appointments Report */}
      {selectedReport === 'appointments' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Agendamentos por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Taxa de Conclusão Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Taxa de Conclusão']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardHeader>
            <CardTitle className="text-slate-900">Insights Principais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Badge variant="success">📈 Crescimento</Badge>
                <p className="text-sm text-slate-700">
                  Receita cresceu 15% no último trimestre
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="info">👥 Pacientes</Badge>
                <p className="text-sm text-slate-700">
                  Taxa de retenção de pacientes: 85%
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="warning">⏰ Eficiência</Badge>
                <p className="text-sm text-slate-700">
                  Horário de pico: 14h-16h (30% dos agendamentos)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
