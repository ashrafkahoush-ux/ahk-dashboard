import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ title, value, change, icon: Icon, trend, color = 'navy' }) {
  const isPositive = trend === 'up'
  
  const colorClasses = {
    navy: 'from-ahk-navy-700 to-ahk-navy-900',
    gold: 'from-ahk-gold-500 to-ahk-gold-700',
    slate: 'from-ahk-slate-600 to-ahk-slate-800',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-white text-opacity-80 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-display font-bold">{value}</p>
      </div>
    </div>
  )
}
