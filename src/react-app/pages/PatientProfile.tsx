import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Edit, 
  Package, 
  Scissors,
  DollarSign,
  ArrowLeft,
  Eye,
  FileText,
  Activity,
  Clock,
  Tag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card'
import { Button } from '@/react-app/components/ui/button'
import { Badge } from '@/react-app/components/ui/badge'
import { useOptimizedAuthFetch } from '@/react-app/hooks/useOptimizedAuthFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { PatientForm } from '@/react-app/components/PatientForm'
import { PackageForm } from '@/react-app/components/PackageForm'
import { SurgeryHistory } from '@/react-app/components/SurgeryHistory'
import { PricingForm } from '@/react-app/components/PricingForm'
import { ConsultationHistory } from '@/react-app/components/ConsultationHistory'
import { PatientType } from '@/shared/types'
import { calculateAge, formatDate, formatCurrency } from '@/lib/utils'

export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patientId = parseInt(id || '0')
  
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [showPricingForm, setShowPricingForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const { success } = useNotifications()

  // Fetch patient data
  const { 
    data: patient, 
    loading: patientLoading, 
    refetch: refetchPatient 
  } = useOptimizedAuthFetch<PatientType>(`patient-${patientId}`, `/api/patients/${patientId}`)

  // Fetch patient packages
  const { 
    data: packages, 
    loading: packagesLoading,
    refetch: refetchPackages 
  } = useOptimizedAuthFetch<any[]>(`patient-packages-${patientId}`, `/api/patients/${patientId}/packages`)

  // Fetch patient pricing
  const { 
    data: pricing,
    refetch: refetchPricing 
  } = useOptimizedAuthFetch<any>(`patient-pricing-${patientId}`, `/api/patients/${patientId}/pricing`)

  useEffect(() => {
    if (patientId <= 0) {
      navigate('/patients')
    }
  }, [patientId, navigate])

  const handlePatientUpdated = () => {
    success('Paciente atualizado com sucesso!')
    refetchPatient()
    refetchPricing()
    setShowPatientForm(false)
  }

  const handlePackageCreated = () => {
    success('Pacote criado com sucesso!')
    refetchPackages()
    setShowPackageForm(false)
  }

  const handlePricingUpdated = () => {
    success('Precificação atualizada com sucesso!')
    refetchPricing()
    setShowPricingForm(false)
  }

  const genderLabels = {
    'MASCULINO': 'Masculino',
    'FEMININO': 'Feminino',
    'OUTRO': 'Outro'
  }

  if (patientLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-200 rounded-lg w-80 animate-pulse"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Paciente não encontrado</h3>
        <Button onClick={() => navigate('/patients')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Pacientes
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Eye },
    { id: 'surgeries', label: 'Cirurgias', icon: Scissors },
    { id: 'packages', label: 'Pacotes', icon: Package },
    { id: 'consultations', label: 'Consultas', icon: FileText }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/patients')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{patient.name}</h1>
              <p className="text-slate-600">
                {calculateAge(patient.birthDate)} anos • {genderLabels[patient.gender as keyof typeof genderLabels]}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowPricingForm(true)}
          >
            <DollarSign className="w-4 h-4" />
            Precificação
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowPackageForm(true)}
          >
            <Package className="w-4 h-4" />
            Novo Pacote
          </Button>
          <Button onClick={() => setShowPatientForm(true)}>
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'overview' && (
          <>
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>{formatDate(patient.birthDate)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={patient.isActive ? "success" : "secondary"}>
                        {patient.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  {patient.address && (
                    <div className="flex items-start space-x-3 pt-2">
                      <MapPin className="w-4 h-4 text-slate-500 mt-1" />
                      <span className="text-slate-600">{patient.address}</span>
                    </div>
                  )}
                  {patient.emergencyContact && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-slate-700 mb-1">Contato de Emergência</h4>
                      <p className="text-slate-600">{patient.emergencyContact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical History */}
              {patient.medicalHistory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-600" />
                      Histórico Médico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 whitespace-pre-wrap">{patient.medicalHistory}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Info */}
              {pricing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Precificação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Valor Efetivo:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(pricing.effectivePrice)}
                      </span>
                    </div>
                    {pricing.hasCustomPrice && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Valor Personalizado:</span>
                        <span className="text-sm">{formatCurrency(pricing.customSessionPrice)}</span>
                      </div>
                    )}
                    {pricing.hasDiscount && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Desconto:</span>
                        <span className="text-sm text-red-600">
                          -{pricing.discountPercentage}% ({formatCurrency(pricing.discountAmount)})
                        </span>
                      </div>
                    )}
                    {pricing.partnershipTag && (
                      <div className="pt-2">
                        <Badge variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {pricing.partnershipTag}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Active Packages */}
              {packages && packages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      Pacotes Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {packages.filter(pkg => pkg.isActive).map((pkg) => (
                      <div key={pkg.id} className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-blue-900">{pkg.packageType}</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {pkg.remainingSessions} restantes
                          </Badge>
                        </div>
                        <div className="text-xs text-blue-700">
                          {pkg.sessionsUsed} de {pkg.totalSessions} sessões usadas
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(pkg.sessionsUsed / pkg.totalSessions) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Paciente há:</span>
                    <span className="font-medium">
                      {Math.floor((new Date().getTime() - new Date(patient.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dias
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Pacotes Ativos:</span>
                    <span className="font-medium">
                      {packages?.filter(pkg => pkg.isActive).length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'surgeries' && (
          <div className="lg:col-span-3">
            <SurgeryHistory 
              patientId={patientId} 
              patientName={patient.name} 
            />
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Histórico de Pacotes
                  </CardTitle>
                  <Button onClick={() => setShowPackageForm(true)}>
                    <Package className="w-4 h-4 mr-2" />
                    Novo Pacote
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {packagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : packages && packages.length > 0 ? (
                  <div className="space-y-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-900">{pkg.packageType}</h4>
                            <p className="text-sm text-slate-600">
                              Comprado em {formatDate(pkg.purchaseDate)} • {formatCurrency(pkg.purchasePrice)}
                            </p>
                          </div>
                          <Badge 
                            className={
                              pkg.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              pkg.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {pkg.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600">Total:</span>
                            <div className="font-medium">{pkg.totalSessions} sessões</div>
                          </div>
                          <div>
                            <span className="text-slate-600">Utilizadas:</span>
                            <div className="font-medium">{pkg.sessionsUsed}</div>
                          </div>
                          <div>
                            <span className="text-slate-600">Restantes:</span>
                            <div className="font-medium">{pkg.remainingSessions}</div>
                          </div>
                        </div>
                        {pkg.expiryDate && (
                          <p className="text-xs text-slate-500 mt-2">
                            Expira em: {formatDate(pkg.expiryDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">Nenhum pacote cadastrado</p>
                    <Button onClick={() => setShowPackageForm(true)} variant="outline">
                      <Package className="w-4 h-4 mr-2" />
                      Comprar Primeiro Pacote
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'consultations' && (
          <div className="lg:col-span-3">
            <ConsultationHistory 
              patientId={patientId} 
              patientName={patient.name} 
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <PatientForm
        patient={patient}
        isOpen={showPatientForm}
        onClose={() => setShowPatientForm(false)}
        onSave={handlePatientUpdated}
      />

      <PackageForm
        isOpen={showPackageForm}
        onClose={() => setShowPackageForm(false)}
        patientId={patientId}
        patientName={patient.name}
        onPackageCreated={handlePackageCreated}
      />

      <PricingForm
        isOpen={showPricingForm}
        onClose={() => setShowPricingForm(false)}
        patientId={patientId}
        patientName={patient.name}
        currentPricing={pricing}
        onPricingUpdated={handlePricingUpdated}
      />
    </div>
  )
}
