import React, { memo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Dumbbell, 
  FileText, 
  DollarSign,
  CheckSquare,
  Package,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { AlertsNotifications } from './AlertsNotifications'
import { useAuth } from '@/react-app/contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
  activeRoute?: string
}

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', route: '/', count: null },
  { icon: Users, label: 'Pacientes', route: '/patients', count: 247 },
  { icon: Calendar, label: 'Agendamentos', route: '/appointments', count: 12 },
  { icon: Dumbbell, label: 'Exercícios', route: '/exercises', count: null },
  { icon: FileText, label: 'Prescrições', route: '/prescriptions', count: 8 },
  { icon: CheckSquare, label: 'Tarefas', route: '/tasks', count: 5 },
  { icon: Package, label: 'Inventário', route: '/inventory', count: null },
  { icon: BookOpen, label: 'Base de Conhecimento', route: '/knowledge-base', count: null },
  { icon: DollarSign, label: 'Financeiro', route: '/finance', count: 3 },
  { icon: Settings, label: 'Configurações', route: '/settings', count: null },
]

// Hook para detectar tamanho da tela
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Memoized Sidebar Component
const MemoizedSidebar = memo(({ 
  activeRoute, 
  onLogout, 
  isOpen, 
  onClose, 
  isMobile 
}: { 
  activeRoute: string
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
}) => {
  const handleNavigation = useCallback((e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
    e.preventDefault()
    // Use history API para navegação sem reload
    window.history.pushState({}, '', route)
    window.dispatchEvent(new PopStateEvent('popstate'))
    
    // Fechar sidebar em mobile após navegação
    if (isMobile) {
      onClose()
    }
  }, [isMobile, onClose])

  // Sidebar para Desktop
  if (!isMobile) {
    return (
      <motion.aside 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-70 bg-white border-r border-slate-200 shadow-lg z-40"
      >
        <SidebarContent 
          activeRoute={activeRoute}
          onLogout={onLogout}
          handleNavigation={handleNavigation}
          showCloseButton={false}
          onClose={onClose}
        />
      </motion.aside>
    )
  }

  // Sidebar para Mobile (Drawer/Overlay)
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          
          {/* Sidebar Mobile */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-white border-r border-slate-200 shadow-2xl z-50 lg:hidden"
          >
            <SidebarContent 
              activeRoute={activeRoute}
              onLogout={onLogout}
              handleNavigation={handleNavigation}
              showCloseButton={true}
              onClose={onClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
});

// Componente do conteúdo do sidebar reutilizável
const SidebarContent = ({ 
  activeRoute, 
  onLogout, 
  handleNavigation, 
  showCloseButton, 
  onClose 
}: {
  activeRoute: string
  onLogout: () => void
  handleNavigation: (e: React.MouseEvent<HTMLAnchorElement>, route: string) => void
  showCloseButton: boolean
  onClose: () => void
}) => (
  <>
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FisioFlow
            </h1>
            <p className="text-xs text-slate-500">AI Studio</p>
          </div>
        </div>
        
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>

    <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
      {sidebarItems.map((item) => (
        <motion.a
          key={item.route}
          href={item.route}
          onClick={(e) => handleNavigation(e, item.route)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
            activeRoute === item.route
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </div>
          {item.count && (
            <Badge variant={activeRoute === item.route ? "secondary" : "outline"} className="text-xs">
              {item.count}
            </Badge>
          )}
        </motion.a>
      ))}
    </nav>

    <div className="p-4 border-t border-slate-200">
      <Button 
        variant="ghost" 
        className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        onClick={onLogout}
      >
        <LogOut className="w-4 h-4 mr-3" />
        Sair
      </Button>
    </div>
  </>
)

// Memoized Header Component
const MemoizedHeader = memo(({ 
  user, 
  onToggleSidebar, 
  isMobile 
}: { 
  user: any
  onToggleSidebar: () => void
  isMobile: boolean
}) => {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <motion.header 
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Menu Hambúrguer - Só aparece em mobile */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="text-slate-600 hover:text-slate-900 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          {/* Logo em mobile */}
          {isMobile && (
            <div className="flex items-center space-x-2 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FisioFlow
              </h1>
            </div>
          )}

          {/* Barra de busca - adaptativa */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar pacientes, exercícios..."
              className="pl-10 pr-4 py-2 bg-slate-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64 lg:w-80"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Busca mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-slate-600"
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Notificações */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-slate-600"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
              <Badge className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                !
              </Badge>
            </Button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-80 lg:w-96 z-50"
                >
                  <AlertsNotifications 
                    maxItems={5}
                    showHeader={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Profile */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium text-slate-900">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-slate-500">
                {user?.role === 'FISIOTERAPEUTA' ? 'Fisioterapeuta' : 
                 user?.role === 'ADMIN' ? 'Administrador' : 
                 user?.role === 'PACIENTE' ? 'Paciente' : 'Usuário'}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base">
              {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
});

export function Layout({ children, activeRoute = '/' }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Detectar se é mobile/tablet
  const isMobile = useMediaQuery('(max-width: 1023px)')
  
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  // Fechar sidebar quando mudar para desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  // Prevenir scroll quando sidebar aberto em mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, sidebarOpen])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <MemoizedSidebar 
        activeRoute={activeRoute} 
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${!isMobile ? 'ml-70' : ''}`}>
        {/* Header */}
        <MemoizedHeader 
          user={user} 
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
