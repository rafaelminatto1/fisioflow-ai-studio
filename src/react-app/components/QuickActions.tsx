import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  DollarSign,
  FileText,
  Activity,
  ArrowRight,
  Clock,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { useNavigate } from 'react-router'

interface QuickActionsProps {
  onCreateAppointment?: () => void
  onCreatePatient?: () => void
  onCreateTransaction?: () => void
  onCreatePrescription?: () => void
}

export function QuickActions({
  onCreateAppointment,
  onCreatePatient,
  onCreateTransaction,
  onCreatePrescription
}: QuickActionsProps) {
  const navigate = useNavigate()
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const quickActions = [
    {
      id: 'appointment',
      title: 'Novo Agendamento',
      description: 'Marcar consulta rápida',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      onClick: onCreateAppointment || (() => navigate('/appointments'))
    },
    {
      id: 'patient',
      title: 'Novo Paciente',
      description: 'Cadastrar paciente',
      icon: Users,
      color: 'from-green-500 to-green-600',
      onClick: onCreatePatient || (() => navigate('/patients'))
    },
    {
      id: 'transaction',
      title: 'Nova Transação',
      description: 'Registrar pagamento',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      onClick: onCreateTransaction || (() => navigate('/finance'))
    },
    {
      id: 'prescription',
      title: 'Nova Prescrição',
      description: 'Criar protocolo de exercícios',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      onClick: onCreatePrescription || (() => navigate('/prescriptions'))
    }
  ]

  const shortcuts = [
    {
      title: 'Agenda de Hoje',
      count: '8 agendamentos',
      icon: Clock,
      onClick: () => navigate('/appointments')
    },
    {
      title: 'Pacientes Ativos',
      count: '127 pacientes',
      icon: Users,
      onClick: () => navigate('/patients')
    },
    {
      title: 'Mapa Corporal',
      count: 'Ferramenta de avaliação',
      icon: Activity,
      onClick: () => navigate('/body-map')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="shadow-sm border-0 bg-gradient-to-r from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  <Button
                    onClick={action.onClick}
                    className={`w-full h-20 bg-gradient-to-r ${action.color} hover:shadow-lg transition-all duration-300 group ${
                      hoveredAction === action.id ? 'scale-105 shadow-lg' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <div className="font-medium text-white">{action.title}</div>
                        <div className="text-xs text-white/80">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation Shortcuts */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-lg">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => {
              const Icon = shortcut.icon
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={shortcut.onClick}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                      <Icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-900">{shortcut.title}</div>
                      <div className="text-sm text-slate-600">{shortcut.count}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
