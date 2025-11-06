import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Strategy from './pages/Strategy'
import MarketingPulse from './pages/MarketingPulse'
import AssetVault from './pages/AssetVault'
import Partnerships from './pages/Partnerships'
import ReportsArchive from './components/ReportsArchive'
import EmmaInsights from './components/EmmaInsights'
import EmmaLearning from './components/EmmaLearning'
import AICoPilot from './components/AICoPilot'
import { ThemeProvider } from './contexts/ThemeContext'
import { preparePrompt } from './ai/autoAgent.browser'
import { useProjects, useRoadmap } from './utils/useData'
import metricsData from './data/metrics.json'
import sessionContext from './engine/sessionContext'

function AppContent() {
  const navigate = useNavigate()
  const projects = useProjects()
  const roadmap = useRoadmap()

  // Initialize session context on app load
  useEffect(() => {
    console.log('🧠 Emma Context Engine v2.0 initializing...');
    sessionContext.load();
    
    // Save context before tab closes or refreshes
    const handleBeforeUnload = () => {
      console.log('💾 Saving session context before unload...');
      sessionContext.save();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionContext.save(); // Save on unmount too
    };
  }, []);

  const handleAIAnalysis = () => {
    try {
      const result = preparePrompt(projects, roadmap, metricsData)
      localStorage.setItem('emma_last_report', result.text);
      localStorage.setItem('emma_last_context', JSON.stringify(result.structured));
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
        <Route path="/reports" element={<ReportsArchive />} />
        <Route path="/emma-insights" element={<EmmaInsights />} />
        <Route path="/emma-learning" element={<EmmaLearning />} />
      </Routes>

      {/* Global AI Co-Pilot - Available on all pages (includes Emma Voice Console) */}
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
