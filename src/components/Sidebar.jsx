import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Target, 
  TrendingUp, 
  FolderOpen,
  ChevronLeft,
  Zap
} from 'lucide-react'

export default function Sidebar({ isOpen, setIsOpen }) {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/strategy', icon: Target, label: 'Strategy' },
    { path: '/marketing', icon: TrendingUp, label: 'Marketing Pulse' },
    { path: '/assets', icon: FolderOpen, label: 'Asset Vault' },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen bg-ahk-navy-900 text-white
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ahk-navy-700">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-ahk-gold-400" />
              <span className="text-xl font-display font-bold">AHK</span>
            </div>
          )}
          {!isOpen && (
            <Zap className="w-8 h-8 text-ahk-gold-400 mx-auto" />
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex absolute -right-3 top-20 bg-ahk-navy-700 rounded-full p-1 hover:bg-ahk-navy-600 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${!isOpen && 'rotate-180'}`} />
        </button>

        {/* Navigation */}
        <nav className="mt-8 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-lg mb-2
                transition-all duration-200
                ${isActive 
                  ? 'bg-ahk-gold-500 text-white shadow-lg' 
                  : 'text-ahk-slate-300 hover:bg-ahk-navy-800 hover:text-white'
                }
                ${!isOpen && 'justify-center'}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ahk-navy-700">
            <div className="text-xs text-ahk-slate-400">
              <p className="font-semibold text-ahk-gold-400">AHK Strategies</p>
              <p className="mt-1">Strategic Mobility Program</p>
              <p className="mt-2 text-ahk-slate-500">v1.0.0</p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
