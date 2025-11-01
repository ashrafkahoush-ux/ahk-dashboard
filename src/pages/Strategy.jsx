import { useState } from 'react'
import { Plus, Filter } from 'lucide-react'
import TaskList from '../components/TaskList'
import roadmapData from '../data/roadmap.json'

export default function Strategy() {
  const [tasks, setTasks] = useState(roadmapData)

  const handleTaskUpdate = (updatedTask) => {
    console.log('Task updated:', updatedTask)
    // Here you can add logic to save to backend/localStorage
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

      {/* Task List Component */}
      <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} />
    </div>
  )
}
