import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Strategy from './pages/Strategy'
import MarketingPulse from './pages/MarketingPulse'
import AssetVault from './pages/AssetVault'
import Partnerships from './pages/Partnerships'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/marketing" element={<MarketingPulse />} />
          <Route path="/assets" element={<AssetVault />} />
          <Route path="/partnerships" element={<Partnerships />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
