import { Menu, Bell, User, Search } from 'lucide-react'

export default function Navbar({ toggleSidebar }) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <nav className="bg-white border-b border-ahk-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-ahk-slate-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-ahk-slate-600" />
          </button>
          
          <div className="hidden md:block">
            <p className="text-sm text-ahk-slate-500">{currentDate}</p>
            <h1 className="text-xl font-display font-bold text-ahk-navy-900">
              Strategic Command Center
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="hidden md:flex items-center bg-ahk-slate-100 rounded-lg px-4 py-2">
            <Search className="w-5 h-5 text-ahk-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-ahk-slate-100 transition-colors">
            <Bell className="w-6 h-6 text-ahk-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-ahk-gold-500 rounded-full"></span>
          </button>

          {/* User profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-ahk-slate-200">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-ahk-navy-900">Ashraf Khan</p>
              <p className="text-xs text-ahk-slate-500">Strategic Lead</p>
            </div>
            <div className="w-10 h-10 bg-ahk-navy-700 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
