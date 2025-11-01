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
      // API: Save roadmap task
      server.middlewares.use('/api/save-roadmap', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        try {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const { task } = JSON.parse(body || '{}')
            if (!task || !task.id) {
              res.statusCode = 400
              return res.end('Bad task')
            }
            const file = path.resolve(__dirname, 'src/data/roadmap.json')
            const json = JSON.parse(fs.readFileSync(file, 'utf8'))
            // prevent duplicate ids
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
