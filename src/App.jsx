import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Strategy from './pages/Strategy'
import MarketingPulse from './pages/MarketingPulse'
import AssetVault from './pages/AssetVault'
import Partnerships from './pages/Partnerships'
import VoiceConsole from './components/VoiceConsole'
import AICoPilot from './components/AICoPilot'
import { ThemeProvider } from './contexts/ThemeContext'
import { preparePrompt } from './ai/autoAgent.browser'
import { useProjects, useRoadmap } from './utils/useData'
import metricsData from './data/metrics.json'

function AppContent() {
  const navigate = useNavigate()
  const projects = useProjects()
  const roadmap = useRoadmap()

  const handleAIAnalysis = () => {
    try {
      const result = preparePrompt(projects, roadmap, metricsData)
      window.__LAST_AI_REPORT__ = result.text
      window.__LAST_AI_CONTEXT__ = result.structured
      alert('✅ AI Analysis Report Generated!\n\nCheck the browser console for full details.')
      console.log('\n🤖 AI STRATEGIC ANALYSIS REPORT\n')
      console.log(result.text)
      console.log('\n📊 Structured Context:', result.structured)
    } catch (error) {
      console.error('AI Analysis error:', error)
      alert('❌ Failed to run analysis. Check console for details.')
    }
  }

  const handleNavigate = (path) => {
    navigate(path)
  }

  const handleToggleAutoSync = (flag) => {
    if (flag) {
      localStorage.setItem('aiAutoSync', 'true')
      alert('✅ Auto-Sync Enabled!\n\nAI analysis will run every 24 hours.')
    } else {
      localStorage.removeItem('aiAutoSync')
      alert('⏸️ Auto-Sync Disabled.')
    }
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/marketing" element={<MarketingPulse />} />
        <Route path="/assets" element={<AssetVault />} />
        <Route path="/partnerships" element={<Partnerships />} />
      </Routes>
      
      {/* Global Voice Console - Available on all pages */}
      <VoiceConsole
        onRunAnalysis={handleAIAnalysis}
        onNavigate={handleNavigate}
        onToggleAutoSync={handleToggleAutoSync}
      />

      {/* Global AI Co-Pilot - Available on all pages */}
      <AICoPilot />
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  )
}

export default App
