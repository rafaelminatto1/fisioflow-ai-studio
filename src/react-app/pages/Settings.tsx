import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Building, 
  Bell,
  Lock,
  Database,
  Save,
  Edit,
  Plus,
  Trash2,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'

import { Badge } from '@/react-app/components/ui/badge'

interface ClinicSettings {
  id: number
  name: string
  cnpj: string
  email: string
  phone: string
  address: string
  subscriptionPlan: string
  defaultSessionPrice: number
}

interface UserSettings {
  id: number
  name: string
  email: string
  role: string
  specialties: string
  phone: string
  avatar?: string
}

export default function Settings() {
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    id: 1,
    name: 'Clínica FisioFlow',
    cnpj: '12.345.678/0001-90',
    email: 'contato@fisioflow.com',
    phone: '(11) 3333-4444',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    subscriptionPlan: 'PROFESSIONAL',
    defaultSessionPrice: 0
  })

  const [userSettings, setUserSettings] = useState<UserSettings>({
    id: 1,
    name: 'Dr. Ana Silva',
    email: 'ana.silva@fisioflow.com',
    role: 'FISIOTERAPEUTA',
    specialties: 'Ortopedia, RPG',
    phone: '(11) 99999-9999'
  })

  const [users, setUsers] = useState<UserSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [editingClinic, setEditingClinic] = useState(false)
  const [editingUser, setEditingUser] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Load clinic settings including default price
      const response = await fetch('/api/pricing/default')
      if (response.ok) {
        const data = await response.json()
        setClinicSettings(prev => ({
          ...prev,
          defaultSessionPrice: data.data.defaultSessionPrice || 0
        }))
      }

      // Mock data for users - in a real app, these would come from APIs
      const mockUsers: UserSettings[] = [
        {
          id: 1,
          name: 'Dr. Ana Silva',
          email: 'ana.silva@fisioflow.com',
          role: 'FISIOTERAPEUTA',
          specialties: 'Ortopedia, RPG',
          phone: '(11) 99999-9999'
        },
        {
          id: 2,
          name: 'Dr. João Santos',
          email: 'joao.santos@fisioflow.com',
          role: 'FISIOTERAPEUTA',
          specialties: 'Neurologia, Pilates',
          phone: '(11) 88888-8888'
        }
      ]
      
      setUsers(mockUsers)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClinic = async () => {
    try {
      // Save default session price
      const response = await fetch('/api/pricing/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultSessionPrice: clinicSettings.defaultSessionPrice
        })
      })

      if (response.ok) {
        console.log('Clinic settings saved successfully')
        setEditingClinic(false)
      } else {
        throw new Error('Failed to save clinic settings')
      }
    } catch (error) {
      console.error('Error saving clinic settings:', error)
    }
  }

  const handleSaveUser = async () => {
    try {
      console.log('Saving user settings:', userSettings)
      setEditingUser(false)
      // In a real app, this would call an API
    } catch (error) {
      console.error('Error saving user settings:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
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
            Configurações
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie as configurações da clínica e usuários
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinic Settings */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-md border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Dados da Clínica
                </CardTitle>
                <Button
                  size="sm"
                  variant={editingClinic ? "default" : "outline"}
                  onClick={() => editingClinic ? handleSaveClinic() : setEditingClinic(true)}
                  className={editingClinic ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
                >
                  {editingClinic ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {editingClinic ? 'Salvar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da Clínica
                </label>
                <input
                  type="text"
                  value={clinicSettings.name}
                  onChange={(e) => setClinicSettings(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!editingClinic}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={clinicSettings.cnpj}
                    onChange={(e) => setClinicSettings(prev => ({ ...prev, cnpj: e.target.value }))}
                    disabled={!editingClinic}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={clinicSettings.phone}
                    onChange={(e) => setClinicSettings(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editingClinic}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={clinicSettings.email}
                  onChange={(e) => setClinicSettings(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!editingClinic}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Endereço
                </label>
                <textarea
                  value={clinicSettings.address}
                  onChange={(e) => setClinicSettings(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!editingClinic}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Plano de Assinatura
                </label>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                    {clinicSettings.subscriptionPlan === 'PROFESSIONAL' ? 'Profissional' : 'Básico'}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Gerenciar Plano
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor Padrão da Sessão
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="number"
                    value={clinicSettings.defaultSessionPrice}
                    onChange={(e) => setClinicSettings(prev => ({ ...prev, defaultSessionPrice: Number(e.target.value) }))}
                    disabled={!editingClinic}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Este valor será usado como padrão para novas sessões
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Profile */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-md border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-green-600" />
                  Meu Perfil
                </CardTitle>
                <Button
                  size="sm"
                  variant={editingUser ? "default" : "outline"}
                  onClick={() => editingUser ? handleSaveUser() : setEditingUser(true)}
                  className={editingUser ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
                >
                  {editingUser ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {editingUser ? 'Salvar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={userSettings.name}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!editingUser}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={userSettings.email}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!editingUser}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={userSettings.phone}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editingUser}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Especialidades
                </label>
                <input
                  type="text"
                  value={userSettings.specialties}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, specialties: e.target.value }))}
                  disabled={!editingUser}
                  placeholder="Ex: Ortopedia, RPG, Pilates"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Função
                </label>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {userSettings.role === 'FISIOTERAPEUTA' ? 'Fisioterapeuta' : userSettings.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Management */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-md border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-600" />
                Equipe da Clínica
              </CardTitle>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{user.name}</h4>
                      <div className="flex items-center space-x-3 text-sm text-slate-600">
                        <span>{user.email}</span>
                        <span>•</span>
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {user.role === 'FISIOTERAPEUTA' ? 'Fisioterapeuta' : user.role}
                        </Badge>
                        <span className="text-xs text-slate-500">{user.specialties}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" title="Remover">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Other Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-md border-0 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <Bell className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Notificações</h3>
              <p className="text-sm text-slate-600 mb-4">
                Configure lembretes e alertas do sistema
              </p>
              <Button size="sm" variant="outline">
                Configurar
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-md border-0 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <Lock className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Segurança</h3>
              <p className="text-sm text-slate-600 mb-4">
                Altere sua senha e configure 2FA
              </p>
              <Button size="sm" variant="outline">
                Gerenciar
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-md border-0 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <Database className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Backup</h3>
              <p className="text-sm text-slate-600 mb-4">
                Configure backups automáticos dos dados
              </p>
              <Button size="sm" variant="outline">
                Configurar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
