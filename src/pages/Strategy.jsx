import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Filter, FileText } from 'lucide-react'
import TaskList from '../components/TaskList'
import { useRoadmap, useSources, useProjects, groupTasksBySource, groupTasksByProject, getSourceById } from '../utils/useData'

export default function Strategy() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialTasks = useRoadmap()
  const sources = useSources()
  const projects = useProjects()
  const [filterMode, setFilterMode] = useState('all') // all, by-project, by-source
  const [tasksState, setTasksState] = useState(initialTasks)

  // Handle ?refresh=1 query parameter for cache-busting reload
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('refresh') === '1') {
      console.log('🔄 Refreshing roadmap data...')
      
      // Fetch fresh roadmap data with cache-busting
      fetch(`/src/data/roadmap.json?v=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Roadmap data refreshed:', data.length, 'tasks')
          setTasksState(data)
          
          // Remove ?refresh=1 from URL without page reload
          searchParams.delete('refresh')
          const newSearch = searchParams.toString()
          navigate(
            {
              pathname: location.pathname,
              search: newSearch ? `?${newSearch}` : ''
            },
            { replace: true }
          )
        })
        .catch(err => {
          console.error('❌ Failed to refresh roadmap:', err)
          alert('Failed to refresh roadmap data. Using cached version.')
        })
    }
  }, [location.search, location.pathname, navigate])

  const handleTaskUpdate = (updatedTask) => {
    console.log('Task updated:', updatedTask)
    setTasksState(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  const renderTasksBySource = () => {
    const grouped = groupTasksBySource()
    
    return Object.entries(grouped).map(([sourceId, sourceTasks]) => {
      const sourceDoc = getSourceById(sourceId)
      
      return (
        <div key={sourceId} className="mb-8">
          <div className="flex items-center space-x-3 mb-4 p-4 bg-ahk-navy-500 text-white rounded-lg">
            <FileText className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">{sourceDoc?.title || sourceId}</h3>
              <p className="text-sm text-white text-opacity-80">{sourceTasks.length} tasks</p>
            </div>
          </div>
          <TaskList tasks={sourceTasks} onTaskUpdate={handleTaskUpdate} showFilters={false} />
        </div>
      )
    })
  }

  const renderTasksByProject = () => {
    const grouped = groupTasksByProject()
    
    return Object.entries(grouped).map(([projectId, projectTasks]) => {
      const project = projects.find(p => p.id === projectId)
      
      return (
        <div key={projectId} className="mb-8">
          <div className="flex items-center space-x-3 mb-4 p-4 bg-ahk-gold-500 text-white rounded-lg">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold">
              {project?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-semibold">{project?.name || projectId}</h3>
              <p className="text-sm text-white text-opacity-80">{projectTasks.length} tasks • {project?.stage || 'Planning'}</p>
            </div>
          </div>
          <TaskList tasks={projectTasks} onTaskUpdate={handleTaskUpdate} showFilters={false} />
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ahk-navy-500">
            Strategy & Roadmap
          </h1>
          <p className="text-ahk-slate-500 mt-1">
            Mission tracker: Your path to 100 strategic milestones
          </p>
        </div>
        <button className="btn-secondary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Mode Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-5 h-5 text-ahk-navy-500" />
          <span className="font-semibold text-ahk-navy-900">View Mode:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-ahk-navy-500 text-white'
                : 'bg-ahk-slate-100 text-ahk-slate-700 hover:bg-ahk-slate-200'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilterMode('by-project')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterMode === 'by-project'
                ? 'bg-ahk-gold-500 text-white'
                : 'bg-ahk-slate-100 text-ahk-slate-700 hover:bg-ahk-slate-200'
            }`}
          >
            By Project
          </button>
          <button
            onClick={() => setFilterMode('by-source')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterMode === 'by-source'
                ? 'bg-ahk-navy-500 text-white'
                : 'bg-ahk-slate-100 text-ahk-slate-700 hover:bg-ahk-slate-200'
            }`}
          >
            By Source Document
          </button>
        </div>
      </div>

      {/* Task List Component */}
      {filterMode === 'all' && (
        <TaskList tasks={tasksState} onTaskUpdate={handleTaskUpdate} />
      )}
      {filterMode === 'by-project' && renderTasksByProject()}
      {filterMode === 'by-source' && renderTasksBySource()}
    </div>
  )
}
