// src/components/VoiceConsole.jsx
import React, { useEffect, useState, useRef } from 'react'
import { createVoiceAgent } from '../ai/voice'
import { askGemini } from '../ai/gemini'

// Lightweight imports from your data
import projectsData from '../data/projects.json'
import roadmapData from '../data/roadmap.json'

export default function VoiceConsole({ onRunAnalysis, onNavigate, onToggleAutoSync }) {
  const [status, setStatus] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const agentRef = useRef(null)

  useEffect(() => {
    agentRef.current = createVoiceAgent({
      onStatus: setStatus,
      onTranscript: setTranscript,
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
    }
    // eslint-disable-next-line
  }, [status])

  function say(text) {
    setReply(text)
    agentRef.current?.speak(text)
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
    <div style={{
      position: 'fixed',
      right: 18,
      bottom: 18,
      zIndex: 9999,
      background: '#0A192F',
      color: '#F4E5B1',
      border: '1px solid #D4AF37',
      borderRadius: 14,
      padding: 14,
      width: 360,
      boxShadow: '0 10px 30px rgba(0,0,0,.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button
          onClick={status === 'listening' ? stop : start}
          style={{
            background: status === 'listening' ? '#D4AF37' : '#1f2d4a',
            color: status === 'listening' ? '#0A192F' : '#F4E5B1',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {status === 'listening' ? '● Listening' : '🎙️ Start Voice'}
        </button>
        <div style={{ opacity: 0.8, fontSize: 12 }}>
          Status: {status}
        </div>
      </div>

      <div style={{
        background: '#101b33',
        padding: 10,
        borderRadius: 10,
        minHeight: 46,
        color: '#CCD6F6',
        marginBottom: 8
      }}>
        <strong>Heard:</strong> {transcript || <em>…</em>}
      </div>
      <div style={{
        background: '#101b33',
        padding: 10,
        borderRadius: 10,
        minHeight: 56,
        color: '#F4E5B1'
      }}>
        <strong>Reply:</strong> {reply || <em>Ready. Press ` or click Start Voice.</em>}
      </div>
    </div>
  )
}
