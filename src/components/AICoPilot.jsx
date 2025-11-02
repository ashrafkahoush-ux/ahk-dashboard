// src/components/AICoPilot.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGeminiAnalysis, testGeminiConnection } from '../api/geminiClient';
import { runMultiAIAnalysis } from '../ai/orchestrator';
import { preparePrompt } from '../ai/autoAgent.browser';
import { saveRoadmapTask } from '../ai/persist';
import { getRecentTaskLog } from '../ai/taskAgent';
import { useProjects, useRoadmap } from '../utils/useData';
import metricsData from '../data/metrics.json';
import SmartVoiceConsole from './SmartVoiceConsole';
import { speak, pickLang } from '../ai/speech';
import ReportsManager from '../utils/reportsStorage';

export default function AICoPilot() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [fusionReport, setFusionReport] = useState(null);
  const [fusionLoading, setFusionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('fusion'); // fusion, gemini, grok, chatgpt
  const [lastRun, setLastRun] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(() => {
    return localStorage.getItem('ahk-auto-analyze') === 'true';
  });
  const [investorKPIs, setInvestorKPIs] = useState(null);
  const [taskLog, setTaskLog] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const projects = useProjects();
  const roadmap = useRoadmap();

  // Voice command handler for Emma Voice Console
  const handleVoiceCommand = async (cmd) => {
    const lang = pickLang(currentLanguage);
    
    switch (cmd) {
      case "run-analysis":
        setExpanded(true);
        await runAnalysis();
        speak(currentLanguage === "ar" ? "تم التحليل بنجاح" : "Analysis complete", { lang, gender: "female" });
        break;
        
      case "display-report":
        setExpanded(true);
        try {
          const response = await fetch("/api/generate-report", { method: "POST" });
          const data = await response.json();
          console.log("📊 Report generated:", data);
          
          // Save report to archive
          if (data.success && data.report) {
            ReportsManager.saveReport({
              title: data.report.title || 'AHK Performance Report',
              type: data.report.format || 'PDF',
              summary: data.report.summary?.totalProjects 
                ? `${data.report.summary.totalProjects} projects, ${data.report.summary.completionRate} completion`
                : 'Strategic performance report'
            });
          }
          
          speak(currentLanguage === "ar" ? "تم عرض التقرير" : "Report displayed", { lang, gender: "female" });
        } catch (error) {
          speak(currentLanguage === "ar" ? "خطأ في التقرير" : "Report error", { lang, gender: "female" });
        }
        break;
        setExpanded(true);
        try {
          const response = await fetch("/api/generate-report", { method: "POST" });
          const data = await response.json();
          console.log("📊 Report generated:", data);
          speak(currentLanguage === "ar" ? "تم عرض التقرير" : "Report displayed", { lang, gender: "female" });
        } catch (error) {
          speak(currentLanguage === "ar" ? "خطأ في التقرير" : "Report error", { lang, gender: "female" });
        }
        break;
        
      case "email-report":
        try {
          const response = await fetch("/api/send-email-report", { method: "POST" });
          const data = await response.json();
          console.log("📧 Email report:", data);
          speak(currentLanguage === "ar" ? "تم إرسال التقرير بالبريد" : "Report sent to your email", { lang, gender: "female" });
        } catch (error) {
          speak(currentLanguage === "ar" ? "خطأ في إرسال البريد" : "Email error", { lang, gender: "female" });
        }
        break;
        
      case "risk-analysis":
        setExpanded(true);
        try {
          const response = await fetch("/api/run-risk-analysis", { method: "POST" });
          const data = await response.json();
          console.log("⚠️ Risk analysis:", data);
          speak(currentLanguage === "ar" ? "اكتمل تحليل المخاطر" : "Risk analysis complete", { lang, gender: "female" });
        } catch (error) {
          speak(currentLanguage === "ar" ? "خطأ في تحليل المخاطر" : "Risk analysis error", { lang, gender: "female" });
        }
        break;
        
      case "qvan-analysis":
        setExpanded(true);
        speak(currentLanguage === "ar" ? "جارٍ تحليل Q-VAN" : "Analyzing Q-VAN project", { lang, gender: "female" });
        await runAnalysis();
        break;
        
      case "read-report":
        try {
          const response = await fetch("/api/get-report-text");
          const reportText = await response.text();
          speak(reportText, { lang, gender: "female" });
        } catch (error) {
          speak(currentLanguage === "ar" ? "لم أتمكن من قراءة التقرير" : "Could not read the report", { lang, gender: "female" });
        }
        break;
        
      case "show-reports":
        navigate('/reports');
        speak(currentLanguage === "ar" ? "فتح أرشيف التقارير" : "Opening reports archive", { lang, gender: "female" });
        break;
        
      default:
        console.log("🎤 Unknown voice command:", cmd);
    }
  };

  async function loadTaskLog() {
    try {
      const logs = await getRecentTaskLog(5);
      setTaskLog(logs);
    } catch (error) {
      console.error('Failed to load task log:', error);
    }
  }

  async function runAnalysis() {
    setLoading(true);
    try {
      // Fetch HTML report KPIs
      let htmlKPIs = null;
      try {
        const kpiResponse = await fetch('/api/parse-html-reports');
        if (kpiResponse.ok) {
          const kpiData = await kpiResponse.json();
          htmlKPIs = kpiData.reports;
          setInvestorKPIs(htmlKPIs);
          console.log('📊 HTML KPIs extracted:', htmlKPIs);
        }
      } catch (kpiError) {
        console.warn('Could not fetch HTML KPIs:', kpiError);
      }

      const context = preparePrompt(projects, roadmap, metricsData, htmlKPIs);
      
      console.log('🚀 Starting Gemini analysis...');
      
      // Use new Gemini client
      const analysis = await fetchGeminiAnalysis(context);
      
      console.log('✅ Analysis complete:', analysis);
      
      setAnalysis(analysis);
      setLastRun(new Date().toISOString());
      
      // Save to localStorage
      localStorage.setItem('ahk-ai-analysis', JSON.stringify({
        analysis,
        timestamp: new Date().toISOString(),
        kpis: htmlKPIs
      }));
      
      // Show success message
      if (analysis.investorBrief) {
        console.log('💎 Investor Brief:', analysis.investorBrief);
      }
      
    } catch (error) {
      console.error('❌ Analysis error:', error);
      
      // Show detailed error to user
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('403')) {
        alert('⚠️ API Error: Permission Denied\n\nThe Generative Language API is not enabled for your project.\n\nPlease visit:\nhttps://console.cloud.google.com/apis/library/generativelanguage.googleapis.com\n\nAnd click ENABLE.\n\nUsing mock analysis for now.');
      } else if (errorMsg.includes('401')) {
        alert('⚠️ API Error: Invalid API Key\n\nPlease check your VITE_GEMINI_API_KEY in .env file.\n\nUsing mock analysis for now.');
      } else {
        alert(`⚠️ Analysis Error\n\n${errorMsg}\n\nUsing mock analysis. Check console (F12) for details.`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function runFusionAnalysis() {
    setFusionLoading(true);
    setActiveTab('fusion'); // Switch to fusion tab
    try {
      // Fetch HTML report KPIs
      let htmlKPIs = null;
      try {
        const kpiResponse = await fetch('/api/parse-html-reports');
        if (kpiResponse.ok) {
          const kpiData = await kpiResponse.json();
          htmlKPIs = kpiData.reports;
          setInvestorKPIs(htmlKPIs);
        }
      } catch (kpiError) {
        console.warn('Could not fetch HTML KPIs:', kpiError);
      }

      const context = preparePrompt(projects, roadmap, metricsData, htmlKPIs);
      
      console.log('🧩 Starting Multi-AI Fusion Analysis...');
      
      // Run orchestrated analysis
      const fusionResult = await runMultiAIAnalysis(context);
      
      console.log('✅ Fusion Analysis complete:', fusionResult);
      
      setFusionReport(fusionResult);
      setLastRun(new Date().toISOString());
      
      // Save to localStorage
      localStorage.setItem('ahk-fusion-analysis', JSON.stringify({
        fusion: fusionResult,
        timestamp: new Date().toISOString()
      }));
      
      // Also save individual Gemini analysis for compatibility
      if (fusionResult.raw?.gemini) {
        setAnalysis(fusionResult.raw.gemini);
      }
      
    } catch (error) {
      console.error('❌ Fusion Analysis error:', error);
      alert(`⚠️ Fusion Analysis Error\n\n${error.message}\n\nCheck console (F12) for details.`);
    } finally {
      setFusionLoading(false);
    }
  }

  async function toggleAutoAnalyze() {
    const newValue = !autoAnalyze;
    setAutoAnalyze(newValue);
    localStorage.setItem('ahk-auto-analyze', String(newValue));
    
    if (newValue) {
      // Test Gemini connection
      const testResult = await testGeminiConnection();
      if (testResult.success) {
        alert('✅ Auto-Analyze Enabled!\n\nAI analysis will run every 24 hours.\n' + testResult.message);
        // Schedule first run
        runAnalysis();
      } else {
        alert('⚠️ Auto-Analyze Enabled (Mock Mode)\n\n' + testResult.message + '\n\nSystem will use mock analysis until API key is configured.');
      }
    } else {
      alert('⏸️ Auto-Analyze Disabled.');
    }
  }

  useEffect(() => {
    // Load last analysis from localStorage
    const saved = localStorage.getItem('ahk-ai-analysis');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAnalysis(data.analysis);
        setLastRun(data.timestamp);
        setInvestorKPIs(data.kpis || null);
      } catch (e) {
        console.error('Failed to load saved analysis:', e);
      }
    }

    // Load last fusion report
    const savedFusion = localStorage.getItem('ahk-fusion-analysis');
    if (savedFusion) {
      try {
        const data = JSON.parse(savedFusion);
        setFusionReport(data.fusion);
      } catch (e) {
        console.error('Failed to load saved fusion:', e);
      }
    }

    // Load task log when expanded
    if (expanded) {
      loadTaskLog();
    }

    // Listen for voice command trigger
    function handleVoiceCommand() {
      runAnalysis();
      setExpanded(true);
    }
    window.addEventListener('runCoPilotAnalysis', handleVoiceCommand);

    // Listen for fusion voice command trigger
    function handleFusionCommand() {
      runFusionAnalysis();
      setExpanded(true);
    }
    window.addEventListener('runFusionAnalysis', handleFusionCommand);

    // Auto-analyze scheduler (24 hours)
    if (autoAnalyze) {
      const lastRunTime = lastRun ? new Date(lastRun).getTime() : 0;
      const now = Date.now();
      const hoursSinceLastRun = (now - lastRunTime) / (1000 * 60 * 60);
      
      if (hoursSinceLastRun >= 24) {
        console.log('🤖 Auto-analyze triggered (24h elapsed)');
        runAnalysis();
      }
      
      // Set up interval check (every hour)
      const intervalId = setInterval(() => {
        const lastTime = lastRun ? new Date(lastRun).getTime() : 0;
        const hoursElapsed = (Date.now() - lastTime) / (1000 * 60 * 60);
        if (hoursElapsed >= 24) {
          console.log('🤖 Auto-analyze triggered (scheduled)');
          runAnalysis();
        }
      }, 60 * 60 * 1000); // Check every hour

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('runCoPilotAnalysis', handleVoiceCommand);
        window.removeEventListener('runFusionAnalysis', handleFusionCommand);
      };
    }

    return () => {
      window.removeEventListener('runCoPilotAnalysis', handleVoiceCommand);
      window.removeEventListener('runFusionAnalysis', handleFusionCommand);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze]);

  async function addToRoadmap(title) {
    try {
      const nextId = `T-${String(roadmap.length + 1).padStart(4, '0')}`;
      const task = {
        id: nextId,
        title,
        status: 'not-started',
        priority: 'medium',
        due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectId: 'PRJ-DVM',
        source: 'SRC-AI-COPILOT',
        notes: `AI-generated task from Co-Pilot analysis on ${new Date().toISOString()}`
      };
      
      await saveRoadmapTask(task);
      alert(`✅ Task ${nextId} added to roadmap!`);
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('❌ Failed to add task. Check console.');
    }
  }

  return (
    <>
      {/* Floating Co-Pilot Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        title="AI Co-Pilot - Strategic Insights"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 100,
          zIndex: 9998,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#fff',
          border: '2px solid #c7d2fe',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        🤖
      </button>

      {/* Expanded Co-Pilot Panel */}
      {expanded && (
        <div style={{
          position: 'fixed',
          right: 24,
          bottom: 166,
          zIndex: 9997,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#e0e7ff',
          border: '1px solid #6366f1',
          borderRadius: 16,
          padding: 16,
          width: 380,
          maxHeight: '70vh',
          overflowY: 'auto',
          boxShadow: '0 12px 48px rgba(99, 102, 241, 0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: '1px solid #4c1d95'
          }}>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#c7d2fe' }}>
              🤖 AI Co-Pilot
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={runAnalysis}
                disabled={loading || fusionLoading}
                style={{
                  background: loading ? '#4c1d95' : '#6366f1',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: (loading || fusionLoading) ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              >
                {loading ? '🔄 Running...' : '▶️ Analyze'}
              </button>
              <button
                onClick={runFusionAnalysis}
                disabled={loading || fusionLoading}
                style={{
                  background: fusionLoading ? '#4c1d95' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: (loading || fusionLoading) ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold',
                  boxShadow: fusionLoading ? 'none' : '0 2px 8px rgba(139, 92, 246, 0.4)'
                }}
                title="Run Multi-AI Fusion Analysis (Gemini + Grok + ChatGPT)"
              >
                {fusionLoading ? '🔄 Fusing...' : '🧩 Fusion'}
              </button>
            </div>
          </div>

          {/* Last Run Timestamp */}
          {lastRun && (
            <div style={{
              fontSize: 11,
              color: '#a5b4fc',
              marginBottom: 12,
              opacity: 0.7
            }}>
              Last run: {new Date(lastRun).toLocaleString()}
            </div>
          )}

          {/* Auto-Analyze Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: autoAnalyze ? '#1e3a8a' : '#1e1b4b',
            borderRadius: 8,
            marginBottom: 14,
            border: autoAnalyze ? '1px solid #3b82f6' : '1px solid #4c1d95'
          }}>
            <div style={{ fontSize: 12, color: '#e0e7ff' }}>
              ⏰ Auto-Analyze (24h)
            </div>
            <button
              onClick={toggleAutoAnalyze}
              style={{
                background: autoAnalyze ? '#10b981' : '#6b7280',
                color: '#fff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold'
              }}
            >
              {autoAnalyze ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Investor Intelligence Section */}
          {investorKPIs && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: '#a78bfa',
                marginBottom: 6
              }}>
                💎 Investor Intelligence
              </div>
              <div style={{
                background: '#1e1b4b',
                padding: 10,
                borderRadius: 8,
                fontSize: 11
              }}>
                {Object.entries(investorKPIs).map(([filename, kpis]) => {
                  if (kpis.status === 'not_found') return null;
                  return (
                    <div key={filename} style={{ marginBottom: 8 }}>
                      <div style={{ color: '#c7d2fe', fontWeight: 'bold', marginBottom: 4 }}>
                        {kpis.projectName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, color: '#a5b4fc' }}>
                        {kpis.irr && <div>IRR: {kpis.irr}%</div>}
                        {kpis.totalInvestment && <div>Investment: ${kpis.totalInvestment}M</div>}
                        {kpis.revenue && <div>Revenue: ${kpis.revenue}M</div>}
                        {kpis.ebitda && <div>EBITDA: ${kpis.ebitda}M</div>}
                        {kpis.cagr && <div>CAGR: {kpis.cagr}%</div>}
                        {kpis.npv && <div>NPV: ${kpis.npv}M</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🪄 Task Assistant Section (Mission #11) */}
          {taskLog.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: '#fbbf24',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                🪄 Task Assistant
                <button
                  onClick={() => loadTaskLog()}
                  style={{
                    background: 'transparent',
                    color: '#fbbf24',
                    border: '1px solid #fbbf24',
                    padding: '2px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 'bold'
                  }}
                >
                  Refresh
                </button>
              </div>
              <div style={{
                background: '#1e1b4b',
                padding: 10,
                borderRadius: 8,
                fontSize: 11,
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {taskLog.map((log, idx) => (
                  <div key={idx} style={{
                    marginBottom: 8,
                    paddingBottom: 8,
                    borderBottom: idx < taskLog.length - 1 ? '1px solid #312e81' : 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4
                    }}>
                      <div style={{ color: '#c7d2fe', fontWeight: 'bold' }}>
                        {log.taskId}
                      </div>
                      <div style={{
                        fontSize: 9,
                        color: log.result === 'success' ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        {log.result === 'success' ? '✓ ' : '✗ '}
                        {log.action}
                      </div>
                    </div>
                    <div style={{ color: '#a5b4fc', fontSize: 10, marginBottom: 2 }}>
                      {log.transcript}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 9 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                      {log.ai_confidence && ` • ${log.ai_confidence}% confidence`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation - Show if fusion report exists */}
          {fusionReport && (
            <div style={{
              display: 'flex',
              gap: 4,
              marginBottom: 14,
              borderBottom: '1px solid #312e81',
              paddingBottom: 4
            }}>
              <button
                onClick={() => setActiveTab('fusion')}
                style={{
                  flex: 1,
                  background: activeTab === 'fusion' ? '#6366f1' : 'transparent',
                  color: activeTab === 'fusion' ? '#fff' : '#a5b4fc',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              >
                🧩 Fusion
              </button>
              <button
                onClick={() => setActiveTab('gemini')}
                style={{
                  flex: 1,
                  background: activeTab === 'gemini' ? '#6366f1' : 'transparent',
                  color: activeTab === 'gemini' ? '#fff' : '#a5b4fc',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              >
                🤖 Gemini
              </button>
              <button
                onClick={() => setActiveTab('grok')}
                style={{
                  flex: 1,
                  background: activeTab === 'grok' ? '#6366f1' : 'transparent',
                  color: activeTab === 'grok' ? '#fff' : '#a5b4fc',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              >
                🚀 Grok
              </button>
              <button
                onClick={() => setActiveTab('chatgpt')}
                style={{
                  flex: 1,
                  background: activeTab === 'chatgpt' ? '#6366f1' : 'transparent',
                  color: activeTab === 'chatgpt' ? '#fff' : '#a5b4fc',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              >
                💬 ChatGPT
              </button>
            </div>
          )}

          {/* Fusion Report Tab */}
          {fusionReport && activeTab === 'fusion' && (
            <>
              {/* Consensus Score Bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#a78bfa',
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>🎯 Consensus Score</span>
                  <span style={{
                    fontSize: 18,
                    color: fusionReport.consensus_score >= 80 ? '#10b981' :
                           fusionReport.consensus_score >= 60 ? '#fbbf24' : '#ef4444'
                  }}>
                    {fusionReport.consensus_score}%
                  </span>
                </div>
                <div style={{
                  background: '#1e1b4b',
                  height: 12,
                  borderRadius: 6,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${fusionReport.consensus_score}%`,
                    height: '100%',
                    background: fusionReport.consensus_score >= 80 ? 
                      'linear-gradient(90deg, #10b981, #34d399)' :
                      fusionReport.consensus_score >= 60 ?
                      'linear-gradient(90deg, #fbbf24, #fcd34d)' :
                      'linear-gradient(90deg, #ef4444, #f87171)',
                    transition: 'width 1s ease'
                  }} />
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#a5b4fc',
                  marginTop: 4
                }}>
                  Sources: {fusionReport.sources_used.join(', ')} • {fusionReport.executionTime}ms
                </div>
              </div>

              {/* Consensus Summary */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  marginBottom: 6
                }}>
                  🧠 Consensus Summary
                </div>
                <div style={{
                  background: '#1e1b4b',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#e0e7ff'
                }}>
                  {fusionReport.summary}
                </div>
              </div>

              {/* All Insights (Combined) */}
              {fusionReport.all_insights.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: '#34d399',
                    marginBottom: 6
                  }}>
                    💡 Top Insights (Multi-AI)
                  </div>
                  {fusionReport.all_insights.slice(0, 5).map((insight, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#1e1b4b',
                        padding: 8,
                        borderRadius: 8,
                        fontSize: 11,
                        marginBottom: 6,
                        color: '#e0e7ff',
                        borderLeft: '3px solid #8b5cf6'
                      }}
                    >
                      {insight}
                    </div>
                  ))}
                </div>
              )}

              {/* All Recommendations */}
              {fusionReport.all_recommendations.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: '#ec4899',
                    marginBottom: 6
                  }}>
                    🎯 Strategic Recommendations
                  </div>
                  {fusionReport.all_recommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#1e1b4b',
                        padding: 8,
                        borderRadius: 8,
                        fontSize: 11,
                        marginBottom: 6,
                        color: '#e0e7ff',
                        borderLeft: '3px solid #ec4899'
                      }}
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              )}

              {/* Errors (if any) */}
              {fusionReport.errors.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 11,
                    color: '#fbbf24',
                    background: '#44403c',
                    padding: 6,
                    borderRadius: 6
                  }}>
                    ⚠️ Some AI engines unavailable: {fusionReport.errors.map(e => e.source).join(', ')}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Grok Tab */}
          {fusionReport && activeTab === 'grok' && fusionReport.raw.grok && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  marginBottom: 6
                }}>
                  🚀 Market Intelligence (Grok)
                </div>
                <div style={{
                  background: '#1e1b4b',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#e0e7ff'
                }}>
                  {fusionReport.raw.grok.feedSummary}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#34d399',
                  marginBottom: 6
                }}>
                  📈 Market Signals
                </div>
                {fusionReport.raw.grok.marketSignals.map((signal, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#1e1b4b',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 11,
                      marginBottom: 6,
                      color: '#e0e7ff'
                    }}
                  >
                    • {signal}
                  </div>
                ))}
              </div>

              {fusionReport.raw.grok.sentiment && (
                <div style={{
                  background: '#1e1b4b',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#a5b4fc'
                }}>
                  <strong>Sentiment:</strong> {fusionReport.raw.grok.sentiment.overall} ({fusionReport.raw.grok.sentiment.score}/100)
                </div>
              )}
            </>
          )}

          {/* ChatGPT Tab */}
          {fusionReport && activeTab === 'chatgpt' && fusionReport.raw.chatgpt && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#ec4899',
                  marginBottom: 6
                }}>
                  💬 Executive Narrative (ChatGPT-5)
                </div>
                <div style={{
                  background: '#1e1b4b',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#e0e7ff'
                }}>
                  {fusionReport.raw.chatgpt.executiveSummary}
                </div>
              </div>

              {fusionReport.raw.chatgpt.strategicInsights.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: '#a78bfa',
                    marginBottom: 6
                  }}>
                    💡 Strategic Insights
                  </div>
                  {fusionReport.raw.chatgpt.strategicInsights.map((insight, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#1e1b4b',
                        padding: 8,
                        borderRadius: 8,
                        fontSize: 11,
                        marginBottom: 6,
                        color: '#e0e7ff'
                      }}
                    >
                      {i + 1}. {insight}
                    </div>
                  ))}
                </div>
              )}

              {fusionReport.raw.chatgpt.investorAppeal && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: 6
                  }}>
                    💎 Investor Appeal
                  </div>
                  <div style={{
                    background: '#1e1b4b',
                    padding: 10,
                    borderRadius: 8,
                    fontSize: 11,
                    color: '#e0e7ff'
                  }}>
                    <div style={{ marginBottom: 6 }}>
                      <strong style={{ color: '#34d399' }}>Strengths:</strong>
                      <ul style={{ marginLeft: 16, marginTop: 4 }}>
                        {fusionReport.raw.chatgpt.investorAppeal.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong style={{ color: '#fbbf24' }}>Concerns:</strong>
                      <ul style={{ marginLeft: 16, marginTop: 4 }}>
                        {fusionReport.raw.chatgpt.investorAppeal.concerns.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 'bold', color: '#a78bfa' }}>
                      Rating: {fusionReport.raw.chatgpt.investorAppeal.overallRating}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Gemini Tab - Show standard analysis when Gemini tab is selected */}
          {fusionReport && activeTab === 'gemini' && analysis && (
            <>
              {/* Standard Gemini Analysis Content - reusing existing code */}
            </>
          )}

          {/* Analysis Results (Standard Gemini - show when no fusion report or gemini tab) */}
          {((!fusionReport && analysis) || (fusionReport && activeTab === 'gemini' && analysis)) && (
            <>
              {/* Investor Brief */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  marginBottom: 6
                }}>
                  📊 Investor Brief
                </div>
                <div style={{
                  background: '#1e1b4b',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#e0e7ff'
                }}>
                  {analysis.investorBrief}
                </div>
              </div>

              {/* Next 3 Actions */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#34d399',
                  marginBottom: 6
                }}>
                  ⚡ Next 3 Actions
                </div>
                {analysis.nextActions.map((action, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#1e1b4b',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 12,
                      marginBottom: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ flex: 1, color: '#e0e7ff' }}>{action}</span>
                    <button
                      onClick={() => addToRoadmap(action)}
                      style={{
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 'bold',
                        marginLeft: 8
                      }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>

              {/* Risk Map */}
              <div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#f87171',
                  marginBottom: 6
                }}>
                  🚨 Risk Map
                </div>
                {analysis.riskMap.high.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{
                      fontSize: 11,
                      color: '#f87171',
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      HIGH
                    </div>
                    {analysis.riskMap.high.map((risk, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#7f1d1d',
                          padding: 6,
                          borderRadius: 6,
                          fontSize: 11,
                          marginBottom: 4,
                          color: '#fecaca'
                        }}
                      >
                        • {risk}
                      </div>
                    ))}
                  </div>
                )}
                {analysis.riskMap.medium.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{
                      fontSize: 11,
                      color: '#fbbf24',
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      MEDIUM
                    </div>
                    {analysis.riskMap.medium.map((risk, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#78350f',
                          padding: 6,
                          borderRadius: 6,
                          fontSize: 11,
                          marginBottom: 4,
                          color: '#fde68a'
                        }}
                      >
                        • {risk}
                      </div>
                    ))}
                  </div>
                )}
                {analysis.riskMap.low.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 11,
                      color: '#34d399',
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      LOW
                    </div>
                    {analysis.riskMap.low.map((risk, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#064e3b',
                          padding: 6,
                          borderRadius: 6,
                          fontSize: 11,
                          marginBottom: 4,
                          color: '#a7f3d0'
                        }}
                      >
                        • {risk}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State - show when no analysis at all */}
          {!analysis && !fusionReport && (
            <div style={{
              textAlign: 'center',
              padding: 30,
              color: '#a5b4fc',
              fontSize: 13
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
              <div>Click <strong>▶️ Analyze</strong> or <strong>🧩 Fusion</strong> to generate strategic insights</div>
            </div>
          )}

          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: -8,
            right: 20,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #6366f1'
          }} />
        </div>
      )}
      
      {/* Smart Voice Console v3 - Conversational Emma */}
      <SmartVoiceConsole onCommand={handleVoiceCommand} uiLang={currentLanguage} />
    </>
  );
}
