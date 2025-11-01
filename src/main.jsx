import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { autoSyncInsights } from './utils/scheduler'

// Check localStorage for Auto-Sync toggle
const isAutoSyncEnabled = localStorage.getItem('aiAutoSync') === 'true'
if (isAutoSyncEnabled) {
  console.log('🤖 AI Auto-Sync Enabled: Scheduling 24-hour reports...')
  autoSyncInsights()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
