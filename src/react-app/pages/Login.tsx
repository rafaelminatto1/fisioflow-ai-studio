import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, Dumbbell } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { useAuth } from '@/react-app/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Redirecionar se já autenticado
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Erro desconhecido');
    }
    
    setIsLoading(false);
  };

  const credentialSets = [
    {
      role: 'ADMINISTRADOR',
      icon: '👨‍💼',
      email: 'admin@fisioflow.com',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      subtextColor: 'text-red-700',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    {
      role: 'FISIOTERAPEUTA',
      icon: '👩‍⚕️',
      email: 'ana.silva@fisioflow.com',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      subtextColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      role: 'PACIENTE',
      icon: '🧑‍🦽',
      email: 'paciente.teste@email.com',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      subtextColor: 'text-green-700',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    {
      role: 'ASSISTENTE',
      icon: '👩‍💻',
      email: 'maria.recep@fisioflow.com',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      subtextColor: 'text-purple-700',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md lg:max-w-lg"
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FisioFlow
                </h1>
                <p className="text-xs text-slate-500">AI Studio</p>
              </div>
            </div>
            <CardTitle className="text-xl text-slate-900">
              Bem-vindo de volta
            </CardTitle>
            <p className="text-sm text-slate-600">
              Entre com suas credenciais para continuar
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Formulário de Login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* Links adicionais */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Credenciais de Teste - Design Mobile-First */}
            <div className="pt-6 border-t border-slate-200">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center">
                  🔑 Credenciais de Teste
                </h3>
                
                {/* Grid responsivo para as credenciais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {credentialSets.map((cred, index) => (
                    <motion.div
                      key={cred.email}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${cred.bgColor} border ${cred.borderColor} rounded-lg p-3 hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{cred.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${cred.textColor} truncate`}>
                                {cred.role}
                              </p>
                              <p className={`text-xs ${cred.subtextColor} truncate`}>
                                {cred.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(cred.email);
                            setPassword('fisioflow123');
                          }}
                          className={`w-full text-xs ${cred.buttonColor} text-white px-3 py-2 rounded-md transition-colors font-medium`}
                        >
                          Usar Credenciais
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Senha padrão destacada */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-center bg-slate-100 rounded-lg p-3"
                >
                  <p className="text-xs text-slate-600">
                    🔐 Senha padrão para todos: 
                    <span className="font-mono font-semibold ml-1 bg-white px-2 py-1 rounded border">
                      fisioflow123
                    </span>
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Link de registro */}
            <div className="pt-4 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-600">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
