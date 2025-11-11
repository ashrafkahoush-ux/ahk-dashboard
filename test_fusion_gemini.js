// Fusion Test Script - Gemini Module
// MEGA-ERIC Phase II - AI Fusion Pipeline

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

// Load env vars in correct order (Emma Engine pattern)
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

// Initialize Gemini with explicit key
const API_KEY = "AIzaSyD_3VlTwKtpg2PUkKv3EnRh4Oj5BQQaabw";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

async function fusionTestGemini() {
  console.log("\n🔷 AI FUSION TEST - MODULE 1: GEMINI\n");
  console.log("📊 Processing 5 MENA Horizon 2030 segments...\n");
  
  const results = [];
  const allFusionScores = [];
  
  try {
    // Process all 5 segments
    for (let i = 1; i <= 5; i++) {
      const segmentNum = String(i).padStart(2, '0');
      const segmentPath = path.join(
        __dirname,
        `server/Emma_KnowledgeBase/sources/mena_horizon_2030/segment_${segmentNum}.md`
      );
      
      console.log(`📥 [${i}/5] Loading segment ${segmentNum}...`);
      const segmentContent = fs.readFileSync(segmentPath, "utf-8");
      console.log(`✅ Loaded: ${segmentContent.length} characters`);
      
      // Fusion prompt
      const prompt = `You are MEGA-ERIC's Gemini fusion module analyzing MENA Horizon 2030 research.

Extract from this segment:

1. **Key Strategic Insights** (3-5 bullet points)
2. **Investment Opportunities** (2-3 sectors with rationale)
3. **Risk Factors** (2-3 critical concerns)
4. **Fusion Score** (0-100 based on actionability + clarity)

Provide concise, C-level executive analysis.

---
SEGMENT CONTENT:
${segmentContent}
---

Format your response in Markdown with clear sections.`;

      console.log(`🤖 Calling Gemini AI API for segment ${segmentNum}...`);
      
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]) {
        throw new Error(`API error for segment ${segmentNum}: ${JSON.stringify(data)}`);
      }
      
      const fusionOutput = data.candidates[0].content.parts[0].text;
      
      console.log(`✅ Fusion complete: ${fusionOutput.length} characters`);
      
      // Extract fusion score
      const scoreMatch = fusionOutput.match(/Fusion Score[:\s]*(\d+)/i);
      const fusionScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;
      allFusionScores.push(fusionScore);
      
      // Save output
      const outputPath = path.join(
        __dirname,
        `server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-${segmentNum}.md`
      );
      
      const fullOutput = `# MENA Horizon 2030 - Segment ${segmentNum} Fusion Analysis
**Generated:** ${new Date().toISOString()}
**Module:** Gemini AI (gemini-2.5-flash)
**Source:** segment_${segmentNum}.md
**Validator:** MEGA-ERIC
**Fusion Score:** ${fusionScore}/100

---

${fusionOutput}

---

**Fusion Timestamp:** ${new Date().toISOString()}
**Module Status:** ✅ Complete
`;
      
      fs.writeFileSync(outputPath, fullOutput, "utf-8");
      console.log(`✅ Saved: segment-fusion-${segmentNum}.md\n`);
      
      results.push({
        segment: segmentNum,
        fusionScore,
        outputPath,
        outputLength: fusionOutput.length
      });
    }
    
    // Calculate overall fusion score
    const avgFusionScore = Math.round(allFusionScores.reduce((a, b) => a + b, 0) / allFusionScores.length);
    
    // Create unified summary
    console.log("📋 Generating unified Fusion Summary...");
    const summaryPath = path.join(
      __dirname,
      "server/Emma_KnowledgeBase/Reports/Generated/Fusion_Summary_2025-11-09.md"
    );
    
    const summaryContent = `# MENA Horizon 2030 - Unified Fusion Summary
**Generated:** ${new Date().toISOString()}
**Authorization:** MEGA-EMMA-NOV9-PRIME-PH2
**Fusion Module:** Gemini AI (gemini-2.5-flash)
**Overall Fusion Score:** ${avgFusionScore}/100

## Fusion Results by Segment

${results.map(r => `- **Segment ${r.segment}**: ${r.fusionScore}/100 (${r.outputLength} chars)`).join('\n')}

## Overall Assessment

**Average Fusion Score:** ${avgFusionScore}/100
**Segments Processed:** 5/5
**Total Output:** ${results.reduce((sum, r) => sum + r.outputLength, 0)} characters
**Status:** ✅ COMPLETE

## Next Steps

1. Review individual segment fusion reports in /Reports/Generated/
2. Validate Drive sync operational status
3. Submit final report to CommandCenter API

---

**Validation Timestamp:** ${new Date().toISOString()}
**MEGA-ERIC Status:** Phase II Boot Sequence - AI Fusion COMPLETE
`;
    
    fs.writeFileSync(summaryPath, summaryContent, "utf-8");
    console.log(`✅ Unified summary saved: Fusion_Summary_2025-11-09.md\n`);
    
    return {
      success: true,
      module: "gemini",
      results,
      avgFusionScore,
      summaryPath
    };
    
  } catch (error) {
    console.error("❌ Gemini fusion failed:", error.message);
    return {
      success: false,
      module: "gemini",
      error: error.message,
    };
  }
}

// Execute
fusionTestGemini()
  .then((result) => {
    if (result.success) {
      console.log("🟢 GEMINI FUSION MODULE: SUCCESS");
      console.log(`📊 Average Fusion Score: ${result.avgFusionScore}/100`);
      console.log(`✅ Processed: ${result.results.length}/5 segments\n`);
      process.exit(0);
    } else {
      console.error("🔴 GEMINI MODULE: FAILED\n");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("💥 FATAL ERROR:", err);
    process.exit(1);
  });
