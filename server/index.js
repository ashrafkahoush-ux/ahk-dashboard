// server/index.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables FIRST before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Now import modules that depend on environment variables
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import voiceRouter from "./voice/router.js";
// Import Google Drive OAuth methods
import { getAuthURL, handleCallback, syncDrives, getDriveStatus } from "../src/integrations/googleDriveLinker.js";
// Import Google Drive backup for reports
import { uploadReportToDrive, listOutputs } from "./googleDrive.js";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "15mb" }));

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Mount voice API
app.use("/api/voice", voiceRouter);

// Parse HTML reports endpoint - extracts KPIs from HTML reports
app.get("/api/parse-html-reports", async (req, res) => {
  try {
    // Mock KPI data - in production, this would parse actual HTML reports
    const reports = [
      {
        title: "Q4 2025 Performance Report",
        kpis: {
          revenue: "$580K",
          projects: 3,
          completion: "12/100",
          roi: "380%"
        },
        timestamp: new Date().toISOString()
      }
    ];
    res.json({ success: true, reports });
  } catch (error) {
    console.error("Parse HTML Reports Error:", error);
    res.status(500).json({ error: "Failed to parse HTML reports" });
  }
});

// Generate report endpoint - creates strategic reports
app.post("/api/generate-report", async (req, res) => {
  try {
    const { format = 'pdf', includeCharts = true, sections = [] } = req.body;
    
    // Load MENA Horizon 2030 intelligence source
    let menaInsights = '';
    try {
      const menaPath = path.join(__dirname, '../public/reports/sources/mena_horizon_2030.md');
      if (fs.existsSync(menaPath)) {
        menaInsights = fs.readFileSync(menaPath, 'utf-8');
        console.log('📊 MENA Horizon 2030 intelligence loaded');
      }
    } catch (err) {
      console.warn('⚠️ Could not load MENA 2030 source:', err.message);
    }
    
    // Build sections array
    const reportSections = sections.length > 0 ? sections : [
      'Executive Summary',
      'Portfolio Overview',
      'Financial Metrics',
      'Project Progress',
      'AI Insights',
      'Strategic Recommendations'
    ];
    
    // Add MENA 2030 if AI Insights is included and source is available
    if (reportSections.includes('AI Insights') && menaInsights) {
      reportSections.push('MENA Horizon 2030 Strategic Insights');
    }
    
    // Generate mock report - in production, this would create actual reports
    const report = {
      title: "AHK Strategic Performance Report",
      format: format.toUpperCase(),
      generatedAt: new Date().toISOString(),
      sections: reportSections,
      menaHorizon2030: menaInsights ? {
        included: true,
        wordCount: menaInsights.split(/\s+/).length,
        preview: menaInsights.substring(0, 200) + '...'
      } : { included: false },
      summary: {
        totalProjects: 3,
        activeProjects: 3,
        completionRate: "12%",
        totalBudget: "$580K",
        projectedROI: "380%"
      },
      charts: includeCharts,
      metadata: {
        generated: new Date().toISOString(),
        version: "1.0",
        confidentiality: "Internal Use Only"
      }
    };
    
    console.log('📊 Report generated:', report.title);
    res.json({ success: true, report });
  } catch (error) {
    console.error("Generate Report Error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Save report endpoint - saves generated reports to Emma KnowledgeBase
app.post("/api/save-report", async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    
    // Sanitize filename
    const sanitizedTitle = title
      .replace(/[^a-z0-9\s-]/gi, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${sanitizedTitle}.md`;
    
    const reportsDir = path.join(__dirname, '../Emma_KnowledgeBase/Reports/Generated');
    const filePath = path.join(reportsDir, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // 1) Local save first (primary operation)
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log('💾 Report saved:', filename);
    
    // 2) Fire-and-forget Drive upload (non-blocking)
    (async () => {
      try {
        const meta = await uploadReportToDrive(filePath);
        console.log(`☁️  Uploaded to Drive: ${meta.name} (${meta.id})`);
      } catch (e) {
        console.warn('⚠️ Drive upload failed (report saved locally):', e.message);
      }
    })();
    
    res.json({ 
      success: true, 
      filePath: filePath,
      filename: filename
    });
  } catch (error) {
    console.error("Save Report Error:", error);
    res.status(500).json({ error: "Failed to save report" });
  }
});

// List reports endpoint - retrieves all saved reports
app.get("/api/list-reports", async (req, res) => {
  try {
    console.log('📋 /api/list-reports called');
    const reportsDir = path.join(__dirname, '../Emma_KnowledgeBase/Reports/Generated');
    console.log('📂 Reports directory:', reportsDir);
    
    // Ensure directory exists
    if (!fs.existsSync(reportsDir)) {
      console.log('⚠️ Directory does not exist, creating...');
      fs.mkdirSync(reportsDir, { recursive: true });
      return res.json({ success: true, reports: [] });
    }
    
    // Read all .md files
    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract title from content (first # heading) or use filename
        let title = file.replace('.md', '');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          title = titleMatch[1];
        }
        
        return {
          filename: file,
          title: title,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt); // Sort by newest first
    
    console.log(`✅ Found ${files.length} reports:`, files.map(f => f.filename));
    res.json({ success: true, reports: files });
  } catch (error) {
    console.error("❌ List Reports Error:", error);
    res.status(500).json({ error: "Failed to list reports" });
  }
});

// Get report content endpoint - retrieves specific report
app.get("/api/get-report/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Sanitize filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    
    const reportsDir = path.join(__dirname, '../Emma_KnowledgeBase/Reports/Generated');
    const filePath = path.join(reportsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, content });
  } catch (error) {
    console.error("Get Report Error:", error);
    res.status(500).json({ error: "Failed to get report" });
  }
});

// NEW: Diagnostic endpoint - List Drive Outputs
app.get("/api/google-drive/outputs", async (req, res) => {
  try {
    const files = await listOutputs(25);
    res.status(200).json({ ok: true, files });
  } catch (err) {
    console.error('❌ Drive outputs error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Google Drive endpoints - restore Emma Learning page functionality
app.get("/api/google-drive/status", async (req, res) => {
  try {
    const status = await getDriveStatus();
    res.json(status);
  } catch (err) {
    console.error("Drive Status Error:", err);
    res.status(500).json({ error: "Failed to get drive status" });
  }
});

app.get("/api/google/auth", async (req, res) => {
  try {
    const url = await getAuthURL();
    res.json({ url });
  } catch (err) {
    console.error("Auth URL Error:", err);
    res.status(500).json({ error: "Auth URL Failed" });
  }
});

app.get("/api/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: "No authorization code provided" });
    }
    const result = await handleCallback(code);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).json({ error: "Callback Failed" });
  }
});

app.post("/api/google-drive/sync", async (req, res) => {
  try {
    const result = await syncDrives();
    res.json(result);
  } catch (err) {
    console.error("Drive Sync Error:", err);
    res.status(500).json({ error: "Drive Sync Failed" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Emma Backend Server running on http://localhost:${PORT}`);
});
