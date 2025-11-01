// src/components/AICoPilot.jsx
import React, { useState, useEffect } from 'react';
import { fetchGeminiAnalysis, testGeminiConnection } from '../api/geminiClient';
import { preparePrompt } from '../ai/autoAgent.browser';
import { saveRoadmapTask } from '../ai/persist';
import { useProjects, useRoadmap } from '../utils/useData';
import metricsData from '../data/metrics.json';

export default function AICoPilot() {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(() => {
    return localStorage.getItem('ahk-auto-analyze') === 'true';
  });
  const [investorKPIs, setInvestorKPIs] = useState(null);
  const projects = useProjects();
  const roadmap = useRoadmap();

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
      
      // Use new Gemini client
      const analysis = await fetchGeminiAnalysis(context);
      
      setAnalysis(analysis);
      setLastRun(new Date().toISOString());
      
      // Save to localStorage
      localStorage.setItem('ahk-ai-analysis', JSON.stringify({
        analysis,
        timestamp: new Date().toISOString(),
        kpis: htmlKPIs
      }));
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to run analysis. Check console for details.');
    } finally {
      setLoading(false);
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

    // Listen for voice command trigger
    function handleVoiceCommand() {
      runAnalysis();
      setExpanded(true);
    }
    window.addEventListener('runCoPilotAnalysis', handleVoiceCommand);

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
      };
    }

    return () => {
      window.removeEventListener('runCoPilotAnalysis', handleVoiceCommand);
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
            <button
              onClick={runAnalysis}
              disabled={loading}
              style={{
                background: loading ? '#4c1d95' : '#6366f1',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            >
              {loading ? '🔄 Running...' : '▶️ Analyze'}
            </button>
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

          {/* Analysis Results */}
          {analysis ? (
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
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 30,
              color: '#a5b4fc',
              fontSize: 13
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
              <div>Click <strong>▶️ Analyze</strong> to generate strategic insights</div>
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
    </>
  );
}
