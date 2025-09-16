import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Check, User, Phone, Mail } from 'lucide-react'
import { Button } from './ui/button'
import { useAuthenticatedFetch } from '@/react-app/hooks/useAuthenticatedFetch'
import { useNotifications } from '@/react-app/hooks/useNotifications'
import { PatientType } from '@/shared/types'

interface PatientAutocompleteProps {
  value: number
  onChange: (patientId: number, patient?: PatientType) => void
  patients: PatientType[]
  onPatientsRefresh: () => void
  error?: string
}

interface QuickPatientData {
  name: string
  phone: string
  birthDate: string
  gender: 'MASCULINO' | 'FEMININO' | 'OUTRO'
}

export function PatientAutocomplete({ 
  value, 
  onChange, 
  patients, 
  onPatientsRefresh,
  error 
}: PatientAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickPatientData, setQuickPatientData] = useState<QuickPatientData>({
    name: '',
    phone: '',
    birthDate: '',
    gender: 'MASCULINO'
  })
  const [isCreating, setIsCreating] = useState(false)

  const authFetch = useAuthenticatedFetch()
  const notifications = useNotifications()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get selected patient
  const selectedPatient = patients.find(p => p.id === value)
  const displayValue = selectedPatient ? selectedPatient.name : ''

  // Filter patients based on search
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf?.includes(searchTerm)
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setShowQuickAdd(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    
    // Clear selection if input doesn't match any patient
    if (selectedPatient && !selectedPatient.name.toLowerCase().includes(newValue.toLowerCase())) {
      onChange(0)
    }
  }

  const handlePatientSelect = (patient: PatientType) => {
    onChange(patient.id, patient)
    setSearchTerm('')
    setIsOpen(false)
    setShowQuickAdd(false)
  }

  const handleQuickAdd = () => {
    setShowQuickAdd(true)
    setQuickPatientData({
      name: searchTerm,
      phone: '',
      birthDate: '',
      gender: 'MASCULINO'
    })
  }

  const createQuickPatient = async () => {
    if (!quickPatientData.name.trim()) {
      notifications.error('Nome é obrigatório')
      return
    }

    setIsCreating(true)
    try {
      const response = await authFetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickPatientData.name.trim(),
          phone: quickPatientData.phone.trim() || undefined,
          birthDate: quickPatientData.birthDate || undefined,
          gender: quickPatientData.gender,
          // Mark as quick registration for later reminder
          medicalHistory: 'CADASTRO_RAPIDO: Completar informações'
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao criar paciente')
      }

      const result = await response.json()
      const newPatient = result.data

      // Create task reminder to complete patient data
      await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Completar dados do paciente: ${quickPatientData.name}`,
          description: `Paciente criado rapidamente durante agendamento. Necessário completar: ${!quickPatientData.phone ? 'telefone, ' : ''}${!quickPatientData.birthDate ? 'data de nascimento, ' : ''}email, endereço, contato de emergência, histórico médico completo.`,
          priority: 'MEDIUM',
          category: 'PATIENT_CARE',
          patientId: newPatient.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
        })
      })

      notifications.success(`Paciente ${quickPatientData.name} criado! Lembrete adicionado para completar dados.`)
      
      // Refresh patients list and select the new patient
      await onPatientsRefresh()
      onChange(newPatient.id, { ...newPatient, ...quickPatientData })
      
      setShowQuickAdd(false)
      setIsOpen(false)
      setSearchTerm('')
      
    } catch (error) {
      console.error('Error creating quick patient:', error)
      notifications.error('Erro ao criar paciente. Tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const limitedValue = cleanValue.slice(0, 11)
    
    if (limitedValue.length <= 2) return `(${limitedValue}`
    if (limitedValue.length <= 7) return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
            error ? 'border-red-300' : 'border-slate-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
          placeholder="Digite para buscar paciente..."
        />
        {selectedPatient && !isOpen && (
          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {!showQuickAdd ? (
              <>
                {/* Search Results */}
                {filteredPatients.length > 0 ? (
                  <div className="py-2">
                    {filteredPatients.map((patient) => (
                      <motion.button
                        key={patient.id}
                        whileHover={{ backgroundColor: '#f8fafc' }}
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{patient.name}</div>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              {patient.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{patient.phone}</span>
                                </div>
                              )}
                              {patient.email && (
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate max-w-32">{patient.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="py-4 px-4 text-center text-slate-500">
                    <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Nenhum paciente encontrado</p>
                  </div>
                ) : (
                  <div className="py-4 px-4 text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Digite para buscar pacientes</p>
                  </div>
                )}

                {/* Add New Patient Option */}
                {searchTerm && filteredPatients.length === 0 && (
                  <div className="border-t border-slate-200">
                    <motion.button
                      whileHover={{ backgroundColor: '#f0f9ff' }}
                      onClick={handleQuickAdd}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 text-blue-600"
                    >
                      <Plus className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Cadastrar novo paciente</div>
                        <div className="text-sm text-blue-500">"{searchTerm}"</div>
                      </div>
                    </motion.button>
                  </div>
                )}
              </>
            ) : (
              /* Quick Add Form */
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Cadastro Rápido</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={quickPatientData.name}
                      onChange={(e) => setQuickPatientData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Nome do paciente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={quickPatientData.phone}
                      onChange={(e) => setQuickPatientData(prev => ({ 
                        ...prev, 
                        phone: formatPhone(e.target.value)
                      }))}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="(11) 99999-9999 (opcional)"
                      maxLength={15}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={quickPatientData.birthDate}
                        onChange={(e) => setQuickPatientData(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Gênero
                      </label>
                      <select
                        value={quickPatientData.gender}
                        onChange={(e) => setQuickPatientData(prev => ({ 
                          ...prev, 
                          gender: e.target.value as 'MASCULINO' | 'FEMININO' | 'OUTRO'
                        }))}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Selecione (opcional)</option>
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMININO">Feminino</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Cadastro Rápido:</strong> Apenas o nome é obrigatório. Um lembrete será criado para completar as demais informações posteriormente.
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuickAdd(false)}
                      className="flex-1"
                      disabled={isCreating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={createQuickPatient}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Criando...' : 'Criar Paciente'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
