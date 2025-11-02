import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    middlewareMode: false,
    // Dev-only API endpoint for voice task persistence
    configureServer(server) {
      // API: Save roadmap task (Enhanced for AI Task Orchestration)
      server.middlewares.use('/api/save-roadmap', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        try {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const data = JSON.parse(body || '{}')
            const { action = 'save', task, taskId, updates, note } = data
            
            const file = path.resolve(__dirname, 'src/data/roadmap.json')
            const json = JSON.parse(fs.readFileSync(file, 'utf8'))
            
            // ACTION: CREATE - Add new task
            if (action === 'create') {
              if (!task || !task.id) {
                res.statusCode = 400
                return res.end('Bad task: missing id')
              }
              // Prevent duplicate ids
              if (json.find(t => t.id === task.id)) {
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ ok: true, count: json.length, note: 'duplicate id ignored' }))
              }
              json.push(task)
              fs.writeFileSync(file, JSON.stringify(json, null, 2))
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ ok: true, action: 'created', taskId: task.id, count: json.length }))
            }
            
            // ACTION: UPDATE - Modify existing task
            if (action === 'update') {
              if (!taskId || !updates) {
                res.statusCode = 400
                return res.end('Bad request: missing taskId or updates')
              }
              const taskIndex = json.findIndex(t => t.id === taskId)
              if (taskIndex === -1) {
                res.statusCode = 404
                return res.end(`Task not found: ${taskId}`)
              }
              // Merge updates into existing task
              json[taskIndex] = { ...json[taskIndex], ...updates }
              fs.writeFileSync(file, JSON.stringify(json, null, 2))
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ ok: true, action: 'updated', taskId }))
            }
            
            // ACTION: APPEND - Add note to task
            if (action === 'append') {
              if (!taskId || !note) {
                res.statusCode = 400
                return res.end('Bad request: missing taskId or note')
              }
              const taskIndex = json.findIndex(t => t.id === taskId)
              if (taskIndex === -1) {
                res.statusCode = 404
                return res.end(`Task not found: ${taskId}`)
              }
              // Initialize notes array if it doesn't exist
              if (!json[taskIndex].notes) {
                json[taskIndex].notes = []
              }
              json[taskIndex].notes.push(note)
              json[taskIndex].updated_at = new Date().toISOString()
              fs.writeFileSync(file, JSON.stringify(json, null, 2))
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ ok: true, action: 'appended', taskId, noteCount: json[taskIndex].notes.length }))
            }
            
            // BACKWARD COMPATIBILITY: Default save action
            if (!task || !task.id) {
              res.statusCode = 400
              return res.end('Bad task')
            }
            if (json.find(t => t.id === task.id)) {
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ ok: true, count: json.length, note: 'duplicate id ignored' }))
            }
            json.push(task)
            fs.writeFileSync(file, JSON.stringify(json, null, 2))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, count: json.length }))
          })
        } catch (e) {
          console.error('API error:', e)
          res.statusCode = 500
          res.end('Internal Error')
        }
      })

      // API: Log task action to task-log.json
      server.middlewares.use('/api/log-task-action', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        try {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const logEntry = JSON.parse(body || '{}')
            const file = path.resolve(__dirname, 'src/data/task-log.json')
            const logs = JSON.parse(fs.readFileSync(file, 'utf8'))
            logs.unshift(logEntry) // Add to beginning (most recent first)
            // Keep only last 100 entries
            if (logs.length > 100) {
              logs.length = 100
            }
            fs.writeFileSync(file, JSON.stringify(logs, null, 2))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, logged: true }))
          })
        } catch (e) {
          console.error('Task log error:', e)
          res.statusCode = 500
          res.end('Internal Error')
        }
      })

      // API: Get recent task log entries
      server.middlewares.use('/api/get-task-log', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        try {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const limit = parseInt(url.searchParams.get('limit') || '5')
          const file = path.resolve(__dirname, 'src/data/task-log.json')
          const logs = JSON.parse(fs.readFileSync(file, 'utf8'))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ logs: logs.slice(0, limit) }))
        } catch (e) {
          console.error('Task log read error:', e)
          res.statusCode = 500
          res.end('Internal Error')
        }
      })

      // API: Parse HTML reports for KPIs
      server.middlewares.use('/api/parse-html-reports', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        try {
          const reportsDir = path.resolve(__dirname, 'public/assets/reports')
          const reportFiles = [
            'Q-VAN-full-FS.html',
            'EV-Logistics-General-Study.html',
            'WOW-MENA-Feasibility-InvestorEdition.html'
          ]

          const extractedData = {}

          for (const filename of reportFiles) {
            const filePath = path.join(reportsDir, filename)
            
            if (fs.existsSync(filePath)) {
              const html = fs.readFileSync(filePath, 'utf8')
              extractedData[filename] = parseHTMLReport(html, filename)
            } else {
              console.warn(`Report not found: ${filename}`)
              extractedData[filename] = {
                status: 'not_found',
                message: 'Report file not available yet'
              }
            }
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            reports: extractedData
          }))
        } catch (e) {
          console.error('HTML parsing error:', e)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: false,
            error: e.message
          }))
        }
      })

      // API: Grok Market Feed (Mock)
      server.middlewares.use('/api/grok-feed', async (req, res) => {
        try {
          if (req.method === 'GET') {
            // Health check
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ status: 'ok', service: 'Grok Mock API' }))
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            return res.end('Method Not Allowed')
          }

          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const { sectors = [], region = 'MENA', focusAreas = [] } = JSON.parse(body || '{}')
            
            // Simulate API delay
            setTimeout(() => {
              const mockResponse = {
                summary: `MENA ${sectors.join('/')} sector shows strong growth momentum with ${focusAreas.length} focus areas tracked.`,
                signals: [
                  'Saudi Arabia EV infrastructure investment reaches $7B target',
                  'UAE micro-mobility regulations updated (favorable)',
                  'NEOM smart city mobility contracts opening Q1 2026',
                  'Regional logistics costs down 18% YoY',
                  'Climate tech funding in MENA up 127% in 2025'
                ],
                sentiment: {
                  overall: 'bullish',
                  score: 74,
                  rationale: 'Strong government support and growing investment'
                },
                trending: ['#MENAMobility', '#SaudiEV', '#SmartCities', '#NEOM'],
                competitors: [
                  'Uber expanding Careem logistics',
                  'Bolt launching e-scooter service in Dubai',
                  'Local startup NextMove raised $45M Series B'
                ],
                regulatory: [
                  'UAE Federal Transport Authority updated guidelines',
                  'Saudi Arabia approved autonomous vehicle pilot'
                ],
                sources: Array(47).fill(null).map((_, i) => ({ id: i + 1, type: 'news' })),
                timestamp: new Date().toISOString()
              }
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(mockResponse))
            }, 800) // Simulate network delay
          })
        } catch (error) {
          console.error('Grok API error:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Internal server error' }))
        }
      })

      // API: ChatGPT-5 Narrative (Mock)
      server.middlewares.use('/api/chatgpt5', async (req, res) => {
        try {
          if (req.method === 'GET') {
            // Health check
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ status: 'ok', service: 'ChatGPT-5 Mock API' }))
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            return res.end('Method Not Allowed')
          }

          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const { prompt, context } = JSON.parse(body || '{}')
            const { projectCount = 0, taskCount = 0 } = context || {}
            
            // Simulate API delay
            setTimeout(() => {
              const mockResponse = {
                executiveSummary: `AHK Strategies demonstrates strong institutional capacity across ${projectCount} strategic mobility projects. With ${taskCount} tracked milestones, the organization exhibits mature program management capabilities. The MENA-focused portfolio leverages regional growth dynamics while diversifying across complementary mobility sectors. Current execution velocity positions AHK for institutional capital raising in the 2025-2026 window. Strategic timing and portfolio composition create attractive risk-adjusted returns for infrastructure and impact investors.`,
                strategicInsights: [
                  'Portfolio diversification across 3+ mobility sectors mitigates single-point risk',
                  'MENA focus aligns with government Vision 2030 initiatives across GCC',
                  'Execution momentum demonstrates institutional project delivery capability',
                  'Feasibility studies position portfolio for institutional fundraising',
                  'Market entry timing precedes expected 2026 regulatory harmonization'
                ],
                recommendations: [
                  'Accelerate flagship projects through strategic partnerships with OEMs',
                  'Target Q1 2025 for Series A conversations with infrastructure funds',
                  'Develop ESG narrative highlighting sustainability alignment',
                  'Consider pre-seed raise of $3-5M to reach beta/pilot milestones',
                  'Establish advisory board with regional logistics/mobility executives'
                ],
                investorAppeal: {
                  strengths: [
                    'Diversified revenue streams',
                    'High-growth MENA market',
                    'Strong execution metrics',
                    'Government mega-project alignment'
                  ],
                  concerns: [
                    'Capital requirements for momentum',
                    'Regulatory uncertainty',
                    'Well-funded international competition',
                    'Localization complexity'
                  ],
                  overallRating: 'Attractive (B+/A-)',
                  targetInvestors: 'Infrastructure funds, family offices, impact investors'
                },
                tone: 'professional-optimistic',
                confidence: 88,
                timestamp: new Date().toISOString()
              }
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(mockResponse))
            }, 1200) // Simulate network delay
          })
        } catch (error) {
          console.error('ChatGPT API error:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Internal server error' }))
        }
      })

      // API: Generate Report
      server.middlewares.use('/api/generate-report', async (req, res) => {
        try {
          if (req.method !== 'POST') {
            res.statusCode = 405
            return res.end('Method Not Allowed')
          }

          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const { format = 'pdf', includeCharts = true, sections = [] } = JSON.parse(body || '{}')
            
            console.log('📊 GENERATE REPORT TRIGGERED')
            console.log(`   Format: ${format}`)
            console.log(`   Include Charts: ${includeCharts}`)
            console.log(`   Sections: ${sections.join(', ') || 'All'}`)
            console.log(`   Timestamp: ${new Date().toISOString()}`)
            
            // Simulate report generation
            setTimeout(() => {
              const mockResponse = {
                success: true,
                reportId: `RPT-${Date.now()}`,
                format,
                filename: `AHK-Strategic-Report-${new Date().toISOString().split('T')[0]}.${format}`,
                size: '2.4 MB',
                sections: sections.length > 0 ? sections : [
                  'Executive Summary',
                  'Portfolio Overview',
                  'Financial Metrics',
                  'Project Status',
                  'Risk Analysis',
                  'Strategic Recommendations'
                ],
                generatedAt: new Date().toISOString(),
                downloadUrl: '/api/download-report',
                message: '✅ Report generated successfully'
              }
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(mockResponse))
            }, 1500) // Simulate generation time
          })
        } catch (error) {
          console.error('❌ Report generation error:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: error.message }))
        }
      })

      // API: Run Analysis (Dedicated endpoint for analytics tracking)
      server.middlewares.use('/api/run-analysis', async (req, res) => {
        try {
          if (req.method !== 'POST') {
            res.statusCode = 405
            return res.end('Method Not Allowed')
          }

          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const { analysisType = 'full', trigger = 'manual' } = JSON.parse(body || '{}')
            
            console.log('🤖 AI ANALYSIS TRIGGERED')
            console.log(`   Analysis Type: ${analysisType}`)
            console.log(`   Trigger: ${trigger}`)
            console.log(`   Timestamp: ${new Date().toISOString()}`)
            
            const mockResponse = {
              success: true,
              analysisId: `ANA-${Date.now()}`,
              type: analysisType,
              status: 'initiated',
              estimatedTime: '15-30 seconds',
              message: '✅ AI Analysis started successfully',
              timestamp: new Date().toISOString()
            }
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(mockResponse))
          })
        } catch (error) {
          console.error('❌ Analysis trigger error:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: error.message }))
        }
      })
    }
  }
})

