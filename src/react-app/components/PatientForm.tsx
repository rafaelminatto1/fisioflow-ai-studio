import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, Shield, DollarSign, Tag, Percent } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ImageUpload } from './ImageUpload'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { PatientType } from '@/shared/types'

interface PatientFormProps {
  patient?: PatientType
  isOpen: boolean
  onClose: () => void
  onSave: (patientData: any) => void
}

export function PatientForm({ patient, isOpen, onClose, onSave }: PatientFormProps) {
  const notifications = useNotifications()
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'MASCULINO' as 'MASCULINO' | 'FEMININO' | 'OUTRO',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    avatar: '',
    customSessionPrice: '',
    partnershipTag: '',
    discountPercentage: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        cpf: patient.cpf || '',
        email: patient.email || '',
        phone: patient.phone || '',
        birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
        gender: patient.gender || 'MASCULINO',
        address: patient.address || '',
        emergencyContact: patient.emergencyContact || '',
        medicalHistory: patient.medicalHistory || '',
        avatar: patient.avatar || '',
        customSessionPrice: (patient as any).customSessionPrice?.toString() || '',
        partnershipTag: (patient as any).partnershipTag || '',
        discountPercentage: (patient as any).discountPercentage?.toString() || ''
      })
    } else {
      setFormData({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: 'MASCULINO',
        address: '',
        emergencyContact: '',
        medicalHistory: '',
        avatar: '',
        customSessionPrice: '',
        partnershipTag: '',
        discountPercentage: ''
      })
    }
    setErrors({})
  }, [patient, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória'
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.cpf && !isValidCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidCPF = (cpf: string) => {
    // Basic CPF validation (just format check)
    const cleanCPF = cpf.replace(/\D/g, '')
    return cleanCPF.length === 11
  }

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const limitedValue = cleanValue.slice(0, 11)
    
    if (limitedValue.length <= 3) return limitedValue
    if (limitedValue.length <= 6) return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3)}`
    if (limitedValue.length <= 9) return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3, 6)}.${limitedValue.slice(6)}`
    return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3, 6)}.${limitedValue.slice(6, 9)}-${limitedValue.slice(9)}`
  }

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const limitedValue = cleanValue.slice(0, 11)
    
    if (limitedValue.length <= 2) return `(${limitedValue}`
    if (limitedValue.length <= 7) return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, '') || null,
        email: formData.email || null,
        address: formData.address || null,
        emergencyContact: formData.emergencyContact || null,
        medicalHistory: formData.medicalHistory || null,
        avatar: formData.avatar || null,
        customSessionPrice: formData.customSessionPrice ? Number(formData.customSessionPrice) : null,
        partnershipTag: formData.partnershipTag || null,
        discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : null
      }
      await onSave(submitData)
      notifications.success(patient ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!')
    } catch (error) {
      console.error('Error saving patient:', error)
      notifications.error('Erro ao salvar paciente. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    if (field === 'cpf') {
      value = formatCPF(value)
    } else if (field === 'phone') {
      value = formatPhone(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {patient ? 'Editar Paciente' : 'Novo Paciente'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <div className="w-32 h-32">
                    <ImageUpload
                      label=""
                      value={formData.avatar}
                      onChange={(url) => handleChange('avatar', url)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Informações Pessoais
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.name ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="Digite o nome completo do paciente"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => handleChange('cpf', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.cpf ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                      {errors.cpf && (
                        <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Gênero *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMININO">Feminino</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleChange('birthDate', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.birthDate ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      />
                      {errors.birthDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-green-600" />
                    Informações de Contato
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.phone ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.email ? 'border-red-300' : 'border-slate-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="email@exemplo.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Rua, número, bairro, cidade - UF"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contato de Emergência
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => handleChange('emergencyContact', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Nome e telefone do contato de emergência"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-red-600" />
                    Informações Médicas
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Histórico Médico
                    </label>
                    <textarea
                      value={formData.medicalHistory}
                      onChange={(e) => handleChange('medicalHistory', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Condições médicas, alergias, cirurgias anteriores, medicamentos em uso..."
                    />
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Precificação e Parcerias
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Valor Personalizado por Sessão
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          value={formData.customSessionPrice}
                          onChange={(e) => handleChange('customSessionPrice', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="Deixe vazio para usar valor padrão"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Se preenchido, sobrescreve o valor padrão da clínica
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Desconto Percentual
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          value={formData.discountPercentage}
                          onChange={(e) => handleChange('discountPercentage', e.target.value)}
                          step="0.1"
                          min="0"
                          max="100"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="Ex: 10"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Desconto aplicado (0-100%)
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tag de Parceria
                      </label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={formData.partnershipTag}
                          onChange={(e) => handleChange('partnershipTag', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="Ex: Academia Fitness, Empresa Parceira"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Identifica origem da parceria ou convênio
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : (patient ? 'Atualizar' : 'Cadastrar')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
