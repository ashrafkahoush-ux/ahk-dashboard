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
      server.middlewares.use('/api/generate-report', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }

        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          try {
            const { format = 'pdf', includeCharts = true, sections = [] } = JSON.parse(body || '{}')
            
            // Generate comprehensive report structure
            const report = {
              id: Date.now(),
              title: "AHK Strategies Performance Report",
              generatedAt: new Date().toISOString(),
              format,
              includeCharts,
              sections: sections.length > 0 ? sections : [
                "Executive Summary",
                "Portfolio Overview",
                "Financial Metrics",
                "Project Progress",
                "AI Insights",
                "Risk Analysis",
                "Strategic Recommendations"
              ],
              metadata: {
                reportType: 'strategic-dashboard',
                version: '1.0',
                pageCount: 24,
                author: 'AHK Dashboard AI',
                confidentiality: 'Internal Use Only'
              },
              summary: {
                totalProjects: 3,
                activeProjects: 3,
                completionRate: '67%',
                totalBudget: '$2.8M',
                projectedROI: '245%',
                riskLevel: 'Medium'
              },
              downloadUrl: `/api/download-report/${Date.now()}`,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            }
            
            console.log('📊 REPORT GENERATED')
            console.log(`   ID: ${report.id}`)
            console.log(`   Title: ${report.title}`)
            console.log(`   Format: ${report.format}`)
            console.log(`   Sections: ${report.sections.length}`)
            console.log(`   Generated: ${report.generatedAt}`)
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, report }))
          } catch (error) {
            console.error('❌ Report Generation Failed:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, message: error.message }))
          }
        })
        
        req.on('error', (error) => {
          console.error('❌ Request Error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, message: error.message }))
        })
      })

      // API: Run Analysis (Dedicated endpoint for analytics tracking)
      server.middlewares.use('/api/run-analysis', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }

        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          try {
            const { analysisType = 'full', trigger = 'manual' } = JSON.parse(body || '{}')
            
            console.log('🤖 AI ANALYSIS TRIGGERED')
            console.log(`   Analysis Type: ${analysisType}`)
            console.log(`   Trigger: ${trigger}`)
            console.log(`   Timestamp: ${new Date().toISOString()}`)
            
            // Simulate AI analysis with structured results
            const results = {
              id: `ANA-${Date.now()}`,
              type: analysisType,
              trigger,
              status: 'completed',
              summary: 'Strategic portfolio analysis complete. 3 active projects with 67% task completion rate. Strong momentum in Q-VAN and WOW MENA initiatives. Recommended: accelerate EV-Logistics partnerships.',
              insights: [
                {
                  category: 'Portfolio Health',
                  status: 'positive',
                  message: 'All 3 projects on track with strong execution velocity',
                  confidence: 92
                },
                {
                  category: 'Resource Allocation',
                  status: 'attention',
                  message: 'Q-VAN requires additional technical resources in Q1 2026',
                  confidence: 85
                },
                {
                  category: 'Market Timing',
                  status: 'positive',
                  message: 'MENA mobility sector momentum aligns with project roadmaps',
                  confidence: 88
                }
              ],
              recommendations: [
                'Accelerate Q-VAN partnership discussions with OEMs',
                'Expand WOW MENA pilot scope to 2-3 additional cities',
                'Consider pre-seed fundraising ($3-5M) to maintain velocity',
                'Establish advisory board with regional logistics executives'
              ],
              metrics: {
                projectsAnalyzed: 3,
                tasksReviewed: 45,
                risksIdentified: 2,
                opportunitiesFound: 7,
                dataPoints: 127
              },
              nextActions: [
                { priority: 'high', action: 'Schedule Q-VAN partnership calls', deadline: '2025-11-15' },
                { priority: 'medium', action: 'Draft WOW MENA expansion proposal', deadline: '2025-11-30' },
                { priority: 'medium', action: 'Prepare investor deck', deadline: '2025-12-15' }
              ],
              confidence: 89,
              completedAt: new Date().toISOString(),
              estimatedTime: '15-30 seconds'
            }
            
            console.log('🤖 ANALYSIS COMPLETE')
            console.log(`   ID: ${results.id}`)
            console.log(`   Insights: ${results.insights.length}`)
            console.log(`   Recommendations: ${results.recommendations.length}`)
            console.log(`   Confidence: ${results.confidence}%`)
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, results }))
          } catch (error) {
            console.error('❌ Analysis Failed:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, message: error.message }))
          }
        })
        
        req.on('error', (error) => {
          console.error('❌ Request Error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, message: error.message }))
        })
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
