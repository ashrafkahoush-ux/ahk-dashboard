import { Clock, CheckCircle, AlertCircle, Circle, User, DollarSign, Calendar } from 'lucide-react'

export default function ProjectCard({ project }) {
  const statusConfig = {
    'on-track': { 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    'at-risk': { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: AlertCircle,
      iconColor: 'text-yellow-600'
    },
    'planning': { 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Circle,
      iconColor: 'text-blue-600'
    },
    'in-progress': { 
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Clock,
      iconColor: 'text-purple-600'
    }
  }

  const status = statusConfig[project.status] || statusConfig['planning']
  const StatusIcon = status.icon

  return (
    <div className="card hover:shadow-xl transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-display font-bold text-ahk-navy-900 mb-1">
            {project.name}
          </h3>
          <p className="text-sm text-ahk-slate-500">{project.description}</p>
        </div>
        <StatusIcon className={`w-6 h-6 ${status.iconColor} flex-shrink-0`} />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-ahk-slate-700">Progress</span>
          <span className="text-sm font-bold text-ahk-navy-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-ahk-slate-200 rounded-full h-2">
          <div 
            className="bg-ahk-gold-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
          {project.status.replace('-', ' ').toUpperCase()}
        </span>
        <span className="text-sm text-ahk-slate-600">
          Next: <span className="font-semibold text-ahk-navy-900">{project.nextMilestone}</span>
        </span>
      </div>

      {/* Timeline */}
      {project.timeline && (
        <div className="mt-4 pt-4 border-t border-ahk-slate-200">
          <div className="flex items-center text-sm text-ahk-slate-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{project.timeline}</span>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-ahk-slate-200 space-y-2">
        {project.owner && (
          <div className="flex items-center text-sm text-ahk-slate-600">
            <User className="w-4 h-4 mr-2 text-ahk-navy-500" />
            <span className="font-medium text-ahk-slate-700">Owner:</span>
            <span className="ml-1">{project.owner}</span>
          </div>
        )}
        {project.startDate && (
          <div className="flex items-center text-sm text-ahk-slate-600">
            <Calendar className="w-4 h-4 mr-2 text-ahk-navy-500" />
            <span className="font-medium text-ahk-slate-700">Started:</span>
            <span className="ml-1">{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        )}
        {project.fundingStage && (
          <div className="flex items-center text-sm">
            <DollarSign className="w-4 h-4 mr-2 text-ahk-gold-500" />
            <span className="font-medium text-ahk-slate-700">Funding:</span>
            <span className="ml-1 text-ahk-navy-700 font-semibold">{project.fundingStage}</span>
          </div>
        )}
      </div>
    </div>
  )
}
