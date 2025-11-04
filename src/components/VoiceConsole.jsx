// src/components/VoiceConsole.jsx
import React, { useEffect, useState, useRef } from 'react'
import { createVoiceAgent, setVoiceLanguage } from '../ai/voice'
import { PHRASES, matches } from '../ai/lang'
import { saveRoadmapTask } from '../ai/persist'
import { askGemini } from '../ai/gemini'
import { mapIntent, getConfidence } from '../ai/intentMapper'
import { createTask, updateTaskStatus, appendNote, parseTaskCommand } from '../ai/taskAgent'

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
  const isStopped = useRef(false) // Track if user explicitly stopped

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
      // Auto-close console after 60 seconds of inactivity
      if (status === 'idle' && !isStopped.current) {
        console.log('⏰ Auto-closing due to 60s inactivity');
        setExpanded(false)
        setReply('')
        setTranscript('')
      }
    }, 60000) // 60 seconds
  }

  function say(text) {
    // Don't speak if user has explicitly stopped
    if (isStopped.current) {
      console.log('🛑 Speech blocked - user stopped console');
      return;
    }
    
    // Cancel any ongoing speech before starting new one
    window.speechSynthesis.cancel();
    
    setReply(text)
    agentRef.current?.speak(text)
    setExpanded(true)
    resetInactivityTimer()
    
    // Auto-close after speech completes
    const utteranceLength = text.length * 50; // Rough estimate: 50ms per character
    setTimeout(() => {
      if (!isStopped.current && status === 'idle') {
        setExpanded(false);
        setReply('');
        setTranscript('');
      }
    }, Math.max(utteranceLength, 4000)); // Minimum 4 seconds
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
      // User is closing console - stop everything
      stop();
    } else {
      // User is opening console
      isStopped.current = false; // Reset stop flag when opening
      setExpanded(true)
      agentRef.current?.start()
    }
  }

  function stop() {
    console.log('🛑 STOP BUTTON PRESSED - Killing all speech');
    
    // Set stop flag to block any new speech
    isStopped.current = true;
    
    // Kill all speech synthesis immediately
    window.speechSynthesis.cancel();
    
    // Stop voice recognition
    agentRef.current?.stop();
    
    // Clear UI
    setReply('');
    setTranscript('');
    setStatus('idle');
    
    // Close console after brief delay
    setTimeout(() => {
      setExpanded(false);
      // Reset stop flag after console closes
      setTimeout(() => {
        isStopped.current = false;
      }, 500);
    }, 800);
  }

  async function handleCommand(raw) {
    // 🧠 Map natural language to intent
    const intent = mapIntent(raw);
    const confidence = getConfidence(raw, intent);
    
    console.log(`🎯 Intent: ${intent} (${confidence}% confidence) - Command: "${raw}"`);

    // 🛑 STOP TALKING (HIGHEST PRIORITY - NO SPEECH ALLOWED!)
    // English: stop, quiet, silence, shut up, enough, cancel, halt, pause
    // Arabic: قف، اسكت، كفى، خلاص
    const cmd = raw.toLowerCase();
    if (intent === 'stop' || 
        cmd.includes('قف') || cmd.includes('اسكت') || cmd.includes('كفى') || cmd.includes('خلاص')) {
      
      console.log('🛑 STOP COMMAND DETECTED - Killing all speech NOW');
      
      // Set stop flag FIRST to block any further speech
      isStopped.current = true;
      
      // Kill all speech synthesis immediately
      window.speechSynthesis.cancel();
      
      // Stop voice recognition
      agentRef.current?.stop();
      
      // Clear UI
      setReply('');
      setTranscript('');
      setStatus('idle');
      
      // Close console after brief delay
      setTimeout(() => {
        setExpanded(false);
        // Reset stop flag after console closes
        isStopped.current = false;
      }, 1000);
      
      return; // EXIT IMMEDIATELY - NO MORE CODE EXECUTION
    }
    
    // Reset stop flag for normal commands
    isStopped.current = false;
    
    // If no intent matched, try fallback
    if (!intent) {
      return handleFallback(raw);
    }
    
    // Execute intent-based commands
    return executeIntent(intent, raw);
  }
  
  async function executeIntent(intent, rawCommand) {
    switch (intent) {
      // Navigation
      case 'openDashboard':
        onNavigate?.('/dashboard');
        return say('Opening dashboard. Your command center awaits.');
        
      case 'openStrategy':
        onNavigate?.('/strategy');
        return say('Showing strategy and roadmap. Let\'s plan the future.');
        
      case 'openMarketing':
        onNavigate?.('/marketing');
        return say('Opening marketing pulse. Let\'s see the market insights.');
        
      case 'openAssets':
        onNavigate?.('/assets');
        return say('Opening asset vault. Your secure documents are ready.');
        
      case 'openPartnerships':
        onNavigate?.('/partnerships');
        return say('Opening partnerships. Let\'s review our network.');
        
      // AI Analysis
      case 'runAnalysis':
        window.dispatchEvent(new CustomEvent('runCoPilotAnalysis'));
        return say('Got it! Launching AI Co-Pilot analysis now. Gemini is analyzing your strategic data.');
        
      case 'runSync':
        say('Running Emma memory sync. Please wait.');
        try {
          // Trigger the sync script
          const response = await fetch('/api/emma-sync', { method: 'POST' });
          if (response.ok) {
            return say('Synchronization complete, Ash. Memory and logs synced to both drives.');
          } else {
            return say('Sync failed. Please check the console for details.');
          }
        } catch (error) {
          console.error('Sync error:', error);
          return say('Unable to run sync. The sync service may be unavailable.');
        }
        
      case 'runFusion':
        window.dispatchEvent(new CustomEvent('runFusionAnalysis'));
        return say('Initiating Multi-AI Fusion Analysis. Gemini, Grok, and ChatGPT are collaborating on your intelligence report.');
        
      case 'showFusion':
        const fusionData = localStorage.getItem('ahk-fusion-analysis');
        if (fusionData) {
          try {
            const data = JSON.parse(fusionData);
            if (data.fusion) {
              const { consensus_score, sources_used, summary } = data.fusion;
              return say(`Fusion Report ready. Consensus score is ${consensus_score} percent from ${sources_used.length} AI sources. ${summary.substring(0, 200)}`);
            }
          } catch (e) {
            console.error('Failed to read fusion report:', e);
          }
        }
        return say('No fusion report available yet. Run fusion analysis first to generate a multi-AI consensus report.');
        
      // Investor & Portfolio
      case 'investorBrief':
        const savedAnalysis = localStorage.getItem('ahk-ai-analysis');
        if (savedAnalysis) {
          try {
            const data = JSON.parse(savedAnalysis);
            if (data.analysis?.investorBrief) {
              return say(`Here's your investor brief: ${data.analysis.investorBrief}`);
            }
          } catch (e) {
            console.error('Failed to read stored analysis:', e);
          }
        }
        return say('No investor brief available yet. Run Co-Pilot analysis to generate strategic insights for investors.');
        
      // Actions & Tasks
      case 'nextActions':
        const actionsData = localStorage.getItem('ahk-ai-analysis');
        if (actionsData) {
          try {
            const data = JSON.parse(actionsData);
            if (data.analysis?.nextActions) {
              const actions = data.analysis.nextActions.slice(0, 3).join('. Next, ');
              return say(`Here are your top 3 priority actions: ${actions}`);
            }
          } catch (e) {
            console.error('Failed to read actions:', e);
          }
        }
        return say('No actions available yet. Run Co-Pilot analysis to get AI-recommended next steps.');
        
      case 'overdueReview':
        const today = new Date();
        const overdue = roadmapData.filter(t => 
          t.status !== 'done' && 
          t.due && 
          new Date(t.due) < today
        );
        if (overdue.length === 0) {
          return say('Great news! No overdue tasks. You\'re on schedule.');
        }
        return say(`You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}. Check the strategy page for details.`);
        
      // Risk & Alerts
      case 'riskReport':
        const riskData = localStorage.getItem('ahk-ai-analysis');
        if (riskData) {
          try {
            const data = JSON.parse(riskData);
            if (data.analysis?.riskMap) {
              const { high, medium, low } = data.analysis.riskMap;
              const highCount = high?.length || 0;
              const medCount = medium?.length || 0;
              const lowCount = low?.length || 0;
              return say(`Risk assessment complete: ${highCount} high priority risks, ${medCount} medium priority, and ${lowCount} low priority. Review the Co-Pilot panel for detailed mitigation strategies.`);
            }
          } catch (e) {
            console.error('Failed to read risk map:', e);
          }
        }
        return say('No risk assessment available yet. Run Co-Pilot analysis to generate a comprehensive risk map.');
        
      // Project Info
      case 'projectSummary':
        const activeCount = projectsData.filter(p => p.status === 'active').length;
        const plannedCount = projectsData.filter(p => p.status === 'planned').length;
        return say(`Portfolio summary: ${activeCount} active projects, ${plannedCount} in planning phase. Total strategic value across all initiatives.`);
        
      // Settings
      case 'enableAutoSync':
        onToggleAutoSync?.(true);
        return say('Auto-sync activated. I will run analysis every 24 hours automatically.');
        
      case 'disableAutoSync':
        onToggleAutoSync?.(false);
        return say('Auto-sync disabled. Manual analysis only.');
        
      // 🪄 TASK MANAGEMENT (Mission #11)
      case 'createTask': {
        const parsed = parseTaskCommand(rawCommand);
        say(`Creating task: ${parsed.title}. Please wait.`);
        const result = await createTask(
          parsed.title,
          parsed.projectId,
          parsed.priority,
          parsed.dueDate
        );
        if (result.success) {
          return say(`Task created successfully. ${parsed.title} added to ${parsed.projectId} project with ${parsed.priority} priority.`);
        } else {
          return say(`Failed to create task: ${result.error}`);
        }
      }
      
      case 'updateTask': {
        // Extract task ID from command
        const taskIdMatch = rawCommand.match(/T-\d+/i);
        if (!taskIdMatch) {
          return say('Please specify a task ID, like T-0001.');
        }
        const taskId = taskIdMatch[0];
        // Determine new status from command
        let status = 'in-progress';
        if (rawCommand.toLowerCase().includes('done') || rawCommand.toLowerCase().includes('complete')) {
          status = 'done';
        } else if (rawCommand.toLowerCase().includes('pending') || rawCommand.toLowerCase().includes('todo')) {
          status = 'pending';
        } else if (rawCommand.toLowerCase().includes('blocked') || rawCommand.toLowerCase().includes('stuck')) {
          status = 'blocked';
        }
        say(`Updating task ${taskId} to ${status}. Please wait.`);
        const result = await updateTaskStatus(taskId, status);
        if (result.success) {
          return say(`Task ${taskId} updated to ${status}.`);
        } else {
          return say(`Failed to update task: ${result.error}`);
        }
      }
      
      case 'completeTask': {
        const taskIdMatch = rawCommand.match(/T-\d+/i);
        if (!taskIdMatch) {
          return say('Please specify a task ID to complete, like T-0001.');
        }
        const taskId = taskIdMatch[0];
        say(`Marking task ${taskId} as done. Please wait.`);
        const result = await updateTaskStatus(taskId, 'done');
        if (result.success) {
          return say(`Great! Task ${taskId} marked as complete. Well done!`);
        } else {
          return say(`Failed to complete task: ${result.error}`);
        }
      }
      
      case 'addNote': {
        const taskIdMatch = rawCommand.match(/T-\d+/i);
        if (!taskIdMatch) {
          return say('Please specify a task ID for the note, like T-0001.');
        }
        const taskId = taskIdMatch[0];
        // Extract note text (everything after task ID)
        const noteText = rawCommand.replace(/add note (to )?T-\d+/i, '').trim();
        if (!noteText) {
          return say('Please provide the note text.');
        }
        say(`Adding note to task ${taskId}. Please wait.`);
        const result = await appendNote(taskId, noteText);
        if (result.success) {
          return say(`Note added to task ${taskId}.`);
        } else {
          return say(`Failed to add note: ${result.error}`);
        }
      }
      
      case 'updateRoadmap':
        say('Refreshing roadmap data. Please wait.');
        try {
          const timestamp = Date.now();
          const response = await fetch(`/roadmap.json?v=${timestamp}`);
          const freshData = await response.json();
          window.dispatchEvent(new CustomEvent('roadmapUpdated', { detail: freshData }));
          return say(`Roadmap refreshed successfully. ${freshData.length} tasks loaded.`);
        } catch (error) {
          return say('Failed to refresh roadmap. Please try again.');
        }
      
      case 'dailySummary': {
        const tasks = roadmapData;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const today = new Date();
        const overdue = tasks.filter(t => 
          t.status !== 'done' && 
          t.due && 
          new Date(t.due) < today
        ).length;
        
        const summary = `Daily task summary: You have ${pending} pending tasks, ${inProgress} in progress, and ${completed} completed. ${overdue > 0 ? `Alert: ${overdue} tasks are overdue.` : 'All tasks are on track.'}`;
        return say(summary);
      }
        
      // Help
      case 'help':
        return say('I understand natural commands like: run analysis, show me the fusion report, create task, update task, mark task done, daily summary, what should I do next, any risks, open dashboard, and much more. Just speak naturally and I\'ll understand.');
        
      default:
        return handleFallback(rawCommand);
    }
  }
  
  async function handleFallback(raw) {
    const cmd = raw.toLowerCase();
    
    // Don't speak if user has stopped
    if (isStopped.current) {
      console.log('🛑 Fallback blocked - user stopped');
      return;
    }
    
    // Handle open-ended questions by asking Gemini AI
    if (cmd.includes('gemini') || cmd.includes('ask gemini') || cmd.includes('جيميني')) {
      try {
        const response = await askGemini(cmd);
        return say(response);
      } catch (error) {
        console.error('Gemini error:', error);
        // Don't say anything on error - just log it
        console.log('⚠️ Gemini unavailable - silently failing');
        return;
      }
    }

    // FINAL FALLBACK - only speak once
    say('I didn\'t quite catch that. Try saying things like: run analysis, show fusion report, what should I do next, any risks, or open dashboard. Say "help" to hear all available commands.');
  }

  function start() {
    agentRef.current?.start()
  }

  function stop() {
    window.speechSynthesis.cancel() // Stop all speech
    agentRef.current?.stop()
    setStatus('idle')
    setReply('')
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
              <button
                onClick={stop}
                style={{
                  background: status === 'listening' ? '#D4AF37' : '#8892B0',
                  color: '#0A192F',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              >
                ⏹️ Stop
              </button>
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