/**
 * Parse HTML report for financial KPIs
 * Simple regex-based extraction (can be enhanced with Cheerio if needed)
 */
function parseHTMLReport(html, filename) {
  const kpis = {
    projectName: filename.replace('.html', '').replace(/-/g, ' '),
    irr: extractKPI(html, /IRR[:\s]*([0-9.]+)%/i),
    totalInvestment: extractKPI(html, /Total Investment[:\s]*\$?([0-9,.]+)M?/i),
    revenue: extractKPI(html, /Revenue[:\s]*\$?([0-9,.]+)M?/i),
    ebitda: extractKPI(html, /EBITDA[:\s]*\$?([0-9,.]+)M?/i),
    cagr: extractKPI(html, /CAGR[:\s]*([0-9.]+)%/i),
    paybackPeriod: extractKPI(html, /Payback Period[:\s]*([0-9.]+)\s*years?/i),
    npv: extractKPI(html, /NPV[:\s]*\$?([0-9,.]+)M?/i)
  }

  // Add metadata
  kpis.extracted = new Date().toISOString()
  kpis.confidence = calculateConfidence(kpis)

  return kpis
}

/**
 * Extract single KPI using regex
 */
function extractKPI(html, regex) {
  const match = html.match(regex)
  if (match && match[1]) {
    // Clean up number formatting
    const value = match[1].replace(/,/g, '')
    return parseFloat(value) || match[1]
  }
  return null
}

/**
 * Calculate confidence score based on how many KPIs were found
 */
function calculateConfidence(kpis) {
  const totalFields = 7 // Number of KPI fields
  const foundFields = Object.values(kpis).filter(v => v !== null).length
  return Math.round((foundFields / totalFields) * 100)
}
