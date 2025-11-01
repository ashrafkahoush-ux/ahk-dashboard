import { Target, Rocket, TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import ProjectCard from '../components/ProjectCard'
import { useProjects } from '../utils/useData'
import { preparePrompt } from '../ai/autoAgent.browser'
import metricsData from '../data/metrics.json'

export default function Dashboard() {
  const { overview, projectHealth, timeline} = metricsData
  const projects = useProjects()

  const handleAIAnalysis = () => {
    const report = preparePrompt()
    alert('✅ AI Analysis Report Generated!\n\nCheck the browser console for full details.')
    console.log('\n🤖 AI STRATEGIC ANALYSIS REPORT\n')
    console.log(report)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ahk-navy-900">
            Strategic Dashboard
          </h1>
          <p className="text-ahk-slate-600 mt-1">
            Your command center for AHK Strategies growth
          </p>
        </div>
        <button className="btn-primary">
          Generate Report
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Projects"
          value={overview.activeProjects}
          change="+1 this month"
          trend="up"
          icon={Rocket}
          color="navy"
        />
        <MetricCard
          title="Tasks Completed"
          value={`${overview.completedTasks}/${overview.totalTasks}`}
          change={`${Math.round((overview.completedTasks / overview.totalTasks) * 100)}%`}
          trend="up"
          icon={CheckCircle}
          color="gold"
        />
        <MetricCard
          title="Projected ROI"
          value={overview.projectedROI}
          change="+15% vs target"
          trend="up"
          icon={TrendingUp}
          color="slate"
        />
        <MetricCard
          title="Total Budget"
          value={overview.totalBudget}
          change="On track"
          trend="up"
          icon={DollarSign}
          color="navy"
        />
      </div>

      {/* Timeline Alert */}
      <div className="bg-gradient-to-r from-ahk-gold-500 to-ahk-gold-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold">Next Milestone</h3>
              <p className="text-white text-opacity-90">
                {timeline.nextMilestone} - {timeline.daysToNextMilestone} days remaining
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white text-opacity-80">Current Phase</p>
            <p className="text-lg font-bold">{timeline.currentPhase}</p>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-bold text-ahk-navy-900">
            Active Projects
          </h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-ahk-slate-600">{projectHealth.onTrack} On Track</span>
            </span>
            <span className="flex items-center space-x-1 ml-4">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-ahk-slate-600">{projectHealth.planning} Planning</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-xl font-display font-bold text-ahk-navy-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border-2 border-ahk-slate-200 rounded-lg hover:border-ahk-navy-500 hover:bg-ahk-slate-50 transition-all">
            <Target className="w-6 h-6 text-ahk-navy-700" />
            <span className="font-semibold text-ahk-navy-900">Update Roadmap</span>
          </button>
          <button 
            onClick={handleAIAnalysis}
            className="flex items-center space-x-3 p-4 border-2 border-ahk-slate-200 rounded-lg hover:border-ahk-gold-500 hover:bg-ahk-slate-50 transition-all cursor-pointer"
          >
            <TrendingUp className="w-6 h-6 text-ahk-gold-600" />
            <span className="font-semibold text-ahk-navy-900">Run AI Analysis</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border-2 border-ahk-slate-200 rounded-lg hover:border-ahk-navy-500 hover:bg-ahk-slate-50 transition-all">
            <Rocket className="w-6 h-6 text-ahk-navy-700" />
            <span className="font-semibold text-ahk-navy-900">Export Report</span>
          </button>
        </div>
      </div>
    </div>
  )
}
