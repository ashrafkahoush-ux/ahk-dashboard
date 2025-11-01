// src/components/VoiceConsole.jsx
import React, { useEffect, useState, useRef } from 'react'
import { createVoiceAgent, setVoiceLanguage } from '../ai/voice'
import { PHRASES, matches } from '../ai/lang'
import { saveRoadmapTask } from '../ai/persist'
import { askGemini } from '../ai/gemini'

// Lightweight imports from your data
import projectsData from '../data/projects.json'
import roadmapData from '../data/roadmap.json'

export default function VoiceConsole({ onRunAnalysis, onNavigate, onToggleAutoSync }) {
  const [status, setStatus] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('voiceLang') || 'EN'
  })
  const [expanded, setExpanded] = useState(false)
  const agentRef = useRef(null)
  const inactivityTimer = useRef(null)

  useEffect(() => {
    // Set language on mount
    setVoiceLanguage(lang)
    localStorage.setItem('voiceLang', lang)

    agentRef.current = createVoiceAgent({
      onStatus: (s) => {
        setStatus(s)
        if (s === 'listening') setExpanded(true)
      },
      onTranscript: (t) => {
        setTranscript(t)
        resetInactivityTimer()
      },
      onCommand: handleCommand
    })

    // Keyboard shortcut: backtick (`) to toggle mic
    function onKey(e) {
      if (e.key === '`') {
        e.preventDefault()
        if (status === 'listening') {
          agentRef.current?.stop()
        } else {
          agentRef.current?.start()
        }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      agentRef.current?.stop()
      window.removeEventListener('keydown', onKey)
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
    // eslint-disable-next-line
  }, [status, lang])

  function resetInactivityTimer() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      if (status === 'idle') setExpanded(false)
    }, 3000)
  }

  function say(text) {
    setReply(text)
    agentRef.current?.speak(text)
    setExpanded(true)
    resetInactivityTimer()
  }

  function toggleLang() {
    const newLang = lang === 'EN' ? 'AR' : 'EN'
    setLang(newLang)
    setVoiceLanguage(newLang)
    localStorage.setItem('voiceLang', newLang)
    // Restart recognition if active
    if (status === 'listening') {
      agentRef.current?.stop()
      setTimeout(() => agentRef.current?.start(), 500)
    }
    const msg = newLang === 'AR' ? 'تم التبديل إلى العربية' : 'Switched to English'
    say(msg)
  }

  function toggleExpanded() {
    if (expanded) {
      setExpanded(false)
    } else {
      setExpanded(true)
      agentRef.current?.start()
    }
  }

  function stop() {
    agentRef.current?.stop()
    setStatus('idle')
    setTimeout(() => setExpanded(false), 2000)
  }

  async function handleCommand(raw) {
    const cmd = raw.toLowerCase()

    // NAVIGATION
    if (cmd.includes('open dashboard')) {
      onNavigate?.('/dashboard')
      return say('Opening dashboard.')
    }
    if (cmd.includes('open strategy') || cmd.includes('show roadmap')) {
      onNavigate?.('/strategy')
      return say('Showing strategy and roadmap.')
    }
    if (cmd.includes('open partnerships')) {
      onNavigate?.('/partnerships')
      return say('Opening partnerships.')
    }
    if (cmd.includes('open marketing')) {
      onNavigate?.('/marketing')
      return say('Opening marketing pulse.')
    }
    if (cmd.includes('open assets') || cmd.includes('asset vault')) {
      onNavigate?.('/assets')
      return say('Opening asset vault.')
    }

    // ANALYSIS
    if (cmd.includes('run analysis') || cmd.includes('ai analysis')) {
      await onRunAnalysis?.()
      return say('AI analysis executed. Check the dashboard cards and console report.')
    }

    // AUTOSYNC
    if (cmd.includes('enable auto') || cmd.includes('turn on auto')) {
      onToggleAutoSync?.(true)
      return say('Auto-sync enabled. I will run analysis daily.')
    }
    if (cmd.includes('disable auto') || cmd.includes('turn off auto')) {
      onToggleAutoSync?.(false)
      return say('Auto-sync disabled.')
    }

    // OVERDUE / SUMMARY
    if (cmd.includes('what is overdue') || cmd.includes('overdue tasks')) {
      const today = new Date()
      const overdue = roadmapData.filter(t => 
        t.status !== 'done' && 
        t.due && 
        new Date(t.due) < today
      )
      if (!overdue.length) return say('No overdue tasks. Marvelous.')
      const top = overdue.slice(0, 3).map(t => t.title).join('; ')
      return say(`Overdue: ${top}${overdue.length > 3 ? ' and more' : ''}.`)
    }

    // PROJECT SUMMARY
    if (cmd.includes('project summary') || cmd.includes('how are projects')) {
      const total = projectsData.length
      const avgProgress = (projectsData.reduce((sum, p) => sum + (p.progress || 0), 0) / total).toFixed(0)
      const leading = projectsData.filter(p => p.progress > 60)
      return say(`We have ${total} active projects with average progress of ${avgProgress} percent. ${leading.length} projects are leading above 60 percent.`)
    }

    // MARK COMPLETE (simple heuristic: "mark <id> done" or "complete T003")
    if (cmd.includes('mark') && (cmd.includes('complete') || cmd.includes('done'))) {
      const id = (cmd.match(/t[-\s]?\d{3,4}/i) || [])[0]
      if (!id) return say('Please specify a task ID like T dash zero zero three.')
      return say(`I will mark ${id.toUpperCase()} complete in the interface. Remember to update roadmap dot json for persistence.`)
    }

    // GEMINI ADVICE
    if (cmd.includes('ask gemini') || cmd.includes('gemini advice')) {
      try {
        say('Consulting Gemini. Please wait.')
        const latest = window.__LAST_AI_REPORT__ || 'No local report captured yet.'
        const ai = await askGemini({ 
          projects: projectsData, 
          roadmap: roadmapData, 
          latestReport: latest 
        })
        say('Gemini returned fresh advice. Check the reply box for details.')
        setReply(ai?.advice || ai?.message || 'No advice field returned.')
      } catch (e) {
        console.error('Gemini error:', e)
        say('Gemini hook not connected yet. Check AI Integration Guide for setup instructions.')
      }
      return
    }

    // HELP
    if (cmd.includes('help') || cmd.includes('what can you do')) {
      return say('You can say: run analysis, what is overdue, project summary, open dashboard, open strategy, open partnerships, enable autosync, disable autosync, ask Gemini.')
    }

    // FALLBACK
    say('Command not recognized. Try: run analysis, what is overdue, open strategy, or say help for more options.')
  }

  function start() {
    agentRef.current?.start()
  }

  function stop() {
    agentRef.current?.stop()
    setStatus('idle')
  }

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={toggleExpanded}
        title={`Start Voice Assistant (Press \`)`}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 9999,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: status === 'listening' 
            ? 'linear-gradient(135deg, #D4AF37 0%, #F4E5B1 100%)'
            : 'linear-gradient(135deg, #0A192F 0%, #1f2d4a 100%)',
          color: status === 'listening' ? '#0A192F' : '#D4AF37',
          border: status === 'listening' ? '3px solid #F4E5B1' : '2px solid #D4AF37',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: status === 'listening' 
            ? '0 8px 32px rgba(212, 175, 55, 0.6), 0 0 20px rgba(212, 175, 55, 0.4)'
            : '0 8px 24px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: status === 'listening' ? 'pulse 2s infinite' : 'none'
        }}
      >
        🎙️
      </button>

      {/* Expanded Chat Bubble */}
      {expanded && (
        <div style={{
          position: 'fixed',
          right: 24,
          bottom: 94,
          zIndex: 9998,
          background: '#0A192F',
          color: '#F4E5B1',
          border: '1px solid #D4AF37',
          borderRadius: 16,
          padding: 14,
          width: 320,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header with Language Toggle */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 10,
            paddingBottom: 8,
            borderBottom: '1px solid #1f2d4a'
          }}>
            <div style={{ 
              fontSize: 13, 
              fontWeight: 'bold',
              color: status === 'listening' ? '#D4AF37' : '#8892B0'
            }}>
              {status === 'listening' ? '● Listening...' : 'Voice Assistant'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={toggleLang}
                style={{
                  background: '#1f2d4a',
                  color: '#D4AF37',
                  border: '1px solid #D4AF37',
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              >
                {lang}
              </button>
              {status === 'listening' && (
                <button
                  onClick={stop}
                  style={{
                    background: '#D4AF37',
                    color: '#0A192F',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 'bold'
                  }}
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Heard */}
          {transcript && (
            <div style={{
              background: '#101b33',
              padding: 8,
              borderRadius: 8,
              marginBottom: 8,
              fontSize: 12,
              color: '#CCD6F6'
            }}>
              <strong style={{ color: '#D4AF37' }}>Heard:</strong> {transcript}
            </div>
          )}

          {/* Reply */}
          {reply && (
            <div style={{
              background: '#101b33',
              padding: 8,
              borderRadius: 8,
              fontSize: 12,
              color: '#F4E5B1',
              maxHeight: 100,
              overflowY: 'auto'
            }}>
              <strong style={{ color: '#D4AF37' }}>Reply:</strong> {reply}
            </div>
          )}

          {/* Initial State */}
          {!transcript && !reply && (
            <div style={{
              fontSize: 12,
              color: '#8892B0',
              textAlign: 'center',
              padding: 12
            }}>
              <em>Say a command or press ` to start...</em>
            </div>
          )}

          {/* Arrow pointing down to button */}
          <div style={{
            position: 'absolute',
            bottom: -8,
            right: 26,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #D4AF37'
          }} />
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(212, 175, 55, 0.6), 0 0 20px rgba(212, 175, 55, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 8px 40px rgba(212, 175, 55, 0.8), 0 0 30px rgba(212, 175, 55, 0.6); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
