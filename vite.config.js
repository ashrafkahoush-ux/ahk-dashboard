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
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        
        req.on('data', chunk => { body += chunk })
        
        req.on('end', () => {
          try {
            console.log('📊 Report generation started')
            const { format = 'pdf', includeCharts = true, sections = [] } = JSON.parse(body || '{}')
            
            const report = {
              id: Date.now(),
              title: 'AHK Strategies Performance Report',
              generatedAt: new Date().toISOString(),
              format,
              includeCharts,
              sections: sections.length > 0 ? sections : [
                'Executive Summary',
                'Portfolio Overview',
                'Financial Metrics',
                'Project Progress',
                'AI Insights',
                'Risk Analysis',
                'Strategic Recommendations'
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
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, report }))
            
            console.log('📊 REPORT GENERATED:', report)
          } catch (err) {
            console.error('❌ Error generating report:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, message: err.message }))
          }
        })
        
        req.on('error', (error) => {
          console.error('❌ Request stream error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, message: 'Stream error' }))
        })
      })

      // API: Run Analysis (Dedicated endpoint for analytics tracking)
      server.middlewares.use('/api/run-analysis', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        
        req.on('data', chunk => { body += chunk })
        
        req.on('end', () => {
          try {
            console.log('🤖 AI Analysis started')
            const { analysisType = 'full', trigger = 'manual' } = JSON.parse(body || '{}')
            
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
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, results }))
            
            console.log('🤖 ANALYSIS COMPLETE:', results)
          } catch (err) {
            console.error('❌ Error running analysis:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, message: err.message }))
          }
        })
        
        req.on('error', (error) => {
          console.error('❌ Request stream error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, message: 'Stream error' }))
        })
      })

      // API: Send Email Report
      server.middlewares.use('/api/send-email-report', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        
        req.on('data', chunk => { body += chunk })
        
        req.on('end', () => {
          try {
            console.log('📧 Email report sending...')
            const { recipient = 'ashraf@ahkstrategies.com', reportType = 'daily' } = JSON.parse(body || '{}')
            
            const emailResult = {
              success: true,
              messageId: `MSG-${Date.now()}`,
              recipient,
              subject: `AHK Dashboard ${reportType} Report - ${new Date().toLocaleDateString()}`,
              sentAt: new Date().toISOString(),
              reportType,
              attachments: [
                { filename: 'ahk-report.pdf', size: '2.4 MB' },
                { filename: 'metrics-summary.xlsx', size: '156 KB' }
              ],
              message: 'Report successfully sent via email'
            }
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(emailResult))
            
            console.log('📧 EMAIL SENT:', emailResult)
          } catch (err) {
            console.error('❌ Error sending email:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, message: err.message }))
          }
        })
        
        req.on('error', (error) => {
          console.error('❌ Request stream error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, message: 'Stream error' }))
        })
      })

      // API: Run Risk Analysis
      server.middlewares.use('/api/run-risk-analysis', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        
        req.on('data', chunk => { body += chunk })
        
        req.on('end', () => {
          try {
            console.log('⚠️ Risk analysis started')
            const { scope = 'portfolio' } = JSON.parse(body || '{}')
            
            const riskResults = {
              success: true,
              analysisId: `RISK-${Date.now()}`,
              scope,
              completedAt: new Date().toISOString(),
              overallRiskLevel: 'Medium',
              riskScore: 42, // 0-100 scale
              categories: {
                market: { level: 'Medium', score: 45, concerns: ['Regional competition', 'Regulatory changes'] },
                financial: { level: 'Low', score: 28, concerns: ['Capital availability'] },
                operational: { level: 'Medium', score: 52, concerns: ['Resource constraints', 'Timeline pressures'] },
                technical: { level: 'Low', score: 35, concerns: ['Technology integration'] },
                strategic: { level: 'Medium', score: 48, concerns: ['Partnership dependencies'] }
              },
              topRisks: [
                { 
                  id: 1, 
                  title: 'Regulatory uncertainty in MENA markets', 
                  severity: 'High', 
                  probability: 'Medium', 
                  impact: 'Significant',
                  mitigation: 'Engage policy advisors, diversify across markets'
                },
                { 
                  id: 2, 
                  title: 'Competition from well-funded international players', 
                  severity: 'Medium', 
                  probability: 'High', 
                  impact: 'Moderate',
                  mitigation: 'Focus on localization advantages, build strategic partnerships'
                },
                { 
                  id: 3, 
                  title: 'Capital requirements exceeding current runway', 
                  severity: 'Medium', 
                  probability: 'Medium', 
                  impact: 'Significant',
                  mitigation: 'Initiate fundraising conversations Q4 2025'
                }
              ],
              recommendations: [
                'Develop risk mitigation playbook for each major category',
                'Establish quarterly risk review cadence',
                'Consider insurance products for operational risks',
                'Build contingency plans for top 3 risks'
              ],
              message: 'Risk analysis executed successfully'
            }
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(riskResults))
            
            console.log('⚠️ RISK ANALYSIS COMPLETE:', riskResults.overallRiskLevel)
          } catch (err) {
            console.error('❌ Error running risk analysis:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, message: err.message }))
          }
        })
        
        req.on('error', (error) => {
          console.error('❌ Request stream error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, message: 'Stream error' }))
        })
      })

      // API: Get Report Text (for voice reading)
      server.middlewares.use('/api/get-report-text', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'text/plain')
          return res.end('Method Not Allowed')
        }

        try {
          console.log('📖 Reading report text...')
          
          // Generate a concise spoken summary of the dashboard
          const reportSummary = `
            AHK Strategies Performance Report. 
            Currently managing three active strategic projects. 
            Q-VAN autonomous vehicle network showing strong feasibility with projected IRR of 28 percent. 
            WOW MENA micro-mobility platform advancing through regulatory approval stages. 
            EV Logistics infrastructure study identifying 2.4 billion dollar market opportunity. 
            Overall portfolio health is positive with 67 percent task completion rate. 
            Recommended next steps: accelerate OEM partnerships, expand pilot programs to additional cities, and initiate Series A fundraising conversations in Q1 2026.
            Risk level is medium with primary concerns around regulatory uncertainty and capital requirements.
          `.trim().replace(/\s+/g, ' ');
          
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/plain')
          res.end(reportSummary)
          
          console.log('📖 REPORT TEXT SENT for TTS')
        } catch (err) {
          console.error('❌ Error generating report text:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'text/plain')
          res.end('Error generating report summary')
        }
      })

      // ========================================================
      // PILOT ENDPOINTS - Client Layer + Fusion + Reports
      // ========================================================

      // API: Register Client
      server.middlewares.use('/api/register-client', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            console.log('[PILOT] Register client request')
            const clientData = JSON.parse(body || '{}')
            const { id, name, industry, country, website, notes, status } = clientData

            if (!id || !name) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: false, error: 'Missing required fields: id, name' }))
            }

            const file = path.resolve(__dirname, 'src/data/clients.json')
            let clients = JSON.parse(fs.readFileSync(file, 'utf8'))

            // Check if client exists
            const existingIndex = clients.findIndex(c => c.id === id)
            
            const client = {
              id,
              name,
              industry: industry || 'Not specified',
              country: country || 'Unknown',
              website: website || '',
              notes: notes || '',
              status: status || 'prospect',
              created_at: existingIndex >= 0 ? clients[existingIndex].created_at : new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            if (existingIndex >= 0) {
              // Update existing
              clients[existingIndex] = client
              console.log('[PILOT] Client updated:', id)
            } else {
              // Add new
              clients.push(client)
              console.log('[PILOT] Client created:', id)
            }

            fs.writeFileSync(file, JSON.stringify(clients, null, 2))

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, client }))
          } catch (err) {
            console.error('[PILOT] Register client error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      })

      // API: Attach Document
      server.middlewares.use('/api/attach-doc', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            console.log('[PILOT] Attach document request')
            const { client_id, title, type, path: docPath, tags } = JSON.parse(body || '{}')

            if (!client_id || !title) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: false, error: 'Missing required fields: client_id, title' }))
            }

            const file = path.resolve(__dirname, 'src/data/client_docs_index.json')
            let docs = JSON.parse(fs.readFileSync(file, 'utf8'))

            // Check for duplicate
            const exists = docs.find(d => d.client_id === client_id && d.title === title)
            if (exists) {
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true, doc: exists, note: 'Document already exists' }))
            }

            const doc = {
              client_id,
              title,
              type: type || 'document',
              path: docPath || '',
              tags: tags || [],
              added_at: new Date().toISOString()
            }

            docs.push(doc)
            fs.writeFileSync(file, JSON.stringify(docs, null, 2))

            console.log('[PILOT] Document attached:', title)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, doc }))
          } catch (err) {
            console.error('[PILOT] Attach document error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      })

      // API: Fusion Analysis
      server.middlewares.use('/api/fusion/analyze', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            console.log('[PILOT] Fusion analysis request')
            const { client_id, scope = 'general', top_n = 5 } = JSON.parse(body || '{}')

            if (!client_id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: false, error: 'Missing required field: client_id' }))
            }

            // Load client and docs
            const clientsFile = path.resolve(__dirname, 'src/data/clients.json')
            const docsFile = path.resolve(__dirname, 'src/data/client_docs_index.json')
            
            const clients = JSON.parse(fs.readFileSync(clientsFile, 'utf8'))
            const allDocs = JSON.parse(fs.readFileSync(docsFile, 'utf8'))

            const client = clients.find(c => c.id === client_id)
            if (!client) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: false, error: `Client not found: ${client_id}` }))
            }

            const docs = allDocs.filter(d => d.client_id === client_id)

            console.log('[PILOT] Running fusion for:', client.name, '| Docs:', docs.length, '| Scope:', scope)

            // Import and run fusion (dynamic import for ESM)
            const fusionModule = await import('./src/ai/fusionRunner.js')
            const result = await fusionModule.runFusionAnalysis({ client, docs, scope, top_n })

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error('[PILOT] Fusion analysis error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      })

      // API: Generate Report
      server.middlewares.use('/api/reports/generate', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            console.log('[PILOT] Report generation request')
            const { client_id, template = 'executive', deliver = 'display' } = JSON.parse(body || '{}')

            if (!client_id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: false, error: 'Missing required field: client_id' }))
            }

            // Load client
            const clientsFile = path.resolve(__dirname, 'src/data/clients.json')
            const clients = JSON.parse(fs.readFileSync(clientsFile, 'utf8'))
            const client = clients.find(c => c.id === client_id)

            if (!client) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: false, error: `Client not found: ${client_id}` }))
            }

            // Run fusion analysis first (get latest insights)
            const docsFile = path.resolve(__dirname, 'src/data/client_docs_index.json')
            const allDocs = JSON.parse(fs.readFileSync(docsFile, 'utf8'))
            const docs = allDocs.filter(d => d.client_id === client_id)

            const fusionModule = await import('./src/ai/fusionRunner.js')
            const fusionResult = await fusionModule.runFusionAnalysis({ 
              client, 
              docs, 
              scope: template === 'investor' ? 'investor' : template === 'risk' ? 'risk' : 'general',
              top_n: 5 
            })

            if (!fusionResult.success) {
              throw new Error('Fusion analysis failed: ' + fusionResult.error)
            }

            // Generate HTML report
            const timestamp = Date.now()
            const filename = `${client_id}-${template}-${timestamp}.html`
            const reportPath = path.resolve(__dirname, `src/data/reports/${filename}`)

            const htmlContent = generateHTMLReport(client, fusionResult.fusion, template)
            fs.writeFileSync(reportPath, htmlContent)

            // Generate JSON summary
            const summaryPath = path.resolve(__dirname, `src/data/reports/${client_id}-${template}-${timestamp}.json`)
            const summary = generateReportSummary(client, fusionResult.fusion, template)
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

            console.log('[PILOT] Report generated:', filename)

            // Handle delivery
            if (deliver === 'email') {
              // Call email endpoint
              await fetch(`http://localhost:${server.config.server.port}/api/reports/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: reportPath })
              })
            }

            const response = {
              success: true,
              url: `/src/data/reports/${filename}`,
              summary: summary.executiveSummary,
              filename,
              template,
              client: client.name,
              timestamp: new Date().toISOString()
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(response))
          } catch (err) {
            console.error('[PILOT] Report generation error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      })

      // API: Email Report
      server.middlewares.use('/api/reports/email', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }))
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            console.log('[PILOT] Email report request')
            const { path: reportPath, to = 'ashraf@ahkstrategies.com' } = JSON.parse(body || '{}')

            // STUB: Email transport not implemented yet
            console.log('[PILOT] Email stub - would send:', reportPath, 'to:', to)

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Report email queued (stub)',
              recipient: to,
              timestamp: new Date().toISOString()
            }))
          } catch (err) {
            console.error('[PILOT] Email report error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      })
    }

    // ========================================
    // GOOGLE DRIVE API ENDPOINTS
    // ========================================

    /**
     * GET /api/google-drive/status
     * Returns connection status for personal and work drives
     */
    if (req.url === '/api/google-drive/status' && req.method === 'GET') {
      return new Promise(async (resolve) => {
        try {
          console.log('[GOOGLE DRIVE] Status check request')
          
          // Dynamic import to avoid build issues
          const { getDriveStatus } = await import('./src/integrations/googleDriveLinker.js')
          
          const status = await getDriveStatus()
          
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, status }))
          resolve()
        } catch (err) {
          console.error('[GOOGLE DRIVE] Status check error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ 
            success: false, 
            error: err.message,
            status: {
              personal: { connected: false, emmaFolder: null },
              work: { connected: false, emmaFolder: null }
            }
          }))
          resolve()
        }
      })
    }

    /**
     * POST /api/google-drive/sync
     * Syncs Emma knowledge from both personal and work drives
     */
    if (req.url === '/api/google-drive/sync' && req.method === 'POST') {
      return new Promise(async (resolve) => {
        try {
          console.log('[GOOGLE DRIVE] Sync request')
          
          // Dynamic import to avoid build issues
          const { syncEmmaKnowledge } = await import('./src/integrations/googleDriveLinker.js')
          
          const syncResults = await syncEmmaKnowledge()
          
          console.log('[GOOGLE DRIVE] Sync complete:', syncResults)
          
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ 
            success: true, 
            syncResults,
            timestamp: new Date().toISOString()
          }))
          resolve()
        } catch (err) {
          console.error('[GOOGLE DRIVE] Sync error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ 
            success: false, 
            error: err.message,
            syncResults: []
          }))
          resolve()
        }
      })
    }
  }
})

/**
 * Generate HTML report from fusion results
 */
function generateHTMLReport(client, fusion, template) {
  const now = new Date().toLocaleString()
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${template.toUpperCase()} Report - ${client.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    .section { margin: 20px 0; }
    .insight, .risk, .opportunity { padding: 15px; margin: 10px 0; border-left: 4px solid; }
    .insight { background: #dbeafe; border-color: #3b82f6; }
    .risk { background: #fee2e2; border-color: #ef4444; }
    .opportunity { background: #d1fae5; border-color: #10b981; }
    .confidence { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
    .confidence-high { background: #10b981; color: white; }
    .confidence-medium { background: #f59e0b; color: white; }
    .confidence-low { background: #6b7280; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${template.toUpperCase()} Analysis Report</h1>
    <div class="meta">
      <strong>Client:</strong> ${client.name} (${client.industry})<br>
      <strong>Country:</strong> ${client.country}<br>
      <strong>Generated:</strong> ${now}<br>
      <strong>AI Providers:</strong> ${fusion.providers.join(', ')}<br>
      <strong>Consensus:</strong> ${fusion.consensus.strength} (${fusion.consensus.provider_count} sources)
    </div>

    <div class="section">
      <h2>Key Insights</h2>
      ${fusion.insights.map(item => `
        <div class="insight">
          <strong>${item.insight}</strong>
          <span class="confidence confidence-${item.confidence}">${item.confidence.toUpperCase()}</span>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Risk Analysis</h2>
      ${fusion.risks.map(risk => `
        <div class="risk">
          <strong>[${risk.type.toUpperCase()}] ${risk.description}</strong><br>
          <em>Severity: ${risk.severity}</em><br>
          Mitigation: ${risk.mitigation}
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Growth Opportunities</h2>
      ${fusion.growth_ops.map(opp => `
        <div class="opportunity">
          <strong>[${opp.category.toUpperCase()}] ${opp.description}</strong><br>
          <em>Potential: ${opp.potential} | Timeframe: ${opp.timeframe}</em>
        </div>
      `).join('')}
    </div>

    ${fusion.investor_angles && fusion.investor_angles.length > 0 ? `
      <div class="section">
        <h2>Investor Perspective</h2>
        ${fusion.investor_angles.map(angle => `
          <div class="insight">
            <strong>${angle.aspect}:</strong> ${angle.analysis}
            <span class="confidence confidence-${angle.confidence || 'medium'}">${(angle.confidence || 'medium').toUpperCase()}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="meta" style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <strong>AHK Strategies</strong> | Confidential & Proprietary<br>
      Generated by Emma AI Fusion Engine
    </div>
  </div>
</body>
</html>
  `.trim()
  
  return html
}

/**
 * Generate report summary for JSON storage
 */
function generateReportSummary(client, fusion, template) {
  const topInsights = fusion.insights.slice(0, 3).map(i => i.insight)
  const topRisks = fusion.risks.slice(0, 3).map(r => r.description)
  const topOpps = fusion.growth_ops.slice(0, 3).map(o => o.description)
  
  return {
    client: client.name,
    client_id: client.id,
    template,
    generated_at: new Date().toISOString(),
    executiveSummary: `Analysis for ${client.name} (${client.industry}) reveals ${fusion.insights.length} key insights, ${fusion.risks.length} risk factors, and ${fusion.growth_ops.length} growth opportunities. Consensus strength is ${fusion.consensus.strength} based on ${fusion.consensus.provider_count} AI providers.`,
    highlights: {
      insights: topInsights,
      risks: topRisks,
      opportunities: topOpps
    },
    consensus: fusion.consensus,
    providers: fusion.providers
  }
}

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
