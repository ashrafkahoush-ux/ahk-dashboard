var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/api/geminiClient.js
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchGeminiAnalysis(context, options = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("\u26A0\uFE0F Gemini API key not configured. Using mock analysis.");
    return generateMockAnalysis(context);
  }
  const {
    timeout = REQUEST_TIMEOUT,
    retries = MAX_RETRIES,
    temperature = 0.7,
    maxOutputTokens = 2048
  } = options;
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\u{1F916} Gemini API call (attempt ${attempt}/${retries})...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const prompt = buildGeminiPrompt(context);
      const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            topP: 0.95,
            topK: 40
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("\u274C Gemini API Error:", errorText);
        if (response.status === 403) {
          throw new Error("API Error 403: The Generative Language API is not enabled for your project. Enable it at: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
        } else if (response.status === 401) {
          throw new Error("API Error 401: Invalid API key. Check VITE_GEMINI_API_KEY in .env");
        } else {
          throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
        }
      }
      const data = await response.json();
      console.log("\u2705 Gemini API response received");
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error("No text content in Gemini response");
      }
      const analysis = parseGeminiResponse(generatedText);
      localStorage.setItem("lastGeminiResponse", JSON.stringify({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        analysis,
        raw: generatedText
      }));
      return analysis;
    } catch (error) {
      lastError = error;
      if (error.name === "AbortError") {
        console.error(`\u23F1\uFE0F Gemini API timeout (attempt ${attempt})`);
      } else {
        console.error(`\u274C Gemini API error (attempt ${attempt}):`, error.message);
      }
      if (error.message.includes("401") || error.message.includes("403")) {
        console.error("\u{1F511} Authentication failed. Check VITE_GEMINI_API_KEY");
        break;
      }
      if (attempt < retries) {
        console.log(`\u23F3 Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  console.warn("\u26A0\uFE0F Gemini API failed after retries. Using mock analysis.", lastError);
  return generateMockAnalysis(context);
}
function buildGeminiPrompt(context) {
  const { structured, text } = context;
  return `You are an expert strategic advisor and investor analyst for AHK Strategies, a MENA-focused mobility and logistics consultancy.

**CONTEXT:**
${text}

**STRUCTURED DATA:**
${JSON.stringify(structured, null, 2)}

**YOUR TASK:**
Analyze the provided context and generate a comprehensive strategic report in the following JSON format:

{
  "investorBrief": "2-3 sentence executive summary highlighting portfolio health, momentum, and key metrics",
  "nextActions": [
    "Specific action 1 with timeline",
    "Specific action 2 with timeline", 
    "Specific action 3 with timeline"
  ],
  "riskMap": {
    "high": ["Critical risk 1", "Critical risk 2"],
    "medium": ["Important concern 1", "Important concern 2"],
    "low": ["Minor item 1"]
  },
  "investorInsights": [
    "Key investor insight 1 with data",
    "Key investor insight 2 with data",
    "Key investor insight 3 with data"
  ],
  "recommendations": [
    "Strategic recommendation 1",
    "Strategic recommendation 2"
  ]
}

**GUIDELINES:**
- Focus on actionable insights, not generic advice
- Use specific numbers and dates from the context
- Prioritize investor-readiness and growth momentum
- Identify blockers and provide mitigation strategies
- Be concise and executive-friendly

Return ONLY valid JSON, no additional text.`;
}
function parseGeminiResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.investorBrief && parsed.nextActions && parsed.riskMap) {
        parsed.summary = parsed.investorBrief;
        parsed.fullText = formatFullReport(parsed);
        return parsed;
      }
    }
    console.warn("\u26A0\uFE0F Gemini returned unstructured response, attempting extraction...");
    return extractStructuredData(text);
  } catch (error) {
    console.error("\u274C Failed to parse Gemini response:", error);
    throw new Error("Invalid Gemini response format");
  }
}
function formatFullReport(analysis) {
  const { investorBrief, nextActions, riskMap, investorInsights, recommendations } = analysis;
  let report = `Executive Summary: ${investorBrief}

`;
  if (nextActions && nextActions.length > 0) {
    report += `Next Actions:
`;
    nextActions.forEach((action, i) => {
      report += `${i + 1}. ${action}
`;
    });
    report += `
`;
  }
  if (riskMap) {
    if (riskMap.high && riskMap.high.length > 0) {
      report += `High Priority Risks:
`;
      riskMap.high.forEach((risk, i) => {
        report += `${i + 1}. ${risk}
`;
      });
      report += `
`;
    }
    if (riskMap.medium && riskMap.medium.length > 0) {
      report += `Medium Priority Items:
`;
      riskMap.medium.forEach((item, i) => {
        report += `${i + 1}. ${item}
`;
      });
      report += `
`;
    }
  }
  if (investorInsights && investorInsights.length > 0) {
    report += `Investor Insights:
`;
    investorInsights.forEach((insight, i) => {
      report += `${i + 1}. ${insight}
`;
    });
    report += `
`;
  }
  if (recommendations && recommendations.length > 0) {
    report += `Strategic Recommendations:
`;
    recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}
`;
    });
  }
  return report.trim();
}
function extractStructuredData(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  const analysis = {
    investorBrief: lines[0] || "Analysis completed. See details below.",
    nextActions: lines.slice(1, 4).map((l) => l.replace(/^[-*•]\s*/, "").trim()),
    riskMap: {
      high: [],
      medium: [],
      low: ["Review generated report for detailed analysis"]
    },
    investorInsights: lines.slice(4, 7).map((l) => l.replace(/^[-*•]\s*/, "").trim()),
    recommendations: lines.slice(7, 9).map((l) => l.replace(/^[-*•]\s*/, "").trim())
  };
  analysis.summary = analysis.investorBrief;
  analysis.fullText = formatFullReport(analysis);
  return analysis;
}
function generateMockAnalysis(context) {
  const { structured } = context;
  const { data } = structured;
  const overdueTasks = data.roadmap?.filter(
    (t) => t.status !== "done" && t.due && new Date(t.due) < /* @__PURE__ */ new Date()
  ) || [];
  const avgProgress = data.metrics?.avgProgress || 0;
  const activeProjects = data.projects?.length || 0;
  const analysis = {
    investorBrief: `Portfolio health: ${activeProjects} active projects with ${avgProgress}% average progress. ${overdueTasks.length} tasks overdue. Strong momentum in localization and logistics tracks.`,
    nextActions: [
      data.roadmap?.find((t) => t.status === "in-progress")?.title || "Review project priorities and update roadmap",
      overdueTasks.length > 0 ? `Address ${overdueTasks.length} overdue tasks to maintain schedule` : "Continue execution on current milestones",
      "Prepare investor deck with Q4 2024 metrics and Q1 2025 projections"
    ],
    riskMap: {
      high: overdueTasks.length > 2 ? [`${overdueTasks.length} overdue tasks requiring immediate attention`] : [],
      medium: data.projects?.filter((p) => p.progress < 30).map((p) => `${p.name} lagging at ${p.progress}% completion`) || [],
      low: ["Routine documentation and process updates pending"]
    },
    investorInsights: [
      `${activeProjects} strategic projects in pipeline with combined TAM of $2.5B+ in MENA mobility sector`,
      `Average project progress of ${avgProgress}% indicates strong execution velocity`,
      "Q-VAN localization hub and WOW e-scooter expansion showing highest ROI potential"
    ],
    recommendations: [
      "Accelerate Q-VAN Phase 1 completion to capture Q1 2025 market window",
      "Leverage completed feasibility studies to approach Series A investors"
    ]
  };
  analysis.summary = analysis.investorBrief;
  analysis.fullText = formatFullReport(analysis);
  return analysis;
}
var GEMINI_API_ENDPOINT, REQUEST_TIMEOUT, MAX_RETRIES, RETRY_DELAY;
var init_geminiClient = __esm({
  "src/api/geminiClient.js"() {
    GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
    REQUEST_TIMEOUT = 3e4;
    MAX_RETRIES = 3;
    RETRY_DELAY = 2e3;
  }
});

// src/ai/fusionRunner.js
var fusionRunner_exports = {};
__export(fusionRunner_exports, {
  runFusionAnalysis: () => runFusionAnalysis
});
async function runFusionAnalysis({ client, docs, scope = "general", top_n = 5 }) {
  console.log("[PILOT] Running Fusion Analysis:", { client: client.name, scope, docCount: docs.length });
  try {
    const context = buildContext(client, docs);
    const prompts = generatePrompts(client, context, scope);
    const [geminiResult, grokResult, chatgptResult] = await Promise.allSettled([
      callGemini(prompts),
      callGrok(prompts),
      callChatGPT(prompts)
    ]);
    const responses = {
      gemini: geminiResult.status === "fulfilled" ? geminiResult.value : null,
      grok: grokResult.status === "fulfilled" ? grokResult.value : null,
      chatgpt: chatgptResult.status === "fulfilled" ? chatgptResult.value : null
    };
    const fusion = fuseResponses(responses, scope, top_n);
    console.log("[PILOT] Fusion complete:", {
      insights: fusion.insights.length,
      risks: fusion.risks.length,
      opportunities: fusion.growth_ops.length
    });
    return {
      success: true,
      fusion,
      meta: {
        client_id: client.id,
        client_name: client.name,
        scope,
        providers: Object.keys(responses).filter((k) => responses[k] !== null),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  } catch (error) {
    console.error("[PILOT] Fusion analysis failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
function buildContext(client, docs) {
  const context = {
    client: {
      name: client.name,
      industry: client.industry,
      country: client.country,
      website: client.website,
      status: client.status
    },
    documents: docs.map((doc) => ({
      title: doc.title,
      type: doc.type,
      tags: doc.tags,
      path: doc.path
    })),
    docSummary: docs.map((d) => `${d.title} (${d.tags.join(", ")})`).join("\n")
  };
  return context;
}
function generatePrompts(client, context, scope) {
  const basePrompt = `
Client: ${client.name}
Industry: ${client.industry}
Country: ${client.country}
Status: ${client.status}

Available Documents:
${context.docSummary}

`;
  const scopePrompts = {
    general: `${basePrompt}
Provide a comprehensive strategic analysis covering:
1. Market positioning and competitive landscape
2. Key business opportunities (top 5)
3. Major risks and challenges (top 5)
4. Strategic recommendations

Format as JSON with keys: insights[], risks[], opportunities[], recommendations[]`,
    risk: `${basePrompt}
Focus on risk analysis:
1. Operational risks specific to ${client.industry}
2. Market risks in ${client.country}
3. Financial and regulatory risks
4. Mitigation strategies

Format as JSON with keys: risks[] (each with: type, severity, impact, mitigation)`,
    growth: `${basePrompt}
Focus on growth opportunities:
1. Market expansion possibilities
2. Product/service innovation areas
3. Partnership and collaboration opportunities
4. Emerging trends to leverage

Format as JSON with keys: growth_ops[] (each with: category, potential, timeframe, investment)`,
    investor: `${basePrompt}
Create an investor-ready analysis:
1. Investment thesis and value proposition
2. Market size and growth trajectory
3. Competitive advantages
4. Financial outlook and ROI potential
5. Risk factors

Format as JSON with keys: investor_angles[] (each with: aspect, analysis, confidence)`
  };
  return scopePrompts[scope] || scopePrompts.general;
}
async function callGemini(prompt) {
  try {
    const response = await fetchGeminiAnalysis(prompt, {
      temperature: 0.7,
      format: "json"
    });
    return parseAIResponse(response, "gemini");
  } catch (error) {
    console.warn("[PILOT] Gemini call failed:", error.message);
    return null;
  }
}
async function callGrok(prompt) {
  console.log("[PILOT] Grok call (mocked)");
  return {
    insights: [
      "Strong regional market presence in North Africa",
      "Well-positioned for emerging market growth",
      "Established distribution network advantage"
    ],
    risks: [
      { type: "market", severity: "medium", description: "Currency volatility in regional markets" },
      { type: "operational", severity: "low", description: "Supply chain dependencies" }
    ],
    opportunities: [
      { category: "expansion", potential: "high", description: "Sub-Saharan Africa market entry" },
      { category: "digital", potential: "medium", description: "E-commerce channel development" }
    ]
  };
}
async function callChatGPT(prompt) {
  console.log("[PILOT] ChatGPT call (mocked)");
  return {
    insights: [
      "Industry leader with strong brand recognition",
      "Diversified product portfolio reduces risk",
      "Strategic partnerships with key distributors"
    ],
    risks: [
      { type: "regulatory", severity: "medium", description: "Changing import/export regulations" },
      { type: "competitive", severity: "high", description: "Increasing competition from Asian imports" }
    ],
    opportunities: [
      { category: "innovation", potential: "high", description: "Sustainable materials adoption" },
      { category: "partnership", potential: "high", description: "Strategic alliances with construction firms" }
    ]
  };
}
function parseAIResponse(response, provider) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    const lines = response.split("\n").filter((l) => l.trim());
    return {
      insights: lines.slice(0, 5).map((l) => l.replace(/^[-*•]\s*/, "").trim()),
      risks: [],
      opportunities: []
    };
  } catch (error) {
    console.warn(`[PILOT] Failed to parse ${provider} response:`, error);
    return {
      insights: ["Analysis completed - see raw output in console"],
      risks: [],
      opportunities: []
    };
  }
}
function fuseResponses(responses, scope, top_n) {
  const fusion = {
    insights: [],
    risks: [],
    growth_ops: [],
    investor_angles: [],
    consensus: {},
    providers: []
  };
  const validResponses = Object.entries(responses).filter(([_, resp]) => resp !== null).map(([provider, resp]) => ({ provider, data: resp }));
  fusion.providers = validResponses.map((r) => r.provider);
  if (validResponses.length === 0) {
    return fusion;
  }
  const allInsights = validResponses.flatMap(
    (r) => (r.data.insights || []).map((insight) => ({
      text: insight,
      provider: r.provider,
      confidence: calculateConfidence(insight, validResponses)
    }))
  );
  fusion.insights = deduplicateAndRank(allInsights, top_n).map((item) => ({
    insight: item.text,
    confidence: item.confidence,
    sources: [item.provider]
  }));
  const allRisks = validResponses.flatMap(
    (r) => (r.data.risks || []).map((risk) => ({
      ...risk,
      provider: r.provider
    }))
  );
  fusion.risks = allRisks.slice(0, top_n).map((r) => ({
    type: r.type || "general",
    severity: r.severity || "medium",
    description: r.description || r.text || "Risk identified",
    mitigation: r.mitigation || "Assessment pending",
    source: r.provider
  }));
  const allOpps = validResponses.flatMap(
    (r) => (r.data.opportunities || r.data.growth_ops || []).map((opp) => ({
      ...opp,
      provider: r.provider
    }))
  );
  fusion.growth_ops = allOpps.slice(0, top_n).map((o) => ({
    category: o.category || "general",
    potential: o.potential || "medium",
    description: o.description || o.text || "Opportunity identified",
    timeframe: o.timeframe || "12-24 months",
    investment: o.investment || "TBD",
    source: o.provider
  }));
  if (scope === "investor") {
    const allAngles = validResponses.flatMap(
      (r) => (r.data.investor_angles || []).map((angle) => ({
        ...angle,
        provider: r.provider
      }))
    );
    fusion.investor_angles = allAngles.slice(0, top_n);
  }
  fusion.consensus = {
    strength: validResponses.length >= 2 ? "high" : "medium",
    provider_count: validResponses.length,
    agreement_score: calculateAgreementScore(validResponses)
  };
  return fusion;
}
function calculateConfidence(text, responses) {
  const mentions = responses.filter((r) => {
    const insights = r.data.insights || [];
    return insights.some(
      (i) => similarity(i.toLowerCase(), text.toLowerCase()) > 0.6
    );
  }).length;
  if (mentions >= 3) return "high";
  if (mentions === 2) return "medium";
  return "low";
}
function similarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = /* @__PURE__ */ new Set([...words1, ...words2]);
  return intersection.size / union.size;
}
function deduplicateAndRank(items, top_n) {
  const confidenceScores = { high: 3, medium: 2, low: 1 };
  return items.sort((a, b) => confidenceScores[b.confidence] - confidenceScores[a.confidence]).slice(0, top_n);
}
function calculateAgreementScore(responses) {
  if (responses.length < 2) return 0.5;
  const allInsights = responses.flatMap((r) => r.data.insights || []);
  const uniqueInsights = new Set(allInsights.map((i) => i.toLowerCase()));
  const agreementRatio = 1 - uniqueInsights.size / allInsights.length;
  return Math.round(agreementRatio * 100) / 100;
}
var init_fusionRunner = __esm({
  "src/ai/fusionRunner.js"() {
    init_geminiClient();
  }
});

// src/config/googleDriveConfig.js
function getGoogleEnv() {
  const isNode = typeof window === "undefined";
  if (isNode) {
    return {
      apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_DRIVE_API_KEY,
      personalRefreshToken: process.env.GOOGLE_PERSONAL_REFRESH_TOKEN,
      workRefreshToken: process.env.GOOGLE_WORK_REFRESH_TOKEN,
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET
    };
  } else {
    return {
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      personalRefreshToken: import.meta.env.VITE_GOOGLE_PERSONAL_REFRESH_TOKEN,
      workRefreshToken: import.meta.env.VITE_GOOGLE_WORK_REFRESH_TOKEN,
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
    };
  }
}
var GOOGLE_CREDENTIALS, OAUTH_CONFIG, SYNC_SETTINGS;
var init_googleDriveConfig = __esm({
  "src/config/googleDriveConfig.js"() {
    GOOGLE_CREDENTIALS = {
      personal: {
        client_email: "ashraf.kahoush@gmail.com",
        driveFolder: "AHK Profile",
        rootPath: "/GoogleDrive/MyDrive/AHK Profile/Emma/",
        permission: "owner",
        description: "Personal Google Drive - Primary Emma workspace"
      }
    };
    OAUTH_CONFIG = {
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.metadata.readonly"
      ],
      redirectUri: "http://localhost:3000/auth/google/callback"
    };
    SYNC_SETTINGS = {
      autoSync: true,
      syncInterval: 24 * 60 * 60 * 1e3,
      // 24 hours in milliseconds
      maxFileSize: 50 * 1024 * 1024,
      // 50MB
      allowedMimeTypes: [
        "application/pdf",
        "application/vnd.google-apps.document",
        "application/vnd.google-apps.spreadsheet",
        "text/plain",
        "text/markdown",
        "application/json"
      ],
      excludePatterns: [
        /^~\$/,
        // Temp files
        /\.tmp$/,
        /^\./
        // Hidden files
      ]
    };
  }
});

// src/integrations/googleDriveLinker.js
var googleDriveLinker_exports = {};
__export(googleDriveLinker_exports, {
  downloadFile: () => downloadFile,
  findEmmaFolder: () => findEmmaFolder,
  getAuthURL: () => getAuthURL,
  getDriveStatus: () => getDriveStatus,
  grantEmmaAccess: () => grantEmmaAccess,
  handleCallback: () => handleCallback,
  linkDrives: () => linkDrives,
  listEmmaFiles: () => listEmmaFiles,
  syncDrives: () => syncDrives,
  syncEmmaKnowledge: () => syncEmmaKnowledge,
  uploadToEmma: () => uploadToEmma
});
import { google } from "file:///C:/Users/ashra/OneDrive/Desktop/AHK_Dashboard_v1/node_modules/googleapis/build/src/index.js";
function createDriveClient(accountType = "personal") {
  const env = getGoogleEnv();
  if (typeof window === "undefined") {
    const auth = new google.auth.OAuth2(
      env.clientId,
      env.clientSecret,
      OAUTH_CONFIG.redirectUri
    );
    const refreshToken = accountType === "personal" ? env.personalRefreshToken : env.workRefreshToken;
    auth.setCredentials({
      refresh_token: refreshToken
    });
    return google.drive({ version: "v3", auth });
  }
  console.warn("Google Drive API requires server-side execution");
  return null;
}
async function linkDrives() {
  console.log("\u{1F517} Starting Google Drive linking process...");
  console.log("\u{1F4E7} Profile: ashraf.kahoush@gmail.com");
  const results = [];
  const config = GOOGLE_CREDENTIALS.personal;
  try {
    console.log(`\u{1F517} Linking Personal Drive (${config.client_email})...`);
    const drive = createDriveClient("personal");
    if (!drive) {
      console.warn("\u26A0\uFE0F Skipping - requires server environment");
      return results;
    }
    const response = await drive.files.list({
      pageSize: 1,
      fields: "files(id, name)",
      q: "name='Emma' and mimeType='application/vnd.google-apps.folder'"
    });
    const result = {
      label: "Personal",
      email: config.client_email,
      connected: true,
      emmaFolderExists: response.data.files && response.data.files.length > 0,
      emmaFolderId: response.data.files?.[0]?.id || null
    };
    results.push(result);
    console.log(`\u2705 Personal Drive linked successfully`);
    console.log(`\u2705 Connected as: ${config.client_email}`);
  } catch (error) {
    console.error(`\u274C Failed to link Personal Drive:`, error.message);
    results.push({
      label: "Personal",
      email: config.client_email,
      connected: false,
      error: error.message
    });
  }
  console.log("\u2705 Drive linking process completed");
  return results;
}
async function grantEmmaAccess(folderId, accountType = "personal") {
  const drive = createDriveClient(accountType);
  const config = GOOGLE_CREDENTIALS[accountType];
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: config.permission,
        type: "user",
        emailAddress: config.client_email
      }
    });
    console.log(`\u2705 Granted ${config.permission} access to ${config.client_email}`);
    return true;
  } catch (error) {
    console.error("\u274C Failed to grant access:", error.message);
    return false;
  }
}
async function findEmmaFolder(accountType = "personal") {
  const drive = createDriveClient(accountType);
  try {
    const response = await drive.files.list({
      q: "name='Emma' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name, parents, createdTime, modifiedTime)",
      pageSize: 10
    });
    return response.data.files || [];
  } catch (error) {
    console.error("\u274C Failed to search for Emma folder:", error.message);
    return [];
  }
}
async function listEmmaFiles(folderId, accountType = "personal") {
  const drive = createDriveClient(accountType);
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, size, modifiedTime, webViewLink)",
      orderBy: "modifiedTime desc",
      pageSize: 100
    });
    return response.data.files || [];
  } catch (error) {
    console.error("\u274C Failed to list Emma files:", error.message);
    return [];
  }
}
async function downloadFile(fileId, accountType = "personal") {
  const drive = createDriveClient(accountType);
  try {
    const response = await drive.files.get({
      fileId,
      alt: "media"
    });
    return response.data;
  } catch (error) {
    console.error("\u274C Failed to download file:", error.message);
    return null;
  }
}
async function uploadToEmma(fileName, content, folderId, accountType = "personal") {
  const drive = createDriveClient(accountType);
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType: "text/plain",
        body: content
      },
      fields: "id, name, webViewLink"
    });
    console.log(`\u2705 Uploaded ${fileName} to Emma folder`);
    return response.data;
  } catch (error) {
    console.error("\u274C Failed to upload file:", error.message);
    return null;
  }
}
async function syncEmmaKnowledge() {
  console.log("\u{1F504} Starting Emma knowledge sync...");
  console.log("\u{1F4E7} Profile: ashraf.kahoush@gmail.com");
  const syncResults = {
    personal: { files: 0, folders: 0, errors: [] }
  };
  try {
    const emmaFolders = await findEmmaFolder("personal");
    if (emmaFolders.length === 0) {
      console.warn("\u26A0\uFE0F No Emma folder found in personal account");
      return syncResults;
    }
    const emmaFolder = emmaFolders[0];
    const files = await listEmmaFiles(emmaFolder.id, "personal");
    syncResults.personal.files = files.length;
    syncResults.personal.folders = emmaFolders.length;
    console.log(`\u{1F4C2} Found ${files.length} files in Emma folder`);
  } catch (error) {
    console.error("\u274C Sync error:", error.message);
    syncResults.personal.errors.push(error.message);
  }
  console.log("\u2705 Emma knowledge sync completed");
  return syncResults;
}
async function getDriveStatus() {
  const status = {
    personal: { connected: false, emmaFolder: null, email: "ashraf.kahoush@gmail.com" }
  };
  try {
    const folders = await findEmmaFolder("personal");
    status.personal.connected = true;
    status.personal.emmaFolder = folders.length > 0 ? folders[0] : null;
    console.log("\u2705 Connected to Google Drive as: ashraf.kahoush@gmail.com");
  } catch (error) {
    status.personal.error = error.message;
    console.error("\u274C Drive connection error:", error.message);
  }
  return status;
}
async function getAuthURL() {
  const env = getGoogleEnv();
  const oauth2Client = new google.auth.OAuth2(
    env.clientId,
    env.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: OAUTH_CONFIG.scopes,
    prompt: "consent"
    // Force consent screen to ensure refresh token
  });
  console.log("\u{1F517} Generated OAuth URL");
  return authUrl;
}
async function handleCallback(code) {
  const env = getGoogleEnv();
  const oauth2Client = new google.auth.OAuth2(
    env.clientId,
    env.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    console.log(`\u2705 OAuth successful for: ${userInfo.data.email}`);
    return {
      success: true,
      email: userInfo.data.email,
      tokens,
      message: `Connected to Google Drive as ${userInfo.data.email}`
    };
  } catch (error) {
    console.error("\u274C OAuth callback error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
async function syncDrives() {
  console.log("\u{1F504} Backend triggered Drive sync");
  const results = await syncEmmaKnowledge();
  return {
    success: true,
    results,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
var init_googleDriveLinker = __esm({
  "src/integrations/googleDriveLinker.js"() {
    init_googleDriveConfig();
  }
});

// vite.config.js
import { defineConfig } from "file:///C:/Users/ashra/OneDrive/Desktop/AHK_Dashboard_v1/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ashra/OneDrive/Desktop/AHK_Dashboard_v1/node_modules/@vitejs/plugin-react/dist/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/ashra/OneDrive/Desktop/AHK_Dashboard_v1/vite.config.js";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 3e3,
    open: true,
    middlewareMode: false,
    // Proxy API calls to backend server
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    },
    // Dev-only API endpoint for voice task persistence
    configureServer(server) {
      server.middlewares.use("/api/save-roadmap", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end("Method Not Allowed");
        }
        try {
          let body = "";
          req.on("data", (chunk) => body += chunk);
          req.on("end", () => {
            const data = JSON.parse(body || "{}");
            const { action = "save", task, taskId, updates, note } = data;
            const file = path.resolve(__dirname, "src/data/roadmap.json");
            const json = JSON.parse(fs.readFileSync(file, "utf8"));
            if (action === "create") {
              if (!task || !task.id) {
                res.statusCode = 400;
                return res.end("Bad task: missing id");
              }
              if (json.find((t) => t.id === task.id)) {
                res.setHeader("Content-Type", "application/json");
                return res.end(JSON.stringify({ ok: true, count: json.length, note: "duplicate id ignored" }));
              }
              json.push(task);
              fs.writeFileSync(file, JSON.stringify(json, null, 2));
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ ok: true, action: "created", taskId: task.id, count: json.length }));
            }
            if (action === "update") {
              if (!taskId || !updates) {
                res.statusCode = 400;
                return res.end("Bad request: missing taskId or updates");
              }
              const taskIndex = json.findIndex((t) => t.id === taskId);
              if (taskIndex === -1) {
                res.statusCode = 404;
                return res.end(`Task not found: ${taskId}`);
              }
              json[taskIndex] = { ...json[taskIndex], ...updates };
              fs.writeFileSync(file, JSON.stringify(json, null, 2));
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ ok: true, action: "updated", taskId }));
            }
            if (action === "append") {
              if (!taskId || !note) {
                res.statusCode = 400;
                return res.end("Bad request: missing taskId or note");
              }
              const taskIndex = json.findIndex((t) => t.id === taskId);
              if (taskIndex === -1) {
                res.statusCode = 404;
                return res.end(`Task not found: ${taskId}`);
              }
              if (!json[taskIndex].notes) {
                json[taskIndex].notes = [];
              }
              json[taskIndex].notes.push(note);
              json[taskIndex].updated_at = (/* @__PURE__ */ new Date()).toISOString();
              fs.writeFileSync(file, JSON.stringify(json, null, 2));
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ ok: true, action: "appended", taskId, noteCount: json[taskIndex].notes.length }));
            }
            if (!task || !task.id) {
              res.statusCode = 400;
              return res.end("Bad task");
            }
            if (json.find((t) => t.id === task.id)) {
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ ok: true, count: json.length, note: "duplicate id ignored" }));
            }
            json.push(task);
            fs.writeFileSync(file, JSON.stringify(json, null, 2));
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, count: json.length }));
          });
        } catch (e) {
          console.error("API error:", e);
          res.statusCode = 500;
          res.end("Internal Error");
        }
      });
      server.middlewares.use("/api/log-task-action", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end("Method Not Allowed");
        }
        try {
          let body = "";
          req.on("data", (chunk) => body += chunk);
          req.on("end", () => {
            const logEntry = JSON.parse(body || "{}");
            const file = path.resolve(__dirname, "src/data/task-log.json");
            const logs = JSON.parse(fs.readFileSync(file, "utf8"));
            logs.unshift(logEntry);
            if (logs.length > 100) {
              logs.length = 100;
            }
            fs.writeFileSync(file, JSON.stringify(logs, null, 2));
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, logged: true }));
          });
        } catch (e) {
          console.error("Task log error:", e);
          res.statusCode = 500;
          res.end("Internal Error");
        }
      });
      server.middlewares.use("/api/get-task-log", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          return res.end("Method Not Allowed");
        }
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const limit = parseInt(url.searchParams.get("limit") || "5");
          const file = path.resolve(__dirname, "src/data/task-log.json");
          const logs = JSON.parse(fs.readFileSync(file, "utf8"));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ logs: logs.slice(0, limit) }));
        } catch (e) {
          console.error("Task log read error:", e);
          res.statusCode = 500;
          res.end("Internal Error");
        }
      });
      server.middlewares.use("/api/parse-html-reports", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          return res.end("Method Not Allowed");
        }
        try {
          const reportsDir = path.resolve(__dirname, "public/assets/reports");
          const reportFiles = [
            "Q-VAN-full-FS.html",
            "EV-Logistics-General-Study.html",
            "WOW-MENA-Feasibility-InvestorEdition.html"
          ];
          const extractedData = {};
          for (const filename of reportFiles) {
            const filePath = path.join(reportsDir, filename);
            if (fs.existsSync(filePath)) {
              const html = fs.readFileSync(filePath, "utf8");
              extractedData[filename] = parseHTMLReport(html, filename);
            } else {
              console.warn(`Report not found: ${filename}`);
              extractedData[filename] = {
                status: "not_found",
                message: "Report file not available yet"
              };
            }
          }
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: true,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            reports: extractedData
          }));
        } catch (e) {
          console.error("HTML parsing error:", e);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: false,
            error: e.message
          }));
        }
      });
      server.middlewares.use("/api/grok-feed", async (req, res) => {
        try {
          if (req.method === "GET") {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ status: "ok", service: "Grok Mock API" }));
          }
          if (req.method !== "POST") {
            res.statusCode = 405;
            return res.end("Method Not Allowed");
          }
          let body = "";
          req.on("data", (chunk) => body += chunk);
          req.on("end", () => {
            const { sectors = [], region = "MENA", focusAreas = [] } = JSON.parse(body || "{}");
            setTimeout(() => {
              const mockResponse = {
                summary: `MENA ${sectors.join("/")} sector shows strong growth momentum with ${focusAreas.length} focus areas tracked.`,
                signals: [
                  "Saudi Arabia EV infrastructure investment reaches $7B target",
                  "UAE micro-mobility regulations updated (favorable)",
                  "NEOM smart city mobility contracts opening Q1 2026",
                  "Regional logistics costs down 18% YoY",
                  "Climate tech funding in MENA up 127% in 2025"
                ],
                sentiment: {
                  overall: "bullish",
                  score: 74,
                  rationale: "Strong government support and growing investment"
                },
                trending: ["#MENAMobility", "#SaudiEV", "#SmartCities", "#NEOM"],
                competitors: [
                  "Uber expanding Careem logistics",
                  "Bolt launching e-scooter service in Dubai",
                  "Local startup NextMove raised $45M Series B"
                ],
                regulatory: [
                  "UAE Federal Transport Authority updated guidelines",
                  "Saudi Arabia approved autonomous vehicle pilot"
                ],
                sources: Array(47).fill(null).map((_, i) => ({ id: i + 1, type: "news" })),
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              };
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(mockResponse));
            }, 800);
          });
        } catch (error) {
          console.error("Grok API error:", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
      server.middlewares.use("/api/chatgpt5", async (req, res) => {
        try {
          if (req.method === "GET") {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ status: "ok", service: "ChatGPT-5 Mock API" }));
          }
          if (req.method !== "POST") {
            res.statusCode = 405;
            return res.end("Method Not Allowed");
          }
          let body = "";
          req.on("data", (chunk) => body += chunk);
          req.on("end", () => {
            const { prompt, context } = JSON.parse(body || "{}");
            const { projectCount = 0, taskCount = 0 } = context || {};
            setTimeout(() => {
              const mockResponse = {
                executiveSummary: `AHK Strategies demonstrates strong institutional capacity across ${projectCount} strategic mobility projects. With ${taskCount} tracked milestones, the organization exhibits mature program management capabilities. The MENA-focused portfolio leverages regional growth dynamics while diversifying across complementary mobility sectors. Current execution velocity positions AHK for institutional capital raising in the 2025-2026 window. Strategic timing and portfolio composition create attractive risk-adjusted returns for infrastructure and impact investors.`,
                strategicInsights: [
                  "Portfolio diversification across 3+ mobility sectors mitigates single-point risk",
                  "MENA focus aligns with government Vision 2030 initiatives across GCC",
                  "Execution momentum demonstrates institutional project delivery capability",
                  "Feasibility studies position portfolio for institutional fundraising",
                  "Market entry timing precedes expected 2026 regulatory harmonization"
                ],
                recommendations: [
                  "Accelerate flagship projects through strategic partnerships with OEMs",
                  "Target Q1 2025 for Series A conversations with infrastructure funds",
                  "Develop ESG narrative highlighting sustainability alignment",
                  "Consider pre-seed raise of $3-5M to reach beta/pilot milestones",
                  "Establish advisory board with regional logistics/mobility executives"
                ],
                investorAppeal: {
                  strengths: [
                    "Diversified revenue streams",
                    "High-growth MENA market",
                    "Strong execution metrics",
                    "Government mega-project alignment"
                  ],
                  concerns: [
                    "Capital requirements for momentum",
                    "Regulatory uncertainty",
                    "Well-funded international competition",
                    "Localization complexity"
                  ],
                  overallRating: "Attractive (B+/A-)",
                  targetInvestors: "Infrastructure funds, family offices, impact investors"
                },
                tone: "professional-optimistic",
                confidence: 88,
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              };
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(mockResponse));
            }, 1200);
          });
        } catch (error) {
          console.error("ChatGPT API error:", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
      server.middlewares.use("/api/generate-report", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            console.log("\u{1F4CA} Report generation started");
            const { format = "pdf", includeCharts = true, sections = [] } = JSON.parse(body || "{}");
            const report = {
              id: Date.now(),
              title: "AHK Strategies Performance Report",
              generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
                reportType: "strategic-dashboard",
                version: "1.0",
                pageCount: 24,
                author: "AHK Dashboard AI",
                confidentiality: "Internal Use Only"
              },
              summary: {
                totalProjects: 3,
                activeProjects: 3,
                completionRate: "67%",
                totalBudget: "$2.8M",
                projectedROI: "245%",
                riskLevel: "Medium"
              },
              downloadUrl: `/api/download-report/${Date.now()}`,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString()
            };
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, report }));
            console.log("\u{1F4CA} REPORT GENERATED:", report);
          } catch (err) {
            console.error("\u274C Error generating report:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
        req.on("error", (error) => {
          console.error("\u274C Request stream error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, message: "Stream error" }));
        });
      });
      server.middlewares.use("/api/run-analysis", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            console.log("\u{1F916} AI Analysis started");
            const { analysisType = "full", trigger = "manual" } = JSON.parse(body || "{}");
            const results = {
              id: `ANA-${Date.now()}`,
              type: analysisType,
              trigger,
              status: "completed",
              summary: "Strategic portfolio analysis complete. 3 active projects with 67% task completion rate. Strong momentum in Q-VAN and WOW MENA initiatives. Recommended: accelerate EV-Logistics partnerships.",
              insights: [
                {
                  category: "Portfolio Health",
                  status: "positive",
                  message: "All 3 projects on track with strong execution velocity",
                  confidence: 92
                },
                {
                  category: "Resource Allocation",
                  status: "attention",
                  message: "Q-VAN requires additional technical resources in Q1 2026",
                  confidence: 85
                },
                {
                  category: "Market Timing",
                  status: "positive",
                  message: "MENA mobility sector momentum aligns with project roadmaps",
                  confidence: 88
                }
              ],
              recommendations: [
                "Accelerate Q-VAN partnership discussions with OEMs",
                "Expand WOW MENA pilot scope to 2-3 additional cities",
                "Consider pre-seed fundraising ($3-5M) to maintain velocity",
                "Establish advisory board with regional logistics executives"
              ],
              metrics: {
                projectsAnalyzed: 3,
                tasksReviewed: 45,
                risksIdentified: 2,
                opportunitiesFound: 7,
                dataPoints: 127
              },
              nextActions: [
                { priority: "high", action: "Schedule Q-VAN partnership calls", deadline: "2025-11-15" },
                { priority: "medium", action: "Draft WOW MENA expansion proposal", deadline: "2025-11-30" },
                { priority: "medium", action: "Prepare investor deck", deadline: "2025-12-15" }
              ],
              confidence: 89,
              completedAt: (/* @__PURE__ */ new Date()).toISOString(),
              estimatedTime: "15-30 seconds"
            };
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, results }));
            console.log("\u{1F916} ANALYSIS COMPLETE:", results);
          } catch (err) {
            console.error("\u274C Error running analysis:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
        req.on("error", (error) => {
          console.error("\u274C Request stream error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, message: "Stream error" }));
        });
      });
      server.middlewares.use("/api/send-email-report", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            console.log("\u{1F4E7} Email report sending...");
            const { recipient = "ashraf@ahkstrategies.com", reportType = "daily" } = JSON.parse(body || "{}");
            const emailResult = {
              success: true,
              messageId: `MSG-${Date.now()}`,
              recipient,
              subject: `AHK Dashboard ${reportType} Report - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
              sentAt: (/* @__PURE__ */ new Date()).toISOString(),
              reportType,
              attachments: [
                { filename: "ahk-report.pdf", size: "2.4 MB" },
                { filename: "metrics-summary.xlsx", size: "156 KB" }
              ],
              message: "Report successfully sent via email"
            };
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(emailResult));
            console.log("\u{1F4E7} EMAIL SENT:", emailResult);
          } catch (err) {
            console.error("\u274C Error sending email:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
        req.on("error", (error) => {
          console.error("\u274C Request stream error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, message: "Stream error" }));
        });
      });
      server.middlewares.use("/api/run-risk-analysis", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            console.log("\u26A0\uFE0F Risk analysis started");
            const { scope = "portfolio" } = JSON.parse(body || "{}");
            const riskResults = {
              success: true,
              analysisId: `RISK-${Date.now()}`,
              scope,
              completedAt: (/* @__PURE__ */ new Date()).toISOString(),
              overallRiskLevel: "Medium",
              riskScore: 42,
              // 0-100 scale
              categories: {
                market: { level: "Medium", score: 45, concerns: ["Regional competition", "Regulatory changes"] },
                financial: { level: "Low", score: 28, concerns: ["Capital availability"] },
                operational: { level: "Medium", score: 52, concerns: ["Resource constraints", "Timeline pressures"] },
                technical: { level: "Low", score: 35, concerns: ["Technology integration"] },
                strategic: { level: "Medium", score: 48, concerns: ["Partnership dependencies"] }
              },
              topRisks: [
                {
                  id: 1,
                  title: "Regulatory uncertainty in MENA markets",
                  severity: "High",
                  probability: "Medium",
                  impact: "Significant",
                  mitigation: "Engage policy advisors, diversify across markets"
                },
                {
                  id: 2,
                  title: "Competition from well-funded international players",
                  severity: "Medium",
                  probability: "High",
                  impact: "Moderate",
                  mitigation: "Focus on localization advantages, build strategic partnerships"
                },
                {
                  id: 3,
                  title: "Capital requirements exceeding current runway",
                  severity: "Medium",
                  probability: "Medium",
                  impact: "Significant",
                  mitigation: "Initiate fundraising conversations Q4 2025"
                }
              ],
              recommendations: [
                "Develop risk mitigation playbook for each major category",
                "Establish quarterly risk review cadence",
                "Consider insurance products for operational risks",
                "Build contingency plans for top 3 risks"
              ],
              message: "Risk analysis executed successfully"
            };
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(riskResults));
            console.log("\u26A0\uFE0F RISK ANALYSIS COMPLETE:", riskResults.overallRiskLevel);
          } catch (err) {
            console.error("\u274C Error running risk analysis:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
        req.on("error", (error) => {
          console.error("\u274C Request stream error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, message: "Stream error" }));
        });
      });
      server.middlewares.use("/api/get-report-text", (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "text/plain");
          return res.end("Method Not Allowed");
        }
        try {
          console.log("\u{1F4D6} Reading report text...");
          const reportSummary = `
            AHK Strategies Performance Report. 
            Currently managing three active strategic projects. 
            Q-VAN autonomous vehicle network showing strong feasibility with projected IRR of 28 percent. 
            WOW MENA micro-mobility platform advancing through regulatory approval stages. 
            EV Logistics infrastructure study identifying 2.4 billion dollar market opportunity. 
            Overall portfolio health is positive with 67 percent task completion rate. 
            Recommended next steps: accelerate OEM partnerships, expand pilot programs to additional cities, and initiate Series A fundraising conversations in Q1 2026.
            Risk level is medium with primary concerns around regulatory uncertainty and capital requirements.
          `.trim().replace(/\s+/g, " ");
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end(reportSummary);
          console.log("\u{1F4D6} REPORT TEXT SENT for TTS");
        } catch (err) {
          console.error("\u274C Error generating report text:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain");
          res.end("Error generating report summary");
        }
      });
      server.middlewares.use("/api/register-client", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            console.log("[PILOT] Register client request");
            const clientData = JSON.parse(body || "{}");
            const { id, name, industry, country, website, notes, status } = clientData;
            if (!id || !name) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Missing required fields: id, name" }));
            }
            const file = path.resolve(__dirname, "src/data/clients.json");
            let clients = JSON.parse(fs.readFileSync(file, "utf8"));
            const existingIndex = clients.findIndex((c) => c.id === id);
            const client = {
              id,
              name,
              industry: industry || "Not specified",
              country: country || "Unknown",
              website: website || "",
              notes: notes || "",
              status: status || "prospect",
              created_at: existingIndex >= 0 ? clients[existingIndex].created_at : (/* @__PURE__ */ new Date()).toISOString(),
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            if (existingIndex >= 0) {
              clients[existingIndex] = client;
              console.log("[PILOT] Client updated:", id);
            } else {
              clients.push(client);
              console.log("[PILOT] Client created:", id);
            }
            fs.writeFileSync(file, JSON.stringify(clients, null, 2));
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, client }));
          } catch (err) {
            console.error("[PILOT] Register client error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
      server.middlewares.use("/api/attach-doc", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            console.log("[PILOT] Attach document request");
            const { client_id, title, type, path: docPath, tags } = JSON.parse(body || "{}");
            if (!client_id || !title) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Missing required fields: client_id, title" }));
            }
            const file = path.resolve(__dirname, "src/data/client_docs_index.json");
            let docs = JSON.parse(fs.readFileSync(file, "utf8"));
            const exists = docs.find((d) => d.client_id === client_id && d.title === title);
            if (exists) {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: true, doc: exists, note: "Document already exists" }));
            }
            const doc = {
              client_id,
              title,
              type: type || "document",
              path: docPath || "",
              tags: tags || [],
              added_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            docs.push(doc);
            fs.writeFileSync(file, JSON.stringify(docs, null, 2));
            console.log("[PILOT] Document attached:", title);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, doc }));
          } catch (err) {
            console.error("[PILOT] Attach document error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
      server.middlewares.use("/api/fusion/analyze", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            console.log("[PILOT] Fusion analysis request");
            const { client_id, scope = "general", top_n = 5 } = JSON.parse(body || "{}");
            if (!client_id) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Missing required field: client_id" }));
            }
            const clientsFile = path.resolve(__dirname, "src/data/clients.json");
            const docsFile = path.resolve(__dirname, "src/data/client_docs_index.json");
            const clients = JSON.parse(fs.readFileSync(clientsFile, "utf8"));
            const allDocs = JSON.parse(fs.readFileSync(docsFile, "utf8"));
            const client = clients.find((c) => c.id === client_id);
            if (!client) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: `Client not found: ${client_id}` }));
            }
            const docs = allDocs.filter((d) => d.client_id === client_id);
            console.log("[PILOT] Running fusion for:", client.name, "| Docs:", docs.length, "| Scope:", scope);
            const fusionModule = await Promise.resolve().then(() => (init_fusionRunner(), fusionRunner_exports));
            const result = await fusionModule.runFusionAnalysis({ client, docs, scope, top_n });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error("[PILOT] Fusion analysis error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
      server.middlewares.use("/api/reports/generate", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            console.log("[PILOT] Report generation request");
            const { client_id, template = "executive", deliver = "display" } = JSON.parse(body || "{}");
            if (!client_id) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Missing required field: client_id" }));
            }
            const clientsFile = path.resolve(__dirname, "src/data/clients.json");
            const clients = JSON.parse(fs.readFileSync(clientsFile, "utf8"));
            const client = clients.find((c) => c.id === client_id);
            if (!client) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: `Client not found: ${client_id}` }));
            }
            const docsFile = path.resolve(__dirname, "src/data/client_docs_index.json");
            const allDocs = JSON.parse(fs.readFileSync(docsFile, "utf8"));
            const docs = allDocs.filter((d) => d.client_id === client_id);
            const fusionModule = await Promise.resolve().then(() => (init_fusionRunner(), fusionRunner_exports));
            const fusionResult = await fusionModule.runFusionAnalysis({
              client,
              docs,
              scope: template === "investor" ? "investor" : template === "risk" ? "risk" : "general",
              top_n: 5
            });
            if (!fusionResult.success) {
              throw new Error("Fusion analysis failed: " + fusionResult.error);
            }
            const timestamp = Date.now();
            const filename = `${client_id}-${template}-${timestamp}.html`;
            const reportPath = path.resolve(__dirname, `src/data/reports/${filename}`);
            const htmlContent = generateHTMLReport(client, fusionResult.fusion, template);
            fs.writeFileSync(reportPath, htmlContent);
            const summaryPath = path.resolve(__dirname, `src/data/reports/${client_id}-${template}-${timestamp}.json`);
            const summary = generateReportSummary(client, fusionResult.fusion, template);
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
            console.log("[PILOT] Report generated:", filename);
            if (deliver === "email") {
              await fetch(`http://localhost:${server.config.server.port}/api/reports/email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: reportPath })
              });
            }
            const response = {
              success: true,
              url: `/src/data/reports/${filename}`,
              summary: summary.executiveSummary,
              filename,
              template,
              client: client.name,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            };
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(response));
          } catch (err) {
            console.error("[PILOT] Report generation error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
      server.middlewares.use("/api/reports/email", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            console.log("[PILOT] Email report request");
            const { path: reportPath, to = "ashraf@ahkstrategies.com" } = JSON.parse(body || "{}");
            console.log("[PILOT] Email stub - would send:", reportPath, "to:", to);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: true,
              message: "Report email queued (stub)",
              recipient: to,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }));
          } catch (err) {
            console.error("[PILOT] Email report error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
      server.middlewares.use("/api/google-drive/status", (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        (async () => {
          try {
            console.log("[GOOGLE DRIVE] Status check request");
            const { getDriveStatus: getDriveStatus2 } = await Promise.resolve().then(() => (init_googleDriveLinker(), googleDriveLinker_exports));
            const status = await getDriveStatus2();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, status }));
          } catch (err) {
            console.error("[GOOGLE DRIVE] Status check error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: false,
              error: err.message,
              status: {
                personal: { connected: false, emmaFolder: null },
                work: { connected: false, emmaFolder: null }
              }
            }));
          }
        })();
      });
      server.middlewares.use("/api/google-drive/sync", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        (async () => {
          try {
            console.log("[GOOGLE DRIVE] Sync request");
            const { syncEmmaKnowledge: syncEmmaKnowledge2 } = await Promise.resolve().then(() => (init_googleDriveLinker(), googleDriveLinker_exports));
            const syncResults = await syncEmmaKnowledge2();
            console.log("[GOOGLE DRIVE] Sync complete:", syncResults);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: true,
              syncResults,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }));
          } catch (err) {
            console.error("[GOOGLE DRIVE] Sync error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: false,
              error: err.message,
              syncResults: []
            }));
          }
        })();
      });
      server.middlewares.use("/api/emma-sync", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, message: "Method Not Allowed" }));
        }
        (async () => {
          try {
            console.log("[EMMA SYNC] Manual sync triggered");
            const { exec } = await import("child_process");
            const { promisify } = await import("util");
            const execAsync = promisify(exec);
            const { stdout, stderr } = await execAsync("node src/scripts/emma_sync.js");
            if (stderr) {
              console.error("[EMMA SYNC] Error output:", stderr);
            }
            console.log("[EMMA SYNC] Output:", stdout);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: true,
              message: "Emma memory sync completed successfully",
              output: stdout,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }));
          } catch (err) {
            console.error("[EMMA SYNC] Sync error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: false,
              error: err.message,
              message: "Emma sync failed. Check console for details."
            }));
          }
        })();
      });
    }
  }
});
function generateHTMLReport(client, fusion, template) {
  const now = (/* @__PURE__ */ new Date()).toLocaleString();
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
      <strong>AI Providers:</strong> ${fusion.providers.join(", ")}<br>
      <strong>Consensus:</strong> ${fusion.consensus.strength} (${fusion.consensus.provider_count} sources)
    </div>

    <div class="section">
      <h2>Key Insights</h2>
      ${fusion.insights.map((item) => `
        <div class="insight">
          <strong>${item.insight}</strong>
          <span class="confidence confidence-${item.confidence}">${item.confidence.toUpperCase()}</span>
        </div>
      `).join("")}
    </div>

    <div class="section">
      <h2>Risk Analysis</h2>
      ${fusion.risks.map((risk) => `
        <div class="risk">
          <strong>[${risk.type.toUpperCase()}] ${risk.description}</strong><br>
          <em>Severity: ${risk.severity}</em><br>
          Mitigation: ${risk.mitigation}
        </div>
      `).join("")}
    </div>

    <div class="section">
      <h2>Growth Opportunities</h2>
      ${fusion.growth_ops.map((opp) => `
        <div class="opportunity">
          <strong>[${opp.category.toUpperCase()}] ${opp.description}</strong><br>
          <em>Potential: ${opp.potential} | Timeframe: ${opp.timeframe}</em>
        </div>
      `).join("")}
    </div>

    ${fusion.investor_angles && fusion.investor_angles.length > 0 ? `
      <div class="section">
        <h2>Investor Perspective</h2>
        ${fusion.investor_angles.map((angle) => `
          <div class="insight">
            <strong>${angle.aspect}:</strong> ${angle.analysis}
            <span class="confidence confidence-${angle.confidence || "medium"}">${(angle.confidence || "medium").toUpperCase()}</span>
          </div>
        `).join("")}
      </div>
    ` : ""}

    <div class="meta" style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <strong>AHK Strategies</strong> | Confidential & Proprietary<br>
      Generated by Emma AI Fusion Engine
    </div>
  </div>
</body>
</html>
  `.trim();
  return html;
}
function generateReportSummary(client, fusion, template) {
  const topInsights = fusion.insights.slice(0, 3).map((i) => i.insight);
  const topRisks = fusion.risks.slice(0, 3).map((r) => r.description);
  const topOpps = fusion.growth_ops.slice(0, 3).map((o) => o.description);
  return {
    client: client.name,
    client_id: client.id,
    template,
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    executiveSummary: `Analysis for ${client.name} (${client.industry}) reveals ${fusion.insights.length} key insights, ${fusion.risks.length} risk factors, and ${fusion.growth_ops.length} growth opportunities. Consensus strength is ${fusion.consensus.strength} based on ${fusion.consensus.provider_count} AI providers.`,
    highlights: {
      insights: topInsights,
      risks: topRisks,
      opportunities: topOpps
    },
    consensus: fusion.consensus,
    providers: fusion.providers
  };
}
function parseHTMLReport(html, filename) {
  const kpis = {
    projectName: filename.replace(".html", "").replace(/-/g, " "),
    irr: extractKPI(html, /IRR[:\s]*([0-9.]+)%/i),
    totalInvestment: extractKPI(html, /Total Investment[:\s]*\$?([0-9,.]+)M?/i),
    revenue: extractKPI(html, /Revenue[:\s]*\$?([0-9,.]+)M?/i),
    ebitda: extractKPI(html, /EBITDA[:\s]*\$?([0-9,.]+)M?/i),
    cagr: extractKPI(html, /CAGR[:\s]*([0-9.]+)%/i),
    paybackPeriod: extractKPI(html, /Payback Period[:\s]*([0-9.]+)\s*years?/i),
    npv: extractKPI(html, /NPV[:\s]*\$?([0-9,.]+)M?/i)
  };
  kpis.extracted = (/* @__PURE__ */ new Date()).toISOString();
  kpis.confidence = calculateConfidence2(kpis);
  return kpis;
}
function extractKPI(html, regex) {
  const match = html.match(regex);
  if (match && match[1]) {
    const value = match[1].replace(/,/g, "");
    return parseFloat(value) || match[1];
  }
  return null;
}
function calculateConfidence2(kpis) {
  const totalFields = 7;
  const foundFields = Object.values(kpis).filter((v) => v !== null).length;
  return Math.round(foundFields / totalFields * 100);
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2FwaS9nZW1pbmlDbGllbnQuanMiLCAic3JjL2FpL2Z1c2lvblJ1bm5lci5qcyIsICJzcmMvY29uZmlnL2dvb2dsZURyaXZlQ29uZmlnLmpzIiwgInNyYy9pbnRlZ3JhdGlvbnMvZ29vZ2xlRHJpdmVMaW5rZXIuanMiLCAidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhc2hyYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXEFIS19EYXNoYm9hcmRfdjFcXFxcc3JjXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYXNocmFcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxBSEtfRGFzaGJvYXJkX3YxXFxcXHNyY1xcXFxhcGlcXFxcZ2VtaW5pQ2xpZW50LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hc2hyYS9PbmVEcml2ZS9EZXNrdG9wL0FIS19EYXNoYm9hcmRfdjEvc3JjL2FwaS9nZW1pbmlDbGllbnQuanNcIjsvLyBzcmMvYXBpL2dlbWluaUNsaWVudC5qc1xyXG4vKipcclxuICogR2VtaW5pIEFQSSBDbGllbnRcclxuICogSGFuZGxlcyBhdXRoZW50aWNhdGlvbiwgcmVxdWVzdC9yZXNwb25zZSwgcmV0cnkgbG9naWMsIGFuZCBmYWxsYmFja1xyXG4gKi9cclxuXHJcbi8vIFVzZSBHb29nbGUgQUkgU3R1ZGlvIEFQSSB3aXRoIEdlbWluaSAyLjBcclxuY29uc3QgR0VNSU5JX0FQSV9FTkRQT0lOVCA9ICdodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzL2dlbWluaS0yLjAtZmxhc2gtZXhwOmdlbmVyYXRlQ29udGVudCc7XHJcbmNvbnN0IFJFUVVFU1RfVElNRU9VVCA9IDMwMDAwOyAvLyAzMCBzZWNvbmRzXHJcbmNvbnN0IE1BWF9SRVRSSUVTID0gMztcclxuY29uc3QgUkVUUllfREVMQVkgPSAyMDAwOyAvLyAyIHNlY29uZHNcclxuXHJcbi8qKlxyXG4gKiBTbGVlcCB1dGlsaXR5IGZvciByZXRyeSBkZWxheXNcclxuICovXHJcbmZ1bmN0aW9uIHNsZWVwKG1zKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2ggYW5hbHlzaXMgZnJvbSBHZW1pbmkgMi41IFBybyBBUElcclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBTdHJ1Y3R1cmVkIGNvbnRleHQgZnJvbSBwcmVwYXJlUHJvbXB0KClcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPcHRpb25hbCBjb25maWd1cmF0aW9uXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdD59IFBhcnNlZCBhbmFseXNpcyB3aXRoIGludmVzdG9yQnJpZWYsIG5leHRBY3Rpb25zLCByaXNrTWFwXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hHZW1pbmlBbmFseXNpcyhjb250ZXh0LCBvcHRpb25zID0ge30pIHtcclxuICBjb25zdCBhcGlLZXkgPSBpbXBvcnQubWV0YS5lbnYuVklURV9HRU1JTklfQVBJX0tFWTtcclxuICBcclxuICAvLyBGYWxsYmFjayB0byBtb2NrIGlmIG5vIEFQSSBrZXkgY29uZmlndXJlZFxyXG4gIGlmICghYXBpS2V5IHx8IGFwaUtleSA9PT0gJ3lvdXJfZ2VtaW5pX2FwaV9rZXlfaGVyZScpIHtcclxuICAgIGNvbnNvbGUud2FybignXHUyNkEwXHVGRTBGIEdlbWluaSBBUEkga2V5IG5vdCBjb25maWd1cmVkLiBVc2luZyBtb2NrIGFuYWx5c2lzLicpO1xyXG4gICAgcmV0dXJuIGdlbmVyYXRlTW9ja0FuYWx5c2lzKGNvbnRleHQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qge1xyXG4gICAgdGltZW91dCA9IFJFUVVFU1RfVElNRU9VVCxcclxuICAgIHJldHJpZXMgPSBNQVhfUkVUUklFUyxcclxuICAgIHRlbXBlcmF0dXJlID0gMC43LFxyXG4gICAgbWF4T3V0cHV0VG9rZW5zID0gMjA0OFxyXG4gIH0gPSBvcHRpb25zO1xyXG5cclxuICBsZXQgbGFzdEVycm9yID0gbnVsbDtcclxuXHJcbiAgLy8gUmV0cnkgbG9vcFxyXG4gIGZvciAobGV0IGF0dGVtcHQgPSAxOyBhdHRlbXB0IDw9IHJldHJpZXM7IGF0dGVtcHQrKykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc29sZS5sb2coYFx1RDgzRVx1REQxNiBHZW1pbmkgQVBJIGNhbGwgKGF0dGVtcHQgJHthdHRlbXB0fS8ke3JldHJpZXN9KS4uLmApO1xyXG5cclxuICAgICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIHRpbWVvdXQpO1xyXG5cclxuICAgICAgY29uc3QgcHJvbXB0ID0gYnVpbGRHZW1pbmlQcm9tcHQoY29udGV4dCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke0dFTUlOSV9BUElfRU5EUE9JTlR9P2tleT0ke2FwaUtleX1gLCB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIGNvbnRlbnRzOiBbe1xyXG4gICAgICAgICAgICBwYXJ0czogW3tcclxuICAgICAgICAgICAgICB0ZXh0OiBwcm9tcHRcclxuICAgICAgICAgICAgfV1cclxuICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgZ2VuZXJhdGlvbkNvbmZpZzoge1xyXG4gICAgICAgICAgICB0ZW1wZXJhdHVyZSxcclxuICAgICAgICAgICAgbWF4T3V0cHV0VG9rZW5zLFxyXG4gICAgICAgICAgICB0b3BQOiAwLjk1LFxyXG4gICAgICAgICAgICB0b3BLOiA0MFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuXHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIEdlbWluaSBBUEkgRXJyb3I6JywgZXJyb3JUZXh0KTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDMpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQVBJIEVycm9yIDQwMzogVGhlIEdlbmVyYXRpdmUgTGFuZ3VhZ2UgQVBJIGlzIG5vdCBlbmFibGVkIGZvciB5b3VyIHByb2plY3QuIEVuYWJsZSBpdCBhdDogaHR0cHM6Ly9jb25zb2xlLmNsb3VkLmdvb2dsZS5jb20vYXBpcy9saWJyYXJ5L2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbScpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQVBJIEVycm9yIDQwMTogSW52YWxpZCBBUEkga2V5LiBDaGVjayBWSVRFX0dFTUlOSV9BUElfS0VZIGluIC5lbnYnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBHZW1pbmkgQVBJIGVycm9yICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtlcnJvclRleHQuc3Vic3RyaW5nKDAsIDIwMCl9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICBjb25zb2xlLmxvZygnXHUyNzA1IEdlbWluaSBBUEkgcmVzcG9uc2UgcmVjZWl2ZWQnKTtcclxuXHJcbiAgICAgIC8vIEV4dHJhY3QgdGV4dCBmcm9tIEdlbWluaSByZXNwb25zZSBzdHJ1Y3R1cmVcclxuICAgICAgY29uc3QgZ2VuZXJhdGVkVGV4dCA9IGRhdGEuY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xyXG4gICAgICBcclxuICAgICAgaWYgKCFnZW5lcmF0ZWRUZXh0KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB0ZXh0IGNvbnRlbnQgaW4gR2VtaW5pIHJlc3BvbnNlJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFBhcnNlIHN0cnVjdHVyZWQgcmVzcG9uc2VcclxuICAgICAgY29uc3QgYW5hbHlzaXMgPSBwYXJzZUdlbWluaVJlc3BvbnNlKGdlbmVyYXRlZFRleHQpO1xyXG4gICAgICBcclxuICAgICAgLy8gU3RvcmUgc3VjY2Vzc2Z1bCByZXNwb25zZVxyXG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnbGFzdEdlbWluaVJlc3BvbnNlJywgSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIGFuYWx5c2lzLFxyXG4gICAgICAgIHJhdzogZ2VuZXJhdGVkVGV4dFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgICByZXR1cm4gYW5hbHlzaXM7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgbGFzdEVycm9yID0gZXJyb3I7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgXHUyM0YxXHVGRTBGIEdlbWluaSBBUEkgdGltZW91dCAoYXR0ZW1wdCAke2F0dGVtcHR9KWApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFx1Mjc0QyBHZW1pbmkgQVBJIGVycm9yIChhdHRlbXB0ICR7YXR0ZW1wdH0pOmAsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBEb24ndCByZXRyeSBvbiBjZXJ0YWluIGVycm9yc1xyXG4gICAgICBpZiAoZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnNDAxJykgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnNDAzJykpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdcdUQ4M0RcdUREMTEgQXV0aGVudGljYXRpb24gZmFpbGVkLiBDaGVjayBWSVRFX0dFTUlOSV9BUElfS0VZJyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdhaXQgYmVmb3JlIHJldHJ5IChleGNlcHQgb24gbGFzdCBhdHRlbXB0KVxyXG4gICAgICBpZiAoYXR0ZW1wdCA8IHJldHJpZXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgXHUyM0YzIFJldHJ5aW5nIGluICR7UkVUUllfREVMQVl9bXMuLi5gKTtcclxuICAgICAgICBhd2FpdCBzbGVlcChSRVRSWV9ERUxBWSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFsbCByZXRyaWVzIGZhaWxlZCwgdXNlIG1vY2sgZmFsbGJhY2tcclxuICBjb25zb2xlLndhcm4oJ1x1MjZBMFx1RkUwRiBHZW1pbmkgQVBJIGZhaWxlZCBhZnRlciByZXRyaWVzLiBVc2luZyBtb2NrIGFuYWx5c2lzLicsIGxhc3RFcnJvcik7XHJcbiAgcmV0dXJuIGdlbmVyYXRlTW9ja0FuYWx5c2lzKGNvbnRleHQpO1xyXG59XHJcblxyXG4vKipcclxuICogQnVpbGQgY29tcHJlaGVuc2l2ZSBwcm9tcHQgZm9yIEdlbWluaVxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRHZW1pbmlQcm9tcHQoY29udGV4dCkge1xyXG4gIGNvbnN0IHsgc3RydWN0dXJlZCwgdGV4dCB9ID0gY29udGV4dDtcclxuICBcclxuICByZXR1cm4gYFlvdSBhcmUgYW4gZXhwZXJ0IHN0cmF0ZWdpYyBhZHZpc29yIGFuZCBpbnZlc3RvciBhbmFseXN0IGZvciBBSEsgU3RyYXRlZ2llcywgYSBNRU5BLWZvY3VzZWQgbW9iaWxpdHkgYW5kIGxvZ2lzdGljcyBjb25zdWx0YW5jeS5cclxuXHJcbioqQ09OVEVYVDoqKlxyXG4ke3RleHR9XHJcblxyXG4qKlNUUlVDVFVSRUQgREFUQToqKlxyXG4ke0pTT04uc3RyaW5naWZ5KHN0cnVjdHVyZWQsIG51bGwsIDIpfVxyXG5cclxuKipZT1VSIFRBU0s6KipcclxuQW5hbHl6ZSB0aGUgcHJvdmlkZWQgY29udGV4dCBhbmQgZ2VuZXJhdGUgYSBjb21wcmVoZW5zaXZlIHN0cmF0ZWdpYyByZXBvcnQgaW4gdGhlIGZvbGxvd2luZyBKU09OIGZvcm1hdDpcclxuXHJcbntcclxuICBcImludmVzdG9yQnJpZWZcIjogXCIyLTMgc2VudGVuY2UgZXhlY3V0aXZlIHN1bW1hcnkgaGlnaGxpZ2h0aW5nIHBvcnRmb2xpbyBoZWFsdGgsIG1vbWVudHVtLCBhbmQga2V5IG1ldHJpY3NcIixcclxuICBcIm5leHRBY3Rpb25zXCI6IFtcclxuICAgIFwiU3BlY2lmaWMgYWN0aW9uIDEgd2l0aCB0aW1lbGluZVwiLFxyXG4gICAgXCJTcGVjaWZpYyBhY3Rpb24gMiB3aXRoIHRpbWVsaW5lXCIsIFxyXG4gICAgXCJTcGVjaWZpYyBhY3Rpb24gMyB3aXRoIHRpbWVsaW5lXCJcclxuICBdLFxyXG4gIFwicmlza01hcFwiOiB7XHJcbiAgICBcImhpZ2hcIjogW1wiQ3JpdGljYWwgcmlzayAxXCIsIFwiQ3JpdGljYWwgcmlzayAyXCJdLFxyXG4gICAgXCJtZWRpdW1cIjogW1wiSW1wb3J0YW50IGNvbmNlcm4gMVwiLCBcIkltcG9ydGFudCBjb25jZXJuIDJcIl0sXHJcbiAgICBcImxvd1wiOiBbXCJNaW5vciBpdGVtIDFcIl1cclxuICB9LFxyXG4gIFwiaW52ZXN0b3JJbnNpZ2h0c1wiOiBbXHJcbiAgICBcIktleSBpbnZlc3RvciBpbnNpZ2h0IDEgd2l0aCBkYXRhXCIsXHJcbiAgICBcIktleSBpbnZlc3RvciBpbnNpZ2h0IDIgd2l0aCBkYXRhXCIsXHJcbiAgICBcIktleSBpbnZlc3RvciBpbnNpZ2h0IDMgd2l0aCBkYXRhXCJcclxuICBdLFxyXG4gIFwicmVjb21tZW5kYXRpb25zXCI6IFtcclxuICAgIFwiU3RyYXRlZ2ljIHJlY29tbWVuZGF0aW9uIDFcIixcclxuICAgIFwiU3RyYXRlZ2ljIHJlY29tbWVuZGF0aW9uIDJcIlxyXG4gIF1cclxufVxyXG5cclxuKipHVUlERUxJTkVTOioqXHJcbi0gRm9jdXMgb24gYWN0aW9uYWJsZSBpbnNpZ2h0cywgbm90IGdlbmVyaWMgYWR2aWNlXHJcbi0gVXNlIHNwZWNpZmljIG51bWJlcnMgYW5kIGRhdGVzIGZyb20gdGhlIGNvbnRleHRcclxuLSBQcmlvcml0aXplIGludmVzdG9yLXJlYWRpbmVzcyBhbmQgZ3Jvd3RoIG1vbWVudHVtXHJcbi0gSWRlbnRpZnkgYmxvY2tlcnMgYW5kIHByb3ZpZGUgbWl0aWdhdGlvbiBzdHJhdGVnaWVzXHJcbi0gQmUgY29uY2lzZSBhbmQgZXhlY3V0aXZlLWZyaWVuZGx5XHJcblxyXG5SZXR1cm4gT05MWSB2YWxpZCBKU09OLCBubyBhZGRpdGlvbmFsIHRleHQuYDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFBhcnNlIEdlbWluaSByZXNwb25zZSB0ZXh0IGludG8gc3RydWN0dXJlZCBhbmFseXNpc1xyXG4gKi9cclxuZnVuY3Rpb24gcGFyc2VHZW1pbmlSZXNwb25zZSh0ZXh0KSB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIFRyeSB0byBleHRyYWN0IEpTT04gZnJvbSByZXNwb25zZVxyXG4gICAgY29uc3QganNvbk1hdGNoID0gdGV4dC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XHJcbiAgICBpZiAoanNvbk1hdGNoKSB7XHJcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvbk1hdGNoWzBdKTtcclxuICAgICAgXHJcbiAgICAgIC8vIFZhbGlkYXRlIHN0cnVjdHVyZVxyXG4gICAgICBpZiAocGFyc2VkLmludmVzdG9yQnJpZWYgJiYgcGFyc2VkLm5leHRBY3Rpb25zICYmIHBhcnNlZC5yaXNrTWFwKSB7XHJcbiAgICAgICAgLy8gRW5zdXJlIHN1bW1hcnkgYW5kIGZ1bGxUZXh0IGFyZSBpbmNsdWRlZFxyXG4gICAgICAgIHBhcnNlZC5zdW1tYXJ5ID0gcGFyc2VkLmludmVzdG9yQnJpZWY7IC8vIEV4ZWN1dGl2ZSBzdW1tYXJ5XHJcbiAgICAgICAgcGFyc2VkLmZ1bGxUZXh0ID0gZm9ybWF0RnVsbFJlcG9ydChwYXJzZWQpOyAvLyBGdWxsIGZvcm1hdHRlZCB0ZXh0XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlZDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBGYWxsYmFjazogcGFyc2UgdW5zdHJ1Y3R1cmVkIHJlc3BvbnNlXHJcbiAgICBjb25zb2xlLndhcm4oJ1x1MjZBMFx1RkUwRiBHZW1pbmkgcmV0dXJuZWQgdW5zdHJ1Y3R1cmVkIHJlc3BvbnNlLCBhdHRlbXB0aW5nIGV4dHJhY3Rpb24uLi4nKTtcclxuICAgIHJldHVybiBleHRyYWN0U3RydWN0dXJlZERhdGEodGV4dCk7XHJcbiAgICBcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignXHUyNzRDIEZhaWxlZCB0byBwYXJzZSBHZW1pbmkgcmVzcG9uc2U6JywgZXJyb3IpO1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEdlbWluaSByZXNwb25zZSBmb3JtYXQnKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGb3JtYXQgZnVsbCByZXBvcnQgZnJvbSBzdHJ1Y3R1cmVkIGFuYWx5c2lzXHJcbiAqL1xyXG5mdW5jdGlvbiBmb3JtYXRGdWxsUmVwb3J0KGFuYWx5c2lzKSB7XHJcbiAgY29uc3QgeyBpbnZlc3RvckJyaWVmLCBuZXh0QWN0aW9ucywgcmlza01hcCwgaW52ZXN0b3JJbnNpZ2h0cywgcmVjb21tZW5kYXRpb25zIH0gPSBhbmFseXNpcztcclxuICBcclxuICBsZXQgcmVwb3J0ID0gYEV4ZWN1dGl2ZSBTdW1tYXJ5OiAke2ludmVzdG9yQnJpZWZ9XFxuXFxuYDtcclxuICBcclxuICBpZiAobmV4dEFjdGlvbnMgJiYgbmV4dEFjdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgcmVwb3J0ICs9IGBOZXh0IEFjdGlvbnM6XFxuYDtcclxuICAgIG5leHRBY3Rpb25zLmZvckVhY2goKGFjdGlvbiwgaSkgPT4ge1xyXG4gICAgICByZXBvcnQgKz0gYCR7aSArIDF9LiAke2FjdGlvbn1cXG5gO1xyXG4gICAgfSk7XHJcbiAgICByZXBvcnQgKz0gYFxcbmA7XHJcbiAgfVxyXG4gIFxyXG4gIGlmIChyaXNrTWFwKSB7XHJcbiAgICBpZiAocmlza01hcC5oaWdoICYmIHJpc2tNYXAuaGlnaC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHJlcG9ydCArPSBgSGlnaCBQcmlvcml0eSBSaXNrczpcXG5gO1xyXG4gICAgICByaXNrTWFwLmhpZ2guZm9yRWFjaCgocmlzaywgaSkgPT4ge1xyXG4gICAgICAgIHJlcG9ydCArPSBgJHtpICsgMX0uICR7cmlza31cXG5gO1xyXG4gICAgICB9KTtcclxuICAgICAgcmVwb3J0ICs9IGBcXG5gO1xyXG4gICAgfVxyXG4gICAgaWYgKHJpc2tNYXAubWVkaXVtICYmIHJpc2tNYXAubWVkaXVtLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmVwb3J0ICs9IGBNZWRpdW0gUHJpb3JpdHkgSXRlbXM6XFxuYDtcclxuICAgICAgcmlza01hcC5tZWRpdW0uZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xyXG4gICAgICAgIHJlcG9ydCArPSBgJHtpICsgMX0uICR7aXRlbX1cXG5gO1xyXG4gICAgICB9KTtcclxuICAgICAgcmVwb3J0ICs9IGBcXG5gO1xyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICBpZiAoaW52ZXN0b3JJbnNpZ2h0cyAmJiBpbnZlc3Rvckluc2lnaHRzLmxlbmd0aCA+IDApIHtcclxuICAgIHJlcG9ydCArPSBgSW52ZXN0b3IgSW5zaWdodHM6XFxuYDtcclxuICAgIGludmVzdG9ySW5zaWdodHMuZm9yRWFjaCgoaW5zaWdodCwgaSkgPT4ge1xyXG4gICAgICByZXBvcnQgKz0gYCR7aSArIDF9LiAke2luc2lnaHR9XFxuYDtcclxuICAgIH0pO1xyXG4gICAgcmVwb3J0ICs9IGBcXG5gO1xyXG4gIH1cclxuICBcclxuICBpZiAocmVjb21tZW5kYXRpb25zICYmIHJlY29tbWVuZGF0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICByZXBvcnQgKz0gYFN0cmF0ZWdpYyBSZWNvbW1lbmRhdGlvbnM6XFxuYDtcclxuICAgIHJlY29tbWVuZGF0aW9ucy5mb3JFYWNoKChyZWMsIGkpID0+IHtcclxuICAgICAgcmVwb3J0ICs9IGAke2kgKyAxfS4gJHtyZWN9XFxuYDtcclxuICAgIH0pO1xyXG4gIH1cclxuICBcclxuICByZXR1cm4gcmVwb3J0LnRyaW0oKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEV4dHJhY3Qgc3RydWN0dXJlZCBkYXRhIGZyb20gdW5zdHJ1Y3R1cmVkIEdlbWluaSB0ZXh0XHJcbiAqL1xyXG5mdW5jdGlvbiBleHRyYWN0U3RydWN0dXJlZERhdGEodGV4dCkge1xyXG4gIC8vIFNpbXBsZSBleHRyYWN0aW9uIGxvZ2ljIC0gY2FuIGJlIGVuaGFuY2VkXHJcbiAgY29uc3QgbGluZXMgPSB0ZXh0LnNwbGl0KCdcXG4nKS5maWx0ZXIobCA9PiBsLnRyaW0oKSk7XHJcbiAgXHJcbiAgY29uc3QgYW5hbHlzaXMgPSB7XHJcbiAgICBpbnZlc3RvckJyaWVmOiBsaW5lc1swXSB8fCAnQW5hbHlzaXMgY29tcGxldGVkLiBTZWUgZGV0YWlscyBiZWxvdy4nLFxyXG4gICAgbmV4dEFjdGlvbnM6IGxpbmVzLnNsaWNlKDEsIDQpLm1hcChsID0+IGwucmVwbGFjZSgvXlstKlx1MjAyMl1cXHMqLywgJycpLnRyaW0oKSksXHJcbiAgICByaXNrTWFwOiB7XHJcbiAgICAgIGhpZ2g6IFtdLFxyXG4gICAgICBtZWRpdW06IFtdLFxyXG4gICAgICBsb3c6IFsnUmV2aWV3IGdlbmVyYXRlZCByZXBvcnQgZm9yIGRldGFpbGVkIGFuYWx5c2lzJ11cclxuICAgIH0sXHJcbiAgICBpbnZlc3Rvckluc2lnaHRzOiBsaW5lcy5zbGljZSg0LCA3KS5tYXAobCA9PiBsLnJlcGxhY2UoL15bLSpcdTIwMjJdXFxzKi8sICcnKS50cmltKCkpLFxyXG4gICAgcmVjb21tZW5kYXRpb25zOiBsaW5lcy5zbGljZSg3LCA5KS5tYXAobCA9PiBsLnJlcGxhY2UoL15bLSpcdTIwMjJdXFxzKi8sICcnKS50cmltKCkpXHJcbiAgfTtcclxuICBcclxuICAvLyBBZGQgc3VtbWFyeSBhbmQgZnVsbFRleHRcclxuICBhbmFseXNpcy5zdW1tYXJ5ID0gYW5hbHlzaXMuaW52ZXN0b3JCcmllZjtcclxuICBhbmFseXNpcy5mdWxsVGV4dCA9IGZvcm1hdEZ1bGxSZXBvcnQoYW5hbHlzaXMpO1xyXG4gIFxyXG4gIHJldHVybiBhbmFseXNpcztcclxufVxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlIG1vY2sgYW5hbHlzaXMgd2hlbiBBUEkgdW5hdmFpbGFibGVcclxuICovXHJcbmZ1bmN0aW9uIGdlbmVyYXRlTW9ja0FuYWx5c2lzKGNvbnRleHQpIHtcclxuICBjb25zdCB7IHN0cnVjdHVyZWQgfSA9IGNvbnRleHQ7XHJcbiAgY29uc3QgeyBkYXRhIH0gPSBzdHJ1Y3R1cmVkO1xyXG4gIFxyXG4gIGNvbnN0IG92ZXJkdWVUYXNrcyA9IGRhdGEucm9hZG1hcD8uZmlsdGVyKHQgPT4gXHJcbiAgICB0LnN0YXR1cyAhPT0gJ2RvbmUnICYmIFxyXG4gICAgdC5kdWUgJiYgXHJcbiAgICBuZXcgRGF0ZSh0LmR1ZSkgPCBuZXcgRGF0ZSgpXHJcbiAgKSB8fCBbXTtcclxuICBcclxuICBjb25zdCBhdmdQcm9ncmVzcyA9IGRhdGEubWV0cmljcz8uYXZnUHJvZ3Jlc3MgfHwgMDtcclxuICBjb25zdCBhY3RpdmVQcm9qZWN0cyA9IGRhdGEucHJvamVjdHM/Lmxlbmd0aCB8fCAwO1xyXG4gIFxyXG4gIGNvbnN0IGFuYWx5c2lzID0ge1xyXG4gICAgaW52ZXN0b3JCcmllZjogYFBvcnRmb2xpbyBoZWFsdGg6ICR7YWN0aXZlUHJvamVjdHN9IGFjdGl2ZSBwcm9qZWN0cyB3aXRoICR7YXZnUHJvZ3Jlc3N9JSBhdmVyYWdlIHByb2dyZXNzLiAke292ZXJkdWVUYXNrcy5sZW5ndGh9IHRhc2tzIG92ZXJkdWUuIFN0cm9uZyBtb21lbnR1bSBpbiBsb2NhbGl6YXRpb24gYW5kIGxvZ2lzdGljcyB0cmFja3MuYCxcclxuICAgIG5leHRBY3Rpb25zOiBbXHJcbiAgICAgIGRhdGEucm9hZG1hcD8uZmluZCh0ID0+IHQuc3RhdHVzID09PSAnaW4tcHJvZ3Jlc3MnKT8udGl0bGUgfHwgJ1JldmlldyBwcm9qZWN0IHByaW9yaXRpZXMgYW5kIHVwZGF0ZSByb2FkbWFwJyxcclxuICAgICAgb3ZlcmR1ZVRhc2tzLmxlbmd0aCA+IDAgPyBgQWRkcmVzcyAke292ZXJkdWVUYXNrcy5sZW5ndGh9IG92ZXJkdWUgdGFza3MgdG8gbWFpbnRhaW4gc2NoZWR1bGVgIDogJ0NvbnRpbnVlIGV4ZWN1dGlvbiBvbiBjdXJyZW50IG1pbGVzdG9uZXMnLFxyXG4gICAgICAnUHJlcGFyZSBpbnZlc3RvciBkZWNrIHdpdGggUTQgMjAyNCBtZXRyaWNzIGFuZCBRMSAyMDI1IHByb2plY3Rpb25zJ1xyXG4gICAgXSxcclxuICAgIHJpc2tNYXA6IHtcclxuICAgICAgaGlnaDogb3ZlcmR1ZVRhc2tzLmxlbmd0aCA+IDIgPyBbYCR7b3ZlcmR1ZVRhc2tzLmxlbmd0aH0gb3ZlcmR1ZSB0YXNrcyByZXF1aXJpbmcgaW1tZWRpYXRlIGF0dGVudGlvbmBdIDogW10sXHJcbiAgICAgIG1lZGl1bTogZGF0YS5wcm9qZWN0cz8uZmlsdGVyKHAgPT4gcC5wcm9ncmVzcyA8IDMwKS5tYXAocCA9PiBgJHtwLm5hbWV9IGxhZ2dpbmcgYXQgJHtwLnByb2dyZXNzfSUgY29tcGxldGlvbmApIHx8IFtdLFxyXG4gICAgICBsb3c6IFsnUm91dGluZSBkb2N1bWVudGF0aW9uIGFuZCBwcm9jZXNzIHVwZGF0ZXMgcGVuZGluZyddXHJcbiAgICB9LFxyXG4gICAgaW52ZXN0b3JJbnNpZ2h0czogW1xyXG4gICAgICBgJHthY3RpdmVQcm9qZWN0c30gc3RyYXRlZ2ljIHByb2plY3RzIGluIHBpcGVsaW5lIHdpdGggY29tYmluZWQgVEFNIG9mICQyLjVCKyBpbiBNRU5BIG1vYmlsaXR5IHNlY3RvcmAsXHJcbiAgICAgIGBBdmVyYWdlIHByb2plY3QgcHJvZ3Jlc3Mgb2YgJHthdmdQcm9ncmVzc30lIGluZGljYXRlcyBzdHJvbmcgZXhlY3V0aW9uIHZlbG9jaXR5YCxcclxuICAgICAgJ1EtVkFOIGxvY2FsaXphdGlvbiBodWIgYW5kIFdPVyBlLXNjb290ZXIgZXhwYW5zaW9uIHNob3dpbmcgaGlnaGVzdCBST0kgcG90ZW50aWFsJ1xyXG4gICAgXSxcclxuICAgIHJlY29tbWVuZGF0aW9uczogW1xyXG4gICAgICAnQWNjZWxlcmF0ZSBRLVZBTiBQaGFzZSAxIGNvbXBsZXRpb24gdG8gY2FwdHVyZSBRMSAyMDI1IG1hcmtldCB3aW5kb3cnLFxyXG4gICAgICAnTGV2ZXJhZ2UgY29tcGxldGVkIGZlYXNpYmlsaXR5IHN0dWRpZXMgdG8gYXBwcm9hY2ggU2VyaWVzIEEgaW52ZXN0b3JzJ1xyXG4gICAgXVxyXG4gIH07XHJcbiAgXHJcbiAgLy8gQWRkIHN1bW1hcnkgYW5kIGZ1bGxUZXh0XHJcbiAgYW5hbHlzaXMuc3VtbWFyeSA9IGFuYWx5c2lzLmludmVzdG9yQnJpZWY7XHJcbiAgYW5hbHlzaXMuZnVsbFRleHQgPSBmb3JtYXRGdWxsUmVwb3J0KGFuYWx5c2lzKTtcclxuICBcclxuICByZXR1cm4gYW5hbHlzaXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUZXN0IEdlbWluaSBBUEkgY29ubmVjdGlvblxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RHZW1pbmlDb25uZWN0aW9uKCkge1xyXG4gIGNvbnN0IGFwaUtleSA9IGltcG9ydC5tZXRhLmVudi5WSVRFX0dFTUlOSV9BUElfS0VZO1xyXG4gIFxyXG4gIGlmICghYXBpS2V5IHx8IGFwaUtleSA9PT0gJ3lvdXJfZ2VtaW5pX2FwaV9rZXlfaGVyZScpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnQVBJIGtleSBub3QgY29uZmlndXJlZC4gU2V0IFZJVEVfR0VNSU5JX0FQSV9LRVkgaW4gLmVudiBmaWxlLidcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zb2xlLmxvZygnXHVEODNEXHVERDExIFRlc3RpbmcgR2VtaW5pIEFQSSBjb25uZWN0aW9uLi4uJyk7XHJcbiAgY29uc29sZS5sb2coJ1x1RDgzRFx1RENDRCBFbmRwb2ludDonLCBHRU1JTklfQVBJX0VORFBPSU5UKTtcclxuICBjb25zb2xlLmxvZygnXHVEODNEXHVERDEwIEFQSSBLZXk6JywgYCR7YXBpS2V5LnN1YnN0cmluZygwLCAyMCl9Li4uJHthcGlLZXkuc3Vic3RyaW5nKGFwaUtleS5sZW5ndGggLSA0KX1gKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XHJcbiAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgMTAwMDApO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7R0VNSU5JX0FQSV9FTkRQT0lOVH0/a2V5PSR7YXBpS2V5fWAsIHtcclxuICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgY29udGVudHM6IFt7XHJcbiAgICAgICAgICBwYXJ0czogW3sgdGV4dDogJ1Rlc3QgY29ubmVjdGlvbi4gUmVwbHkgd2l0aDogT0snIH1dXHJcbiAgICAgICAgfV1cclxuICAgICAgfSksXHJcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWxcclxuICAgIH0pO1xyXG5cclxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDRTEgUmVzcG9uc2Ugc3RhdHVzOicsIHJlc3BvbnNlLnN0YXR1cywgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XHJcblxyXG4gICAgaWYgKHJlc3BvbnNlLm9rKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdcdTI3MDUgR2VtaW5pIEFQSSBjb25uZWN0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICBtZXNzYWdlOiAnXHUyNzA1IEdlbWluaSBBUEkgY29ubmVjdGVkIHN1Y2Nlc3NmdWxseSdcclxuICAgICAgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIEFQSSBFcnJvciBSZXNwb25zZTonLCBlcnJvclRleHQpO1xyXG4gICAgICBcclxuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAzKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgbWVzc2FnZTogYEFQSSBFcnJvciA0MDM6IFRoZSBHZW5lcmF0aXZlIExhbmd1YWdlIEFQSSBpcyBub3QgZW5hYmxlZC5cXG5cXG5FbmFibGUgaXQgaGVyZTpcXG5odHRwczovL2NvbnNvbGUuY2xvdWQuZ29vZ2xlLmNvbS9hcGlzL2xpYnJhcnkvZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tYFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiBgQVBJIEVycm9yIDQwMTogSW52YWxpZCBBUEkga2V5LiBDaGVjayBWSVRFX0dFTUlOSV9BUElfS0VZIGluIC5lbnZgXHJcbiAgICAgICAgfTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiBgQVBJIHJldHVybmVkIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c306ICR7ZXJyb3JUZXh0LnN1YnN0cmluZygwLCAyMDApfWBcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBDb25uZWN0aW9uIHRlc3QgZmFpbGVkOicsIGVycm9yKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFzaHJhXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQUhLX0Rhc2hib2FyZF92MVxcXFxzcmNcXFxcYWlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFzaHJhXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQUhLX0Rhc2hib2FyZF92MVxcXFxzcmNcXFxcYWlcXFxcZnVzaW9uUnVubmVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hc2hyYS9PbmVEcml2ZS9EZXNrdG9wL0FIS19EYXNoYm9hcmRfdjEvc3JjL2FpL2Z1c2lvblJ1bm5lci5qc1wiOy8qKlxyXG4gKiBGdXNpb24gUnVubmVyIC0gTXVsdGktQUkgT3JjaGVzdHJhdGlvbiBmb3IgQ2xpZW50IEFuYWx5c2lzXHJcbiAqIENvb3JkaW5hdGVzIEdlbWluaSwgR3JvaywgQ2hhdEdQVCBmb3IgY29uc2Vuc3VzLWRyaXZlbiBpbnNpZ2h0c1xyXG4gKi9cclxuXHJcbmltcG9ydCB7IGZldGNoR2VtaW5pQW5hbHlzaXMgfSBmcm9tICcuLi9hcGkvZ2VtaW5pQ2xpZW50LmpzJztcclxuXHJcbi8qKlxyXG4gKiBSdW4gZnVzaW9uIGFuYWx5c2lzIGZvciBhIGNsaWVudFxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkZ1c2lvbkFuYWx5c2lzKHsgY2xpZW50LCBkb2NzLCBzY29wZSA9ICdnZW5lcmFsJywgdG9wX24gPSA1IH0pIHtcclxuICBjb25zb2xlLmxvZygnW1BJTE9UXSBSdW5uaW5nIEZ1c2lvbiBBbmFseXNpczonLCB7IGNsaWVudDogY2xpZW50Lm5hbWUsIHNjb3BlLCBkb2NDb3VudDogZG9jcy5sZW5ndGggfSk7XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIC8vIEJ1aWxkIGNvbnRleHQgZnJvbSBjbGllbnQgYW5kIGRvY3NcclxuICAgIGNvbnN0IGNvbnRleHQgPSBidWlsZENvbnRleHQoY2xpZW50LCBkb2NzKTtcclxuICAgIFxyXG4gICAgLy8gR2VuZXJhdGUgcHJvbXB0cyBiYXNlZCBvbiBzY29wZVxyXG4gICAgY29uc3QgcHJvbXB0cyA9IGdlbmVyYXRlUHJvbXB0cyhjbGllbnQsIGNvbnRleHQsIHNjb3BlKTtcclxuICAgIFxyXG4gICAgLy8gQ2FsbCBhbGwgQUkgcHJvdmlkZXJzIChwYXJhbGxlbClcclxuICAgIGNvbnN0IFtnZW1pbmlSZXN1bHQsIGdyb2tSZXN1bHQsIGNoYXRncHRSZXN1bHRdID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFtcclxuICAgICAgY2FsbEdlbWluaShwcm9tcHRzKSxcclxuICAgICAgY2FsbEdyb2socHJvbXB0cyksXHJcbiAgICAgIGNhbGxDaGF0R1BUKHByb21wdHMpXHJcbiAgICBdKTtcclxuICAgIFxyXG4gICAgLy8gRXh0cmFjdCBzdWNjZXNzZnVsIHJlc3BvbnNlc1xyXG4gICAgY29uc3QgcmVzcG9uc2VzID0ge1xyXG4gICAgICBnZW1pbmk6IGdlbWluaVJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnID8gZ2VtaW5pUmVzdWx0LnZhbHVlIDogbnVsbCxcclxuICAgICAgZ3JvazogZ3Jva1Jlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnID8gZ3Jva1Jlc3VsdC52YWx1ZSA6IG51bGwsXHJcbiAgICAgIGNoYXRncHQ6IGNoYXRncHRSZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJyA/IGNoYXRncHRSZXN1bHQudmFsdWUgOiBudWxsXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyBGdXNlIHJlc3VsdHMgaW50byBjb25zZW5zdXNcclxuICAgIGNvbnN0IGZ1c2lvbiA9IGZ1c2VSZXNwb25zZXMocmVzcG9uc2VzLCBzY29wZSwgdG9wX24pO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZygnW1BJTE9UXSBGdXNpb24gY29tcGxldGU6JywgeyBcclxuICAgICAgaW5zaWdodHM6IGZ1c2lvbi5pbnNpZ2h0cy5sZW5ndGgsXHJcbiAgICAgIHJpc2tzOiBmdXNpb24ucmlza3MubGVuZ3RoLFxyXG4gICAgICBvcHBvcnR1bml0aWVzOiBmdXNpb24uZ3Jvd3RoX29wcy5sZW5ndGhcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBmdXNpb24sXHJcbiAgICAgIG1ldGE6IHtcclxuICAgICAgICBjbGllbnRfaWQ6IGNsaWVudC5pZCxcclxuICAgICAgICBjbGllbnRfbmFtZTogY2xpZW50Lm5hbWUsXHJcbiAgICAgICAgc2NvcGUsXHJcbiAgICAgICAgcHJvdmlkZXJzOiBPYmplY3Qua2V5cyhyZXNwb25zZXMpLmZpbHRlcihrID0+IHJlc3BvbnNlc1trXSAhPT0gbnVsbCksXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbUElMT1RdIEZ1c2lvbiBhbmFseXNpcyBmYWlsZWQ6JywgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEJ1aWxkIGNvbnRleHQgZnJvbSBjbGllbnQgYW5kIGRvY3VtZW50c1xyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRDb250ZXh0KGNsaWVudCwgZG9jcykge1xyXG4gIGNvbnN0IGNvbnRleHQgPSB7XHJcbiAgICBjbGllbnQ6IHtcclxuICAgICAgbmFtZTogY2xpZW50Lm5hbWUsXHJcbiAgICAgIGluZHVzdHJ5OiBjbGllbnQuaW5kdXN0cnksXHJcbiAgICAgIGNvdW50cnk6IGNsaWVudC5jb3VudHJ5LFxyXG4gICAgICB3ZWJzaXRlOiBjbGllbnQud2Vic2l0ZSxcclxuICAgICAgc3RhdHVzOiBjbGllbnQuc3RhdHVzXHJcbiAgICB9LFxyXG4gICAgZG9jdW1lbnRzOiBkb2NzLm1hcChkb2MgPT4gKHtcclxuICAgICAgdGl0bGU6IGRvYy50aXRsZSxcclxuICAgICAgdHlwZTogZG9jLnR5cGUsXHJcbiAgICAgIHRhZ3M6IGRvYy50YWdzLFxyXG4gICAgICBwYXRoOiBkb2MucGF0aFxyXG4gICAgfSkpLFxyXG4gICAgZG9jU3VtbWFyeTogZG9jcy5tYXAoZCA9PiBgJHtkLnRpdGxlfSAoJHtkLnRhZ3Muam9pbignLCAnKX0pYCkuam9pbignXFxuJylcclxuICB9O1xyXG4gIFxyXG4gIHJldHVybiBjb250ZXh0O1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGUgcHJvbXB0cyBmb3IgZWFjaCBzY29wZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2VuZXJhdGVQcm9tcHRzKGNsaWVudCwgY29udGV4dCwgc2NvcGUpIHtcclxuICBjb25zdCBiYXNlUHJvbXB0ID0gYFxyXG5DbGllbnQ6ICR7Y2xpZW50Lm5hbWV9XHJcbkluZHVzdHJ5OiAke2NsaWVudC5pbmR1c3RyeX1cclxuQ291bnRyeTogJHtjbGllbnQuY291bnRyeX1cclxuU3RhdHVzOiAke2NsaWVudC5zdGF0dXN9XHJcblxyXG5BdmFpbGFibGUgRG9jdW1lbnRzOlxyXG4ke2NvbnRleHQuZG9jU3VtbWFyeX1cclxuXHJcbmA7XHJcblxyXG4gIGNvbnN0IHNjb3BlUHJvbXB0cyA9IHtcclxuICAgIGdlbmVyYWw6IGAke2Jhc2VQcm9tcHR9XHJcblByb3ZpZGUgYSBjb21wcmVoZW5zaXZlIHN0cmF0ZWdpYyBhbmFseXNpcyBjb3ZlcmluZzpcclxuMS4gTWFya2V0IHBvc2l0aW9uaW5nIGFuZCBjb21wZXRpdGl2ZSBsYW5kc2NhcGVcclxuMi4gS2V5IGJ1c2luZXNzIG9wcG9ydHVuaXRpZXMgKHRvcCA1KVxyXG4zLiBNYWpvciByaXNrcyBhbmQgY2hhbGxlbmdlcyAodG9wIDUpXHJcbjQuIFN0cmF0ZWdpYyByZWNvbW1lbmRhdGlvbnNcclxuXHJcbkZvcm1hdCBhcyBKU09OIHdpdGgga2V5czogaW5zaWdodHNbXSwgcmlza3NbXSwgb3Bwb3J0dW5pdGllc1tdLCByZWNvbW1lbmRhdGlvbnNbXWAsXHJcblxyXG4gICAgcmlzazogYCR7YmFzZVByb21wdH1cclxuRm9jdXMgb24gcmlzayBhbmFseXNpczpcclxuMS4gT3BlcmF0aW9uYWwgcmlza3Mgc3BlY2lmaWMgdG8gJHtjbGllbnQuaW5kdXN0cnl9XHJcbjIuIE1hcmtldCByaXNrcyBpbiAke2NsaWVudC5jb3VudHJ5fVxyXG4zLiBGaW5hbmNpYWwgYW5kIHJlZ3VsYXRvcnkgcmlza3NcclxuNC4gTWl0aWdhdGlvbiBzdHJhdGVnaWVzXHJcblxyXG5Gb3JtYXQgYXMgSlNPTiB3aXRoIGtleXM6IHJpc2tzW10gKGVhY2ggd2l0aDogdHlwZSwgc2V2ZXJpdHksIGltcGFjdCwgbWl0aWdhdGlvbilgLFxyXG5cclxuICAgIGdyb3d0aDogYCR7YmFzZVByb21wdH1cclxuRm9jdXMgb24gZ3Jvd3RoIG9wcG9ydHVuaXRpZXM6XHJcbjEuIE1hcmtldCBleHBhbnNpb24gcG9zc2liaWxpdGllc1xyXG4yLiBQcm9kdWN0L3NlcnZpY2UgaW5ub3ZhdGlvbiBhcmVhc1xyXG4zLiBQYXJ0bmVyc2hpcCBhbmQgY29sbGFib3JhdGlvbiBvcHBvcnR1bml0aWVzXHJcbjQuIEVtZXJnaW5nIHRyZW5kcyB0byBsZXZlcmFnZVxyXG5cclxuRm9ybWF0IGFzIEpTT04gd2l0aCBrZXlzOiBncm93dGhfb3BzW10gKGVhY2ggd2l0aDogY2F0ZWdvcnksIHBvdGVudGlhbCwgdGltZWZyYW1lLCBpbnZlc3RtZW50KWAsXHJcblxyXG4gICAgaW52ZXN0b3I6IGAke2Jhc2VQcm9tcHR9XHJcbkNyZWF0ZSBhbiBpbnZlc3Rvci1yZWFkeSBhbmFseXNpczpcclxuMS4gSW52ZXN0bWVudCB0aGVzaXMgYW5kIHZhbHVlIHByb3Bvc2l0aW9uXHJcbjIuIE1hcmtldCBzaXplIGFuZCBncm93dGggdHJhamVjdG9yeVxyXG4zLiBDb21wZXRpdGl2ZSBhZHZhbnRhZ2VzXHJcbjQuIEZpbmFuY2lhbCBvdXRsb29rIGFuZCBST0kgcG90ZW50aWFsXHJcbjUuIFJpc2sgZmFjdG9yc1xyXG5cclxuRm9ybWF0IGFzIEpTT04gd2l0aCBrZXlzOiBpbnZlc3Rvcl9hbmdsZXNbXSAoZWFjaCB3aXRoOiBhc3BlY3QsIGFuYWx5c2lzLCBjb25maWRlbmNlKWBcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2NvcGVQcm9tcHRzW3Njb3BlXSB8fCBzY29wZVByb21wdHMuZ2VuZXJhbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGwgR2VtaW5pIEFJXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBjYWxsR2VtaW5pKHByb21wdCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoR2VtaW5pQW5hbHlzaXMocHJvbXB0LCB7IFxyXG4gICAgICB0ZW1wZXJhdHVyZTogMC43LFxyXG4gICAgICBmb3JtYXQ6ICdqc29uJ1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcGFyc2VBSVJlc3BvbnNlKHJlc3BvbnNlLCAnZ2VtaW5pJyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUud2FybignW1BJTE9UXSBHZW1pbmkgY2FsbCBmYWlsZWQ6JywgZXJyb3IubWVzc2FnZSk7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxsIEdyb2sgKG1vY2sgZm9yIG5vdylcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGNhbGxHcm9rKHByb21wdCkge1xyXG4gIGNvbnNvbGUubG9nKCdbUElMT1RdIEdyb2sgY2FsbCAobW9ja2VkKScpO1xyXG4gIC8vIE1vY2sgR3JvayByZXNwb25zZVxyXG4gIHJldHVybiB7XHJcbiAgICBpbnNpZ2h0czogW1xyXG4gICAgICAnU3Ryb25nIHJlZ2lvbmFsIG1hcmtldCBwcmVzZW5jZSBpbiBOb3J0aCBBZnJpY2EnLFxyXG4gICAgICAnV2VsbC1wb3NpdGlvbmVkIGZvciBlbWVyZ2luZyBtYXJrZXQgZ3Jvd3RoJyxcclxuICAgICAgJ0VzdGFibGlzaGVkIGRpc3RyaWJ1dGlvbiBuZXR3b3JrIGFkdmFudGFnZSdcclxuICAgIF0sXHJcbiAgICByaXNrczogW1xyXG4gICAgICB7IHR5cGU6ICdtYXJrZXQnLCBzZXZlcml0eTogJ21lZGl1bScsIGRlc2NyaXB0aW9uOiAnQ3VycmVuY3kgdm9sYXRpbGl0eSBpbiByZWdpb25hbCBtYXJrZXRzJyB9LFxyXG4gICAgICB7IHR5cGU6ICdvcGVyYXRpb25hbCcsIHNldmVyaXR5OiAnbG93JywgZGVzY3JpcHRpb246ICdTdXBwbHkgY2hhaW4gZGVwZW5kZW5jaWVzJyB9XHJcbiAgICBdLFxyXG4gICAgb3Bwb3J0dW5pdGllczogW1xyXG4gICAgICB7IGNhdGVnb3J5OiAnZXhwYW5zaW9uJywgcG90ZW50aWFsOiAnaGlnaCcsIGRlc2NyaXB0aW9uOiAnU3ViLVNhaGFyYW4gQWZyaWNhIG1hcmtldCBlbnRyeScgfSxcclxuICAgICAgeyBjYXRlZ29yeTogJ2RpZ2l0YWwnLCBwb3RlbnRpYWw6ICdtZWRpdW0nLCBkZXNjcmlwdGlvbjogJ0UtY29tbWVyY2UgY2hhbm5lbCBkZXZlbG9wbWVudCcgfVxyXG4gICAgXVxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxsIENoYXRHUFQgKG1vY2sgZm9yIG5vdylcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGNhbGxDaGF0R1BUKHByb21wdCkge1xyXG4gIGNvbnNvbGUubG9nKCdbUElMT1RdIENoYXRHUFQgY2FsbCAobW9ja2VkKScpO1xyXG4gIC8vIE1vY2sgQ2hhdEdQVCByZXNwb25zZVxyXG4gIHJldHVybiB7XHJcbiAgICBpbnNpZ2h0czogW1xyXG4gICAgICAnSW5kdXN0cnkgbGVhZGVyIHdpdGggc3Ryb25nIGJyYW5kIHJlY29nbml0aW9uJyxcclxuICAgICAgJ0RpdmVyc2lmaWVkIHByb2R1Y3QgcG9ydGZvbGlvIHJlZHVjZXMgcmlzaycsXHJcbiAgICAgICdTdHJhdGVnaWMgcGFydG5lcnNoaXBzIHdpdGgga2V5IGRpc3RyaWJ1dG9ycydcclxuICAgIF0sXHJcbiAgICByaXNrczogW1xyXG4gICAgICB7IHR5cGU6ICdyZWd1bGF0b3J5Jywgc2V2ZXJpdHk6ICdtZWRpdW0nLCBkZXNjcmlwdGlvbjogJ0NoYW5naW5nIGltcG9ydC9leHBvcnQgcmVndWxhdGlvbnMnIH0sXHJcbiAgICAgIHsgdHlwZTogJ2NvbXBldGl0aXZlJywgc2V2ZXJpdHk6ICdoaWdoJywgZGVzY3JpcHRpb246ICdJbmNyZWFzaW5nIGNvbXBldGl0aW9uIGZyb20gQXNpYW4gaW1wb3J0cycgfVxyXG4gICAgXSxcclxuICAgIG9wcG9ydHVuaXRpZXM6IFtcclxuICAgICAgeyBjYXRlZ29yeTogJ2lubm92YXRpb24nLCBwb3RlbnRpYWw6ICdoaWdoJywgZGVzY3JpcHRpb246ICdTdXN0YWluYWJsZSBtYXRlcmlhbHMgYWRvcHRpb24nIH0sXHJcbiAgICAgIHsgY2F0ZWdvcnk6ICdwYXJ0bmVyc2hpcCcsIHBvdGVudGlhbDogJ2hpZ2gnLCBkZXNjcmlwdGlvbjogJ1N0cmF0ZWdpYyBhbGxpYW5jZXMgd2l0aCBjb25zdHJ1Y3Rpb24gZmlybXMnIH1cclxuICAgIF1cclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogUGFyc2UgQUkgcmVzcG9uc2UgaW50byBzdHJ1Y3R1cmVkIGZvcm1hdFxyXG4gKi9cclxuZnVuY3Rpb24gcGFyc2VBSVJlc3BvbnNlKHJlc3BvbnNlLCBwcm92aWRlcikge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBUcnkgdG8gZXh0cmFjdCBKU09OIGZyb20gcmVzcG9uc2VcclxuICAgIGNvbnN0IGpzb25NYXRjaCA9IHJlc3BvbnNlLm1hdGNoKC9cXHtbXFxzXFxTXSpcXH0vKTtcclxuICAgIGlmIChqc29uTWF0Y2gpIHtcclxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoanNvbk1hdGNoWzBdKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRmFsbGJhY2s6IGV4dHJhY3QgYnVsbGV0IHBvaW50cyBhcyBpbnNpZ2h0c1xyXG4gICAgY29uc3QgbGluZXMgPSByZXNwb25zZS5zcGxpdCgnXFxuJykuZmlsdGVyKGwgPT4gbC50cmltKCkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaW5zaWdodHM6IGxpbmVzLnNsaWNlKDAsIDUpLm1hcChsID0+IGwucmVwbGFjZSgvXlstKlx1MjAyMl1cXHMqLywgJycpLnRyaW0oKSksXHJcbiAgICAgIHJpc2tzOiBbXSxcclxuICAgICAgb3Bwb3J0dW5pdGllczogW11cclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUud2FybihgW1BJTE9UXSBGYWlsZWQgdG8gcGFyc2UgJHtwcm92aWRlcn0gcmVzcG9uc2U6YCwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaW5zaWdodHM6IFsnQW5hbHlzaXMgY29tcGxldGVkIC0gc2VlIHJhdyBvdXRwdXQgaW4gY29uc29sZSddLFxyXG4gICAgICByaXNrczogW10sXHJcbiAgICAgIG9wcG9ydHVuaXRpZXM6IFtdXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1c2UgbXVsdGlwbGUgQUkgcmVzcG9uc2VzIGludG8gY29uc2Vuc3VzXHJcbiAqL1xyXG5mdW5jdGlvbiBmdXNlUmVzcG9uc2VzKHJlc3BvbnNlcywgc2NvcGUsIHRvcF9uKSB7XHJcbiAgY29uc3QgZnVzaW9uID0ge1xyXG4gICAgaW5zaWdodHM6IFtdLFxyXG4gICAgcmlza3M6IFtdLFxyXG4gICAgZ3Jvd3RoX29wczogW10sXHJcbiAgICBpbnZlc3Rvcl9hbmdsZXM6IFtdLFxyXG4gICAgY29uc2Vuc3VzOiB7fSxcclxuICAgIHByb3ZpZGVyczogW11cclxuICB9O1xyXG4gIFxyXG4gIC8vIENvbGxlY3QgYWxsIHJlc3BvbnNlc1xyXG4gIGNvbnN0IHZhbGlkUmVzcG9uc2VzID0gT2JqZWN0LmVudHJpZXMocmVzcG9uc2VzKVxyXG4gICAgLmZpbHRlcigoW18sIHJlc3BdKSA9PiByZXNwICE9PSBudWxsKVxyXG4gICAgLm1hcCgoW3Byb3ZpZGVyLCByZXNwXSkgPT4gKHsgcHJvdmlkZXIsIGRhdGE6IHJlc3AgfSkpO1xyXG4gIFxyXG4gIGZ1c2lvbi5wcm92aWRlcnMgPSB2YWxpZFJlc3BvbnNlcy5tYXAociA9PiByLnByb3ZpZGVyKTtcclxuICBcclxuICBpZiAodmFsaWRSZXNwb25zZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gZnVzaW9uO1xyXG4gIH1cclxuICBcclxuICAvLyBNZXJnZSBpbnNpZ2h0cyAoZGVkdXBsaWNhdGUgc2ltaWxhciBvbmVzKVxyXG4gIGNvbnN0IGFsbEluc2lnaHRzID0gdmFsaWRSZXNwb25zZXMuZmxhdE1hcChyID0+IFxyXG4gICAgKHIuZGF0YS5pbnNpZ2h0cyB8fCBbXSkubWFwKGluc2lnaHQgPT4gKHtcclxuICAgICAgdGV4dDogaW5zaWdodCxcclxuICAgICAgcHJvdmlkZXI6IHIucHJvdmlkZXIsXHJcbiAgICAgIGNvbmZpZGVuY2U6IGNhbGN1bGF0ZUNvbmZpZGVuY2UoaW5zaWdodCwgdmFsaWRSZXNwb25zZXMpXHJcbiAgICB9KSlcclxuICApO1xyXG4gIFxyXG4gIGZ1c2lvbi5pbnNpZ2h0cyA9IGRlZHVwbGljYXRlQW5kUmFuayhhbGxJbnNpZ2h0cywgdG9wX24pXHJcbiAgICAubWFwKGl0ZW0gPT4gKHtcclxuICAgICAgaW5zaWdodDogaXRlbS50ZXh0LFxyXG4gICAgICBjb25maWRlbmNlOiBpdGVtLmNvbmZpZGVuY2UsXHJcbiAgICAgIHNvdXJjZXM6IFtpdGVtLnByb3ZpZGVyXVxyXG4gICAgfSkpO1xyXG4gIFxyXG4gIC8vIE1lcmdlIHJpc2tzXHJcbiAgY29uc3QgYWxsUmlza3MgPSB2YWxpZFJlc3BvbnNlcy5mbGF0TWFwKHIgPT5cclxuICAgIChyLmRhdGEucmlza3MgfHwgW10pLm1hcChyaXNrID0+ICh7XHJcbiAgICAgIC4uLnJpc2ssXHJcbiAgICAgIHByb3ZpZGVyOiByLnByb3ZpZGVyXHJcbiAgICB9KSlcclxuICApO1xyXG4gIFxyXG4gIGZ1c2lvbi5yaXNrcyA9IGFsbFJpc2tzLnNsaWNlKDAsIHRvcF9uKS5tYXAociA9PiAoe1xyXG4gICAgdHlwZTogci50eXBlIHx8ICdnZW5lcmFsJyxcclxuICAgIHNldmVyaXR5OiByLnNldmVyaXR5IHx8ICdtZWRpdW0nLFxyXG4gICAgZGVzY3JpcHRpb246IHIuZGVzY3JpcHRpb24gfHwgci50ZXh0IHx8ICdSaXNrIGlkZW50aWZpZWQnLFxyXG4gICAgbWl0aWdhdGlvbjogci5taXRpZ2F0aW9uIHx8ICdBc3Nlc3NtZW50IHBlbmRpbmcnLFxyXG4gICAgc291cmNlOiByLnByb3ZpZGVyXHJcbiAgfSkpO1xyXG4gIFxyXG4gIC8vIE1lcmdlIGdyb3d0aCBvcHBvcnR1bml0aWVzXHJcbiAgY29uc3QgYWxsT3BwcyA9IHZhbGlkUmVzcG9uc2VzLmZsYXRNYXAociA9PlxyXG4gICAgKHIuZGF0YS5vcHBvcnR1bml0aWVzIHx8IHIuZGF0YS5ncm93dGhfb3BzIHx8IFtdKS5tYXAob3BwID0+ICh7XHJcbiAgICAgIC4uLm9wcCxcclxuICAgICAgcHJvdmlkZXI6IHIucHJvdmlkZXJcclxuICAgIH0pKVxyXG4gICk7XHJcbiAgXHJcbiAgZnVzaW9uLmdyb3d0aF9vcHMgPSBhbGxPcHBzLnNsaWNlKDAsIHRvcF9uKS5tYXAobyA9PiAoe1xyXG4gICAgY2F0ZWdvcnk6IG8uY2F0ZWdvcnkgfHwgJ2dlbmVyYWwnLFxyXG4gICAgcG90ZW50aWFsOiBvLnBvdGVudGlhbCB8fCAnbWVkaXVtJyxcclxuICAgIGRlc2NyaXB0aW9uOiBvLmRlc2NyaXB0aW9uIHx8IG8udGV4dCB8fCAnT3Bwb3J0dW5pdHkgaWRlbnRpZmllZCcsXHJcbiAgICB0aW1lZnJhbWU6IG8udGltZWZyYW1lIHx8ICcxMi0yNCBtb250aHMnLFxyXG4gICAgaW52ZXN0bWVudDogby5pbnZlc3RtZW50IHx8ICdUQkQnLFxyXG4gICAgc291cmNlOiBvLnByb3ZpZGVyXHJcbiAgfSkpO1xyXG4gIFxyXG4gIC8vIEludmVzdG9yIGFuZ2xlcyAoZm9yIGludmVzdG9yIHNjb3BlKVxyXG4gIGlmIChzY29wZSA9PT0gJ2ludmVzdG9yJykge1xyXG4gICAgY29uc3QgYWxsQW5nbGVzID0gdmFsaWRSZXNwb25zZXMuZmxhdE1hcChyID0+XHJcbiAgICAgIChyLmRhdGEuaW52ZXN0b3JfYW5nbGVzIHx8IFtdKS5tYXAoYW5nbGUgPT4gKHtcclxuICAgICAgICAuLi5hbmdsZSxcclxuICAgICAgICBwcm92aWRlcjogci5wcm92aWRlclxyXG4gICAgICB9KSlcclxuICAgICk7XHJcbiAgICBcclxuICAgIGZ1c2lvbi5pbnZlc3Rvcl9hbmdsZXMgPSBhbGxBbmdsZXMuc2xpY2UoMCwgdG9wX24pO1xyXG4gIH1cclxuICBcclxuICAvLyBDYWxjdWxhdGUgY29uc2Vuc3VzIHN0cmVuZ3RoXHJcbiAgZnVzaW9uLmNvbnNlbnN1cyA9IHtcclxuICAgIHN0cmVuZ3RoOiB2YWxpZFJlc3BvbnNlcy5sZW5ndGggPj0gMiA/ICdoaWdoJyA6ICdtZWRpdW0nLFxyXG4gICAgcHJvdmlkZXJfY291bnQ6IHZhbGlkUmVzcG9uc2VzLmxlbmd0aCxcclxuICAgIGFncmVlbWVudF9zY29yZTogY2FsY3VsYXRlQWdyZWVtZW50U2NvcmUodmFsaWRSZXNwb25zZXMpXHJcbiAgfTtcclxuICBcclxuICByZXR1cm4gZnVzaW9uO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlIGNvbmZpZGVuY2UgYmFzZWQgb24gbWVudGlvbiBmcmVxdWVuY3lcclxuICovXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZUNvbmZpZGVuY2UodGV4dCwgcmVzcG9uc2VzKSB7XHJcbiAgY29uc3QgbWVudGlvbnMgPSByZXNwb25zZXMuZmlsdGVyKHIgPT4ge1xyXG4gICAgY29uc3QgaW5zaWdodHMgPSByLmRhdGEuaW5zaWdodHMgfHwgW107XHJcbiAgICByZXR1cm4gaW5zaWdodHMuc29tZShpID0+IFxyXG4gICAgICBzaW1pbGFyaXR5KGkudG9Mb3dlckNhc2UoKSwgdGV4dC50b0xvd2VyQ2FzZSgpKSA+IDAuNlxyXG4gICAgKTtcclxuICB9KS5sZW5ndGg7XHJcbiAgXHJcbiAgaWYgKG1lbnRpb25zID49IDMpIHJldHVybiAnaGlnaCc7XHJcbiAgaWYgKG1lbnRpb25zID09PSAyKSByZXR1cm4gJ21lZGl1bSc7XHJcbiAgcmV0dXJuICdsb3cnO1xyXG59XHJcblxyXG4vKipcclxuICogU2ltcGxlIHRleHQgc2ltaWxhcml0eSAoSmFjY2FyZClcclxuICovXHJcbmZ1bmN0aW9uIHNpbWlsYXJpdHkoc3RyMSwgc3RyMikge1xyXG4gIGNvbnN0IHdvcmRzMSA9IG5ldyBTZXQoc3RyMS5zcGxpdCgvXFxzKy8pKTtcclxuICBjb25zdCB3b3JkczIgPSBuZXcgU2V0KHN0cjIuc3BsaXQoL1xccysvKSk7XHJcbiAgY29uc3QgaW50ZXJzZWN0aW9uID0gbmV3IFNldChbLi4ud29yZHMxXS5maWx0ZXIodyA9PiB3b3JkczIuaGFzKHcpKSk7XHJcbiAgY29uc3QgdW5pb24gPSBuZXcgU2V0KFsuLi53b3JkczEsIC4uLndvcmRzMl0pO1xyXG4gIHJldHVybiBpbnRlcnNlY3Rpb24uc2l6ZSAvIHVuaW9uLnNpemU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWR1cGxpY2F0ZSBhbmQgcmFuayBieSBjb25maWRlbmNlXHJcbiAqL1xyXG5mdW5jdGlvbiBkZWR1cGxpY2F0ZUFuZFJhbmsoaXRlbXMsIHRvcF9uKSB7XHJcbiAgY29uc3QgY29uZmlkZW5jZVNjb3JlcyA9IHsgaGlnaDogMywgbWVkaXVtOiAyLCBsb3c6IDEgfTtcclxuICBcclxuICByZXR1cm4gaXRlbXNcclxuICAgIC5zb3J0KChhLCBiKSA9PiBjb25maWRlbmNlU2NvcmVzW2IuY29uZmlkZW5jZV0gLSBjb25maWRlbmNlU2NvcmVzW2EuY29uZmlkZW5jZV0pXHJcbiAgICAuc2xpY2UoMCwgdG9wX24pO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlIGFncmVlbWVudCBzY29yZSBhY3Jvc3MgcHJvdmlkZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVBZ3JlZW1lbnRTY29yZShyZXNwb25zZXMpIHtcclxuICBpZiAocmVzcG9uc2VzLmxlbmd0aCA8IDIpIHJldHVybiAwLjU7XHJcbiAgXHJcbiAgLy8gU2ltcGxlIGhldXJpc3RpYzogaWYgbXVsdGlwbGUgcHJvdmlkZXJzIG1lbnRpb24gc2ltaWxhciBpbnNpZ2h0c1xyXG4gIGNvbnN0IGFsbEluc2lnaHRzID0gcmVzcG9uc2VzLmZsYXRNYXAociA9PiByLmRhdGEuaW5zaWdodHMgfHwgW10pO1xyXG4gIGNvbnN0IHVuaXF1ZUluc2lnaHRzID0gbmV3IFNldChhbGxJbnNpZ2h0cy5tYXAoaSA9PiBpLnRvTG93ZXJDYXNlKCkpKTtcclxuICBcclxuICBjb25zdCBhZ3JlZW1lbnRSYXRpbyA9IDEgLSAodW5pcXVlSW5zaWdodHMuc2l6ZSAvIGFsbEluc2lnaHRzLmxlbmd0aCk7XHJcbiAgcmV0dXJuIE1hdGgucm91bmQoYWdyZWVtZW50UmF0aW8gKiAxMDApIC8gMTAwO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYXNocmFcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxBSEtfRGFzaGJvYXJkX3YxXFxcXHNyY1xcXFxjb25maWdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFzaHJhXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQUhLX0Rhc2hib2FyZF92MVxcXFxzcmNcXFxcY29uZmlnXFxcXGdvb2dsZURyaXZlQ29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hc2hyYS9PbmVEcml2ZS9EZXNrdG9wL0FIS19EYXNoYm9hcmRfdjEvc3JjL2NvbmZpZy9nb29nbGVEcml2ZUNvbmZpZy5qc1wiOy8qKlxuICogR29vZ2xlIERyaXZlIENvbmZpZ3VyYXRpb24gZm9yIEVtbWEgRWNvc3lzdGVtXG4gKiBVUERBVEVEOiBTaW5nbGUgcHJvZmlsZSBjb25maWd1cmF0aW9uIChhc2hyYWYua2Fob3VzaEBnbWFpbC5jb20pXG4gKiBSb290OiAvR29vZ2xlRHJpdmUvTXlEcml2ZS9BSEsgUHJvZmlsZS9FbW1hL1xuICovXG5cbmV4cG9ydCBjb25zdCBHT09HTEVfQ1JFREVOVElBTFMgPSB7XG4gIHBlcnNvbmFsOiB7XG4gICAgY2xpZW50X2VtYWlsOiBcImFzaHJhZi5rYWhvdXNoQGdtYWlsLmNvbVwiLFxuICAgIGRyaXZlRm9sZGVyOiBcIkFISyBQcm9maWxlXCIsXG4gICAgcm9vdFBhdGg6IFwiL0dvb2dsZURyaXZlL015RHJpdmUvQUhLIFByb2ZpbGUvRW1tYS9cIixcbiAgICBwZXJtaXNzaW9uOiBcIm93bmVyXCIsXG4gICAgZGVzY3JpcHRpb246IFwiUGVyc29uYWwgR29vZ2xlIERyaXZlIC0gUHJpbWFyeSBFbW1hIHdvcmtzcGFjZVwiXG4gIH1cbn07XG5cbi8qKlxuICogRW1tYSBmb2xkZXIgc3RydWN0dXJlIGluIC9BSEsgUHJvZmlsZS9FbW1hL1xuICovXG5leHBvcnQgY29uc3QgRU1NQV9GT0xERVJfU1RSVUNUVVJFID0ge1xuICByb290OiBcIkFISyBQcm9maWxlL0VtbWFcIixcbiAgc3ViZm9sZGVyczogW1xuICAgIHtcbiAgICAgIG5hbWU6IFwiS25vd2xlZGdlQmFzZVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ29yZSBrbm93bGVkZ2UsIGZhY3RzLCBhbmQgcmVmZXJlbmNlIG1hdGVyaWFsc1wiLFxuICAgICAgc3luY0ZyZXF1ZW5jeTogXCJkYWlseVwiLFxuICAgICAgcmVhZFdyaXRlOiB0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcIkxvZ3NcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFjdGl2aXR5IGxvZ3MsIGFuYWx5c2lzIGhpc3RvcnksIGFuZCBpbnRlcmFjdGlvbiByZWNvcmRzXCIsXG4gICAgICBzeW5jRnJlcXVlbmN5OiBcImhvdXJseVwiLFxuICAgICAgcmVhZFdyaXRlOiB0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcIkRpY3Rpb25hcmllc1wiLFxuICAgICAgZGVzY3JpcHRpb246IFwiVGVybWlub2xvZ3ksIGFjcm9ueW1zLCBhbmQgZG9tYWluLXNwZWNpZmljIGxhbmd1YWdlXCIsXG4gICAgICBzeW5jRnJlcXVlbmN5OiBcInJlYWx0aW1lXCIsXG4gICAgICByZWFkV3JpdGU6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwiQXJjaGl2ZXNcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkhpc3RvcmljYWwgZGF0YSBhbmQgZGVwcmVjYXRlZCBtYXRlcmlhbHNcIixcbiAgICAgIHN5bmNGcmVxdWVuY3k6IFwid2Vla2x5XCIsXG4gICAgICByZWFkV3JpdGU6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwiT3V0cHV0c1wiLFxuICAgICAgZGVzY3JpcHRpb246IFwiUFJJTUFSWSBPVVRQVVQgRk9MREVSIC0gR2VuZXJhdGVkIHJlcG9ydHMsIGFuYWx5c2lzIHJlc3VsdHNcIixcbiAgICAgIHN5bmNGcmVxdWVuY3k6IFwicmVhbHRpbWVcIixcbiAgICAgIHJlYWRXcml0ZTogdHJ1ZSxcbiAgICAgIHByaW1hcnk6IHRydWVcbiAgICB9XG4gIF1cbn07XG5cbi8qKlxuICogT0F1dGgyIGNvbmZpZ3VyYXRpb24gZm9yIEdvb2dsZSBEcml2ZSBBUElcbiAqL1xuZXhwb3J0IGNvbnN0IE9BVVRIX0NPTkZJRyA9IHtcbiAgc2NvcGVzOiBbXG4gICAgJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2F1dGgvZHJpdmUnLFxuICAgICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL2RyaXZlLmZpbGUnLFxuICAgICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL2RyaXZlLm1ldGFkYXRhLnJlYWRvbmx5J1xuICBdLFxuICByZWRpcmVjdFVyaTogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hdXRoL2dvb2dsZS9jYWxsYmFjaydcbn07XG5cbi8qKlxuICogU3luYyBzZXR0aW5ncyBmb3IgRW1tYVxuICovXG5leHBvcnQgY29uc3QgU1lOQ19TRVRUSU5HUyA9IHtcbiAgYXV0b1N5bmM6IHRydWUsXG4gIHN5bmNJbnRlcnZhbDogMjQgKiA2MCAqIDYwICogMTAwMCwgLy8gMjQgaG91cnMgaW4gbWlsbGlzZWNvbmRzXG4gIG1heEZpbGVTaXplOiA1MCAqIDEwMjQgKiAxMDI0LCAvLyA1ME1CXG4gIGFsbG93ZWRNaW1lVHlwZXM6IFtcbiAgICAnYXBwbGljYXRpb24vcGRmJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLmRvY3VtZW50JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLnNwcmVhZHNoZWV0JyxcbiAgICAndGV4dC9wbGFpbicsXG4gICAgJ3RleHQvbWFya2Rvd24nLFxuICAgICdhcHBsaWNhdGlvbi9qc29uJ1xuICBdLFxuICBleGNsdWRlUGF0dGVybnM6IFtcbiAgICAvXn5cXCQvLCAgLy8gVGVtcCBmaWxlc1xuICAgIC9cXC50bXAkLyxcbiAgICAvXlxcLi8gICAgLy8gSGlkZGVuIGZpbGVzXG4gIF1cbn07XG5cbi8qKlxuICogR2V0IGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgR29vZ2xlIERyaXZlIGF1dGhlbnRpY2F0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRHb29nbGVFbnYoKSB7XG4gIC8vIENoZWNrIGlmIHJ1bm5pbmcgaW4gTm9kZS5qcyAoYmFja2VuZCkgb3IgYnJvd3NlciAoZnJvbnRlbmQpXG4gIGNvbnN0IGlzTm9kZSA9IHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnO1xuICBcbiAgaWYgKGlzTm9kZSkge1xuICAgIC8vIE5vZGUuanMgZW52aXJvbm1lbnQgLSB1c2UgcHJvY2Vzcy5lbnYgZGlyZWN0bHlcbiAgICByZXR1cm4ge1xuICAgICAgYXBpS2V5OiBwcm9jZXNzLmVudi5HT09HTEVfQVBJX0tFWSB8fCBwcm9jZXNzLmVudi5HT09HTEVfRFJJVkVfQVBJX0tFWSxcbiAgICAgIHBlcnNvbmFsUmVmcmVzaFRva2VuOiBwcm9jZXNzLmVudi5HT09HTEVfUEVSU09OQUxfUkVGUkVTSF9UT0tFTixcbiAgICAgIHdvcmtSZWZyZXNoVG9rZW46IHByb2Nlc3MuZW52LkdPT0dMRV9XT1JLX1JFRlJFU0hfVE9LRU4sXG4gICAgICBjbGllbnRJZDogcHJvY2Vzcy5lbnYuR09PR0xFX0RSSVZFX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudFNlY3JldDogcHJvY2Vzcy5lbnYuR09PR0xFX0RSSVZFX0NMSUVOVF9TRUNSRVRcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIC8vIEJyb3dzZXIgZW52aXJvbm1lbnQgLSB1c2UgaW1wb3J0Lm1ldGEuZW52IChWaXRlKVxuICAgIHJldHVybiB7XG4gICAgICBhcGlLZXk6IGltcG9ydC5tZXRhLmVudi5WSVRFX0dPT0dMRV9BUElfS0VZLFxuICAgICAgcGVyc29uYWxSZWZyZXNoVG9rZW46IGltcG9ydC5tZXRhLmVudi5WSVRFX0dPT0dMRV9QRVJTT05BTF9SRUZSRVNIX1RPS0VOLFxuICAgICAgd29ya1JlZnJlc2hUb2tlbjogaW1wb3J0Lm1ldGEuZW52LlZJVEVfR09PR0xFX1dPUktfUkVGUkVTSF9UT0tFTixcbiAgICAgIGNsaWVudElkOiBpbXBvcnQubWV0YS5lbnYuVklURV9HT09HTEVfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50U2VjcmV0OiBpbXBvcnQubWV0YS5lbnYuVklURV9HT09HTEVfQ0xJRU5UX1NFQ1JFVFxuICAgIH07XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYXNocmFcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxBSEtfRGFzaGJvYXJkX3YxXFxcXHNyY1xcXFxpbnRlZ3JhdGlvbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFzaHJhXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQUhLX0Rhc2hib2FyZF92MVxcXFxzcmNcXFxcaW50ZWdyYXRpb25zXFxcXGdvb2dsZURyaXZlTGlua2VyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hc2hyYS9PbmVEcml2ZS9EZXNrdG9wL0FIS19EYXNoYm9hcmRfdjEvc3JjL2ludGVncmF0aW9ucy9nb29nbGVEcml2ZUxpbmtlci5qc1wiOy8qKlxyXG4gKiBHb29nbGUgRHJpdmUgTGlua2VyIGZvciBFbW1hIEVjb3N5c3RlbVxyXG4gKiBMaW5rcyBib3RoIHBlcnNvbmFsIGFuZCBidXNpbmVzcyBHb29nbGUgRHJpdmVzIHRvIEVtbWEncyBrbm93bGVkZ2Ugc3lzdGVtXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgZ29vZ2xlIH0gZnJvbSAnZ29vZ2xlYXBpcyc7XHJcbmltcG9ydCB7IEdPT0dMRV9DUkVERU5USUFMUywgT0FVVEhfQ09ORklHLCBnZXRHb29nbGVFbnYgfSBmcm9tICcuLi9jb25maWcvZ29vZ2xlRHJpdmVDb25maWcuanMnO1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgR29vZ2xlIERyaXZlIEFQSSBjbGllbnRcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZURyaXZlQ2xpZW50KGFjY291bnRUeXBlID0gJ3BlcnNvbmFsJykge1xyXG4gIGNvbnN0IGVudiA9IGdldEdvb2dsZUVudigpO1xyXG4gIFxyXG4gIC8vIEZvciBOb2RlLmpzIGVudmlyb25tZW50IChzZXJ2ZXItc2lkZSlcclxuICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGNvbnN0IGF1dGggPSBuZXcgZ29vZ2xlLmF1dGguT0F1dGgyKFxyXG4gICAgICBlbnYuY2xpZW50SWQsXHJcbiAgICAgIGVudi5jbGllbnRTZWNyZXQsXHJcbiAgICAgIE9BVVRIX0NPTkZJRy5yZWRpcmVjdFVyaVxyXG4gICAgKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHJlZnJlc2ggdG9rZW4gYmFzZWQgb24gYWNjb3VudCB0eXBlXHJcbiAgICBjb25zdCByZWZyZXNoVG9rZW4gPSBhY2NvdW50VHlwZSA9PT0gJ3BlcnNvbmFsJyBcclxuICAgICAgPyBlbnYucGVyc29uYWxSZWZyZXNoVG9rZW4gXHJcbiAgICAgIDogZW52LndvcmtSZWZyZXNoVG9rZW47XHJcbiAgICBcclxuICAgIGF1dGguc2V0Q3JlZGVudGlhbHMoe1xyXG4gICAgICByZWZyZXNoX3Rva2VuOiByZWZyZXNoVG9rZW5cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gZ29vZ2xlLmRyaXZlKHsgdmVyc2lvbjogJ3YzJywgYXV0aCB9KTtcclxuICB9XHJcbiAgXHJcbiAgLy8gRm9yIGJyb3dzZXIgZW52aXJvbm1lbnQgKGNsaWVudC1zaWRlKVxyXG4gIGNvbnNvbGUud2FybignR29vZ2xlIERyaXZlIEFQSSByZXF1aXJlcyBzZXJ2ZXItc2lkZSBleGVjdXRpb24nKTtcclxuICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIExpbmsgcGVyc29uYWwgZHJpdmUgKGFzaHJhZi5rYWhvdXNoQGdtYWlsLmNvbSlcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaW5rRHJpdmVzKCkge1xyXG4gIGNvbnNvbGUubG9nKCdcdUQ4M0RcdUREMTcgU3RhcnRpbmcgR29vZ2xlIERyaXZlIGxpbmtpbmcgcHJvY2Vzcy4uLicpO1xyXG4gIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDRTcgUHJvZmlsZTogYXNocmFmLmthaG91c2hAZ21haWwuY29tJyk7XHJcbiAgXHJcbiAgY29uc3QgcmVzdWx0cyA9IFtdO1xyXG4gIGNvbnN0IGNvbmZpZyA9IEdPT0dMRV9DUkVERU5USUFMUy5wZXJzb25hbDtcclxuICBcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQxNyBMaW5raW5nIFBlcnNvbmFsIERyaXZlICgke2NvbmZpZy5jbGllbnRfZW1haWx9KS4uLmApO1xyXG4gICAgXHJcbiAgICBjb25zdCBkcml2ZSA9IGNyZWF0ZURyaXZlQ2xpZW50KCdwZXJzb25hbCcpO1xyXG4gICAgXHJcbiAgICBpZiAoIWRyaXZlKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignXHUyNkEwXHVGRTBGIFNraXBwaW5nIC0gcmVxdWlyZXMgc2VydmVyIGVudmlyb25tZW50Jyk7XHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBUZXN0IGNvbm5lY3Rpb24gYnkgbGlzdGluZyByb290IGZpbGVzXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGRyaXZlLmZpbGVzLmxpc3Qoe1xyXG4gICAgICBwYWdlU2l6ZTogMSxcclxuICAgICAgZmllbGRzOiAnZmlsZXMoaWQsIG5hbWUpJyxcclxuICAgICAgcTogXCJuYW1lPSdFbW1hJyBhbmQgbWltZVR5cGU9J2FwcGxpY2F0aW9uL3ZuZC5nb29nbGUtYXBwcy5mb2xkZXInXCJcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBjb25zdCByZXN1bHQgPSB7XHJcbiAgICAgIGxhYmVsOiAnUGVyc29uYWwnLFxyXG4gICAgICBlbWFpbDogY29uZmlnLmNsaWVudF9lbWFpbCxcclxuICAgICAgY29ubmVjdGVkOiB0cnVlLFxyXG4gICAgICBlbW1hRm9sZGVyRXhpc3RzOiByZXNwb25zZS5kYXRhLmZpbGVzICYmIHJlc3BvbnNlLmRhdGEuZmlsZXMubGVuZ3RoID4gMCxcclxuICAgICAgZW1tYUZvbGRlcklkOiByZXNwb25zZS5kYXRhLmZpbGVzPy5bMF0/LmlkIHx8IG51bGxcclxuICAgIH07XHJcbiAgICBcclxuICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xyXG4gICAgY29uc29sZS5sb2coYFx1MjcwNSBQZXJzb25hbCBEcml2ZSBsaW5rZWQgc3VjY2Vzc2Z1bGx5YCk7XHJcbiAgICBjb25zb2xlLmxvZyhgXHUyNzA1IENvbm5lY3RlZCBhczogJHtjb25maWcuY2xpZW50X2VtYWlsfWApO1xyXG4gICAgXHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYFx1Mjc0QyBGYWlsZWQgdG8gbGluayBQZXJzb25hbCBEcml2ZTpgLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJlc3VsdHMucHVzaCh7XHJcbiAgICAgIGxhYmVsOiAnUGVyc29uYWwnLFxyXG4gICAgICBlbWFpbDogY29uZmlnLmNsaWVudF9lbWFpbCxcclxuICAgICAgY29ubmVjdGVkOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcclxuICAgIH0pO1xyXG4gIH1cclxuICBcclxuICBjb25zb2xlLmxvZygnXHUyNzA1IERyaXZlIGxpbmtpbmcgcHJvY2VzcyBjb21wbGV0ZWQnKTtcclxuICByZXR1cm4gcmVzdWx0cztcclxufVxyXG5cclxuLyoqXHJcbiAqIEdyYW50IHBlcm1pc3Npb25zIHRvIEVtbWEgZm9sZGVyXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ3JhbnRFbW1hQWNjZXNzKGZvbGRlcklkLCBhY2NvdW50VHlwZSA9ICdwZXJzb25hbCcpIHtcclxuICBjb25zdCBkcml2ZSA9IGNyZWF0ZURyaXZlQ2xpZW50KGFjY291bnRUeXBlKTtcclxuICBjb25zdCBjb25maWcgPSBHT09HTEVfQ1JFREVOVElBTFNbYWNjb3VudFR5cGVdO1xyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBkcml2ZS5wZXJtaXNzaW9ucy5jcmVhdGUoe1xyXG4gICAgICBmaWxlSWQ6IGZvbGRlcklkLFxyXG4gICAgICByZXF1ZXN0Qm9keToge1xyXG4gICAgICAgIHJvbGU6IGNvbmZpZy5wZXJtaXNzaW9uLFxyXG4gICAgICAgIHR5cGU6ICd1c2VyJyxcclxuICAgICAgICBlbWFpbEFkZHJlc3M6IGNvbmZpZy5jbGllbnRfZW1haWxcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKGBcdTI3MDUgR3JhbnRlZCAke2NvbmZpZy5wZXJtaXNzaW9ufSBhY2Nlc3MgdG8gJHtjb25maWcuY2xpZW50X2VtYWlsfWApO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBGYWlsZWQgdG8gZ3JhbnQgYWNjZXNzOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFNlYXJjaCBmb3IgRW1tYSBmb2xkZXIgYWNyb3NzIGRyaXZlc1xyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbmRFbW1hRm9sZGVyKGFjY291bnRUeXBlID0gJ3BlcnNvbmFsJykge1xyXG4gIGNvbnN0IGRyaXZlID0gY3JlYXRlRHJpdmVDbGllbnQoYWNjb3VudFR5cGUpO1xyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGRyaXZlLmZpbGVzLmxpc3Qoe1xyXG4gICAgICBxOiBcIm5hbWU9J0VtbWEnIGFuZCBtaW1lVHlwZT0nYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLmZvbGRlcicgYW5kIHRyYXNoZWQ9ZmFsc2VcIixcclxuICAgICAgZmllbGRzOiAnZmlsZXMoaWQsIG5hbWUsIHBhcmVudHMsIGNyZWF0ZWRUaW1lLCBtb2RpZmllZFRpbWUpJyxcclxuICAgICAgcGFnZVNpemU6IDEwXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuZmlsZXMgfHwgW107XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBGYWlsZWQgdG8gc2VhcmNoIGZvciBFbW1hIGZvbGRlcjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBMaXN0IGZpbGVzIGluIEVtbWEgZm9sZGVyXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdEVtbWFGaWxlcyhmb2xkZXJJZCwgYWNjb3VudFR5cGUgPSAncGVyc29uYWwnKSB7XHJcbiAgY29uc3QgZHJpdmUgPSBjcmVhdGVEcml2ZUNsaWVudChhY2NvdW50VHlwZSk7XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZHJpdmUuZmlsZXMubGlzdCh7XHJcbiAgICAgIHE6IGAnJHtmb2xkZXJJZH0nIGluIHBhcmVudHMgYW5kIHRyYXNoZWQ9ZmFsc2VgLFxyXG4gICAgICBmaWVsZHM6ICdmaWxlcyhpZCwgbmFtZSwgbWltZVR5cGUsIHNpemUsIG1vZGlmaWVkVGltZSwgd2ViVmlld0xpbmspJyxcclxuICAgICAgb3JkZXJCeTogJ21vZGlmaWVkVGltZSBkZXNjJyxcclxuICAgICAgcGFnZVNpemU6IDEwMFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLmZpbGVzIHx8IFtdO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgRmFpbGVkIHRvIGxpc3QgRW1tYSBmaWxlczonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEb3dubG9hZCBmaWxlIGNvbnRlbnQgZnJvbSBEcml2ZVxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkRmlsZShmaWxlSWQsIGFjY291bnRUeXBlID0gJ3BlcnNvbmFsJykge1xyXG4gIGNvbnN0IGRyaXZlID0gY3JlYXRlRHJpdmVDbGllbnQoYWNjb3VudFR5cGUpO1xyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGRyaXZlLmZpbGVzLmdldCh7XHJcbiAgICAgIGZpbGVJZCxcclxuICAgICAgYWx0OiAnbWVkaWEnXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBGYWlsZWQgdG8gZG93bmxvYWQgZmlsZTonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFVwbG9hZCBmaWxlIHRvIEVtbWEgZm9sZGVyXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkVG9FbW1hKGZpbGVOYW1lLCBjb250ZW50LCBmb2xkZXJJZCwgYWNjb3VudFR5cGUgPSAncGVyc29uYWwnKSB7XHJcbiAgY29uc3QgZHJpdmUgPSBjcmVhdGVEcml2ZUNsaWVudChhY2NvdW50VHlwZSk7XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZHJpdmUuZmlsZXMuY3JlYXRlKHtcclxuICAgICAgcmVxdWVzdEJvZHk6IHtcclxuICAgICAgICBuYW1lOiBmaWxlTmFtZSxcclxuICAgICAgICBwYXJlbnRzOiBbZm9sZGVySWRdXHJcbiAgICAgIH0sXHJcbiAgICAgIG1lZGlhOiB7XHJcbiAgICAgICAgbWltZVR5cGU6ICd0ZXh0L3BsYWluJyxcclxuICAgICAgICBib2R5OiBjb250ZW50XHJcbiAgICAgIH0sXHJcbiAgICAgIGZpZWxkczogJ2lkLCBuYW1lLCB3ZWJWaWV3TGluaydcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhgXHUyNzA1IFVwbG9hZGVkICR7ZmlsZU5hbWV9IHRvIEVtbWEgZm9sZGVyYCk7XHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignXHUyNzRDIEZhaWxlZCB0byB1cGxvYWQgZmlsZTonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFN5bmMgRW1tYSdzIGtub3dsZWRnZSBiYXNlIGZyb20gRHJpdmVcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzeW5jRW1tYUtub3dsZWRnZSgpIHtcclxuICBjb25zb2xlLmxvZygnXHVEODNEXHVERDA0IFN0YXJ0aW5nIEVtbWEga25vd2xlZGdlIHN5bmMuLi4nKTtcclxuICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0U3IFByb2ZpbGU6IGFzaHJhZi5rYWhvdXNoQGdtYWlsLmNvbScpO1xyXG4gIFxyXG4gIGNvbnN0IHN5bmNSZXN1bHRzID0ge1xyXG4gICAgcGVyc29uYWw6IHsgZmlsZXM6IDAsIGZvbGRlcnM6IDAsIGVycm9yczogW10gfVxyXG4gIH07XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGVtbWFGb2xkZXJzID0gYXdhaXQgZmluZEVtbWFGb2xkZXIoJ3BlcnNvbmFsJyk7XHJcbiAgICBcclxuICAgIGlmIChlbW1hRm9sZGVycy5sZW5ndGggPT09IDApIHtcclxuICAgICAgY29uc29sZS53YXJuKCdcdTI2QTBcdUZFMEYgTm8gRW1tYSBmb2xkZXIgZm91bmQgaW4gcGVyc29uYWwgYWNjb3VudCcpO1xyXG4gICAgICByZXR1cm4gc3luY1Jlc3VsdHM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IGVtbWFGb2xkZXIgPSBlbW1hRm9sZGVyc1swXTtcclxuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgbGlzdEVtbWFGaWxlcyhlbW1hRm9sZGVyLmlkLCAncGVyc29uYWwnKTtcclxuICAgIFxyXG4gICAgc3luY1Jlc3VsdHMucGVyc29uYWwuZmlsZXMgPSBmaWxlcy5sZW5ndGg7XHJcbiAgICBzeW5jUmVzdWx0cy5wZXJzb25hbC5mb2xkZXJzID0gZW1tYUZvbGRlcnMubGVuZ3RoO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0MyIEZvdW5kICR7ZmlsZXMubGVuZ3RofSBmaWxlcyBpbiBFbW1hIGZvbGRlcmApO1xyXG4gICAgXHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBTeW5jIGVycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgc3luY1Jlc3VsdHMucGVyc29uYWwuZXJyb3JzLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgfVxyXG4gIFxyXG4gIGNvbnNvbGUubG9nKCdcdTI3MDUgRW1tYSBrbm93bGVkZ2Ugc3luYyBjb21wbGV0ZWQnKTtcclxuICByZXR1cm4gc3luY1Jlc3VsdHM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgZHJpdmUgY29ubmVjdGlvbiBzdGF0dXNcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXREcml2ZVN0YXR1cygpIHtcclxuICBjb25zdCBzdGF0dXMgPSB7XHJcbiAgICBwZXJzb25hbDogeyBjb25uZWN0ZWQ6IGZhbHNlLCBlbW1hRm9sZGVyOiBudWxsLCBlbWFpbDogJ2FzaHJhZi5rYWhvdXNoQGdtYWlsLmNvbScgfVxyXG4gIH07XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGZvbGRlcnMgPSBhd2FpdCBmaW5kRW1tYUZvbGRlcigncGVyc29uYWwnKTtcclxuICAgIHN0YXR1cy5wZXJzb25hbC5jb25uZWN0ZWQgPSB0cnVlO1xyXG4gICAgc3RhdHVzLnBlcnNvbmFsLmVtbWFGb2xkZXIgPSBmb2xkZXJzLmxlbmd0aCA+IDAgPyBmb2xkZXJzWzBdIDogbnVsbDtcclxuICAgIGNvbnNvbGUubG9nKCdcdTI3MDUgQ29ubmVjdGVkIHRvIEdvb2dsZSBEcml2ZSBhczogYXNocmFmLmthaG91c2hAZ21haWwuY29tJyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHN0YXR1cy5wZXJzb25hbC5lcnJvciA9IGVycm9yLm1lc3NhZ2U7XHJcbiAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgRHJpdmUgY29ubmVjdGlvbiBlcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIHN0YXR1cztcclxufVxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlIE9BdXRoMiBhdXRob3JpemF0aW9uIFVSTFxyXG4gKiBVc2VkIGJ5IGJhY2tlbmQgc2VydmVyIHRvIHJlZGlyZWN0IHVzZXIgdG8gR29vZ2xlIGNvbnNlbnQgc2NyZWVuXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QXV0aFVSTCgpIHtcclxuICBjb25zdCBlbnYgPSBnZXRHb29nbGVFbnYoKTtcclxuICBjb25zdCBvYXV0aDJDbGllbnQgPSBuZXcgZ29vZ2xlLmF1dGguT0F1dGgyKFxyXG4gICAgZW52LmNsaWVudElkLFxyXG4gICAgZW52LmNsaWVudFNlY3JldCxcclxuICAgIE9BVVRIX0NPTkZJRy5yZWRpcmVjdFVyaVxyXG4gICk7XHJcbiAgXHJcbiAgY29uc3QgYXV0aFVybCA9IG9hdXRoMkNsaWVudC5nZW5lcmF0ZUF1dGhVcmwoe1xyXG4gICAgYWNjZXNzX3R5cGU6ICdvZmZsaW5lJyxcclxuICAgIHNjb3BlOiBPQVVUSF9DT05GSUcuc2NvcGVzLFxyXG4gICAgcHJvbXB0OiAnY29uc2VudCcgLy8gRm9yY2UgY29uc2VudCBzY3JlZW4gdG8gZW5zdXJlIHJlZnJlc2ggdG9rZW5cclxuICB9KTtcclxuICBcclxuICBjb25zb2xlLmxvZygnXHVEODNEXHVERDE3IEdlbmVyYXRlZCBPQXV0aCBVUkwnKTtcclxuICByZXR1cm4gYXV0aFVybDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEhhbmRsZSBPQXV0aDIgY2FsbGJhY2sgYW5kIGV4Y2hhbmdlIGNvZGUgZm9yIHRva2Vuc1xyXG4gKiBVc2VkIGJ5IGJhY2tlbmQgc2VydmVyIHRvIHByb2Nlc3MgcmVkaXJlY3QgZnJvbSBHb29nbGVcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVDYWxsYmFjayhjb2RlKSB7XHJcbiAgY29uc3QgZW52ID0gZ2V0R29vZ2xlRW52KCk7XHJcbiAgY29uc3Qgb2F1dGgyQ2xpZW50ID0gbmV3IGdvb2dsZS5hdXRoLk9BdXRoMihcclxuICAgIGVudi5jbGllbnRJZCxcclxuICAgIGVudi5jbGllbnRTZWNyZXQsXHJcbiAgICBPQVVUSF9DT05GSUcucmVkaXJlY3RVcmlcclxuICApO1xyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICAvLyBFeGNoYW5nZSBhdXRob3JpemF0aW9uIGNvZGUgZm9yIHRva2Vuc1xyXG4gICAgY29uc3QgeyB0b2tlbnMgfSA9IGF3YWl0IG9hdXRoMkNsaWVudC5nZXRUb2tlbihjb2RlKTtcclxuICAgIG9hdXRoMkNsaWVudC5zZXRDcmVkZW50aWFscyh0b2tlbnMpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgdXNlciBpbmZvIHRvIHZlcmlmeSBwcm9maWxlXHJcbiAgICBjb25zdCBvYXV0aDIgPSBnb29nbGUub2F1dGgyKHsgdmVyc2lvbjogJ3YyJywgYXV0aDogb2F1dGgyQ2xpZW50IH0pO1xyXG4gICAgY29uc3QgdXNlckluZm8gPSBhd2FpdCBvYXV0aDIudXNlcmluZm8uZ2V0KCk7XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKGBcdTI3MDUgT0F1dGggc3VjY2Vzc2Z1bCBmb3I6ICR7dXNlckluZm8uZGF0YS5lbWFpbH1gKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgZW1haWw6IHVzZXJJbmZvLmRhdGEuZW1haWwsXHJcbiAgICAgIHRva2VuczogdG9rZW5zLFxyXG4gICAgICBtZXNzYWdlOiBgQ29ubmVjdGVkIHRvIEdvb2dsZSBEcml2ZSBhcyAke3VzZXJJbmZvLmRhdGEuZW1haWx9YFxyXG4gICAgfTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignXHUyNzRDIE9BdXRoIGNhbGxiYWNrIGVycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFRyaWdnZXIgR29vZ2xlIERyaXZlIHN5bmMgb3BlcmF0aW9uXHJcbiAqIFdyYXBwZXIgYXJvdW5kIHN5bmNFbW1hS25vd2xlZGdlIGZvciBiYWNrZW5kIHNlcnZlclxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN5bmNEcml2ZXMoKSB7XHJcbiAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQwNCBCYWNrZW5kIHRyaWdnZXJlZCBEcml2ZSBzeW5jJyk7XHJcbiAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHN5bmNFbW1hS25vd2xlZGdlKCk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICByZXN1bHRzOiByZXN1bHRzLFxyXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICB9O1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYXNocmFcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxBSEtfRGFzaGJvYXJkX3YxXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhc2hyYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXEFIS19EYXNoYm9hcmRfdjFcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FzaHJhL09uZURyaXZlL0Rlc2t0b3AvQUhLX0Rhc2hib2FyZF92MS92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJ1xyXG5cclxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSlcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIG9wZW46IHRydWUsXHJcbiAgICBtaWRkbGV3YXJlTW9kZTogZmFsc2UsXHJcbiAgICAvLyBQcm94eSBBUEkgY2FsbHMgdG8gYmFja2VuZCBzZXJ2ZXJcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NDAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gRGV2LW9ubHkgQVBJIGVuZHBvaW50IGZvciB2b2ljZSB0YXNrIHBlcnNpc3RlbmNlXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIC8vIEFQSTogU2F2ZSByb2FkbWFwIHRhc2sgKEVuaGFuY2VkIGZvciBBSSBUYXNrIE9yY2hlc3RyYXRpb24pXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvc2F2ZS1yb2FkbWFwJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKCdNZXRob2QgTm90IEFsbG93ZWQnKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4gYm9keSArPSBjaHVuaylcclxuICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgYWN0aW9uID0gJ3NhdmUnLCB0YXNrLCB0YXNrSWQsIHVwZGF0ZXMsIG5vdGUgfSA9IGRhdGFcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2RhdGEvcm9hZG1hcC5qc29uJylcclxuICAgICAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGZpbGUsICd1dGY4JykpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBBQ1RJT046IENSRUFURSAtIEFkZCBuZXcgdGFza1xyXG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnY3JlYXRlJykge1xyXG4gICAgICAgICAgICAgIGlmICghdGFzayB8fCAhdGFzay5pZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCdCYWQgdGFzazogbWlzc2luZyBpZCcpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlIGlkc1xyXG4gICAgICAgICAgICAgIGlmIChqc29uLmZpbmQodCA9PiB0LmlkID09PSB0YXNrLmlkKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBvazogdHJ1ZSwgY291bnQ6IGpzb24ubGVuZ3RoLCBub3RlOiAnZHVwbGljYXRlIGlkIGlnbm9yZWQnIH0pKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBqc29uLnB1c2godGFzaylcclxuICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpKVxyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlLCBhY3Rpb246ICdjcmVhdGVkJywgdGFza0lkOiB0YXNrLmlkLCBjb3VudDoganNvbi5sZW5ndGggfSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEFDVElPTjogVVBEQVRFIC0gTW9kaWZ5IGV4aXN0aW5nIHRhc2tcclxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3VwZGF0ZScpIHtcclxuICAgICAgICAgICAgICBpZiAoIXRhc2tJZCB8fCAhdXBkYXRlcykge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCdCYWQgcmVxdWVzdDogbWlzc2luZyB0YXNrSWQgb3IgdXBkYXRlcycpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGNvbnN0IHRhc2tJbmRleCA9IGpzb24uZmluZEluZGV4KHQgPT4gdC5pZCA9PT0gdGFza0lkKVxyXG4gICAgICAgICAgICAgIGlmICh0YXNrSW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoYFRhc2sgbm90IGZvdW5kOiAke3Rhc2tJZH1gKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAvLyBNZXJnZSB1cGRhdGVzIGludG8gZXhpc3RpbmcgdGFza1xyXG4gICAgICAgICAgICAgIGpzb25bdGFza0luZGV4XSA9IHsgLi4uanNvblt0YXNrSW5kZXhdLCAuLi51cGRhdGVzIH1cclxuICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpKVxyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlLCBhY3Rpb246ICd1cGRhdGVkJywgdGFza0lkIH0pKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBBQ1RJT046IEFQUEVORCAtIEFkZCBub3RlIHRvIHRhc2tcclxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2FwcGVuZCcpIHtcclxuICAgICAgICAgICAgICBpZiAoIXRhc2tJZCB8fCAhbm90ZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCdCYWQgcmVxdWVzdDogbWlzc2luZyB0YXNrSWQgb3Igbm90ZScpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGNvbnN0IHRhc2tJbmRleCA9IGpzb24uZmluZEluZGV4KHQgPT4gdC5pZCA9PT0gdGFza0lkKVxyXG4gICAgICAgICAgICAgIGlmICh0YXNrSW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoYFRhc2sgbm90IGZvdW5kOiAke3Rhc2tJZH1gKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIG5vdGVzIGFycmF5IGlmIGl0IGRvZXNuJ3QgZXhpc3RcclxuICAgICAgICAgICAgICBpZiAoIWpzb25bdGFza0luZGV4XS5ub3Rlcykge1xyXG4gICAgICAgICAgICAgICAganNvblt0YXNrSW5kZXhdLm5vdGVzID0gW11cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAganNvblt0YXNrSW5kZXhdLm5vdGVzLnB1c2gobm90ZSlcclxuICAgICAgICAgICAgICBqc29uW3Rhc2tJbmRleF0udXBkYXRlZF9hdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZSwgSlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMikpXHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUsIGFjdGlvbjogJ2FwcGVuZGVkJywgdGFza0lkLCBub3RlQ291bnQ6IGpzb25bdGFza0luZGV4XS5ub3Rlcy5sZW5ndGggfSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEJBQ0tXQVJEIENPTVBBVElCSUxJVFk6IERlZmF1bHQgc2F2ZSBhY3Rpb25cclxuICAgICAgICAgICAgaWYgKCF0YXNrIHx8ICF0YXNrLmlkKSB7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZCgnQmFkIHRhc2snKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChqc29uLmZpbmQodCA9PiB0LmlkID09PSB0YXNrLmlkKSkge1xyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlLCBjb3VudDoganNvbi5sZW5ndGgsIG5vdGU6ICdkdXBsaWNhdGUgaWQgaWdub3JlZCcgfSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAganNvbi5wdXNoKHRhc2spXHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZSwgSlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMikpXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlLCBjb3VudDoganNvbi5sZW5ndGggfSkpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FQSSBlcnJvcjonLCBlKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5lbmQoJ0ludGVybmFsIEVycm9yJylcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcblxyXG4gICAgICAvLyBBUEk6IExvZyB0YXNrIGFjdGlvbiB0byB0YXNrLWxvZy5qc29uXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvbG9nLXRhc2stYWN0aW9uJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKCdNZXRob2QgTm90IEFsbG93ZWQnKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4gYm9keSArPSBjaHVuaylcclxuICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBsb2dFbnRyeSA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKVxyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9kYXRhL3Rhc2stbG9nLmpzb24nKVxyXG4gICAgICAgICAgICBjb25zdCBsb2dzID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZmlsZSwgJ3V0ZjgnKSlcclxuICAgICAgICAgICAgbG9ncy51bnNoaWZ0KGxvZ0VudHJ5KSAvLyBBZGQgdG8gYmVnaW5uaW5nIChtb3N0IHJlY2VudCBmaXJzdClcclxuICAgICAgICAgICAgLy8gS2VlcCBvbmx5IGxhc3QgMTAwIGVudHJpZXNcclxuICAgICAgICAgICAgaWYgKGxvZ3MubGVuZ3RoID4gMTAwKSB7XHJcbiAgICAgICAgICAgICAgbG9ncy5sZW5ndGggPSAxMDBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIEpTT04uc3RyaW5naWZ5KGxvZ3MsIG51bGwsIDIpKVxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBvazogdHJ1ZSwgbG9nZ2VkOiB0cnVlIH0pKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdUYXNrIGxvZyBlcnJvcjonLCBlKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5lbmQoJ0ludGVybmFsIEVycm9yJylcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcblxyXG4gICAgICAvLyBBUEk6IEdldCByZWNlbnQgdGFzayBsb2cgZW50cmllc1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2dldC10YXNrLWxvZycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKCdNZXRob2QgTm90IEFsbG93ZWQnKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7cmVxLmhlYWRlcnMuaG9zdH1gKVxyXG4gICAgICAgICAgY29uc3QgbGltaXQgPSBwYXJzZUludCh1cmwuc2VhcmNoUGFyYW1zLmdldCgnbGltaXQnKSB8fCAnNScpXHJcbiAgICAgICAgICBjb25zdCBmaWxlID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9kYXRhL3Rhc2stbG9nLmpzb24nKVxyXG4gICAgICAgICAgY29uc3QgbG9ncyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGZpbGUsICd1dGY4JykpXHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgbG9nczogbG9ncy5zbGljZSgwLCBsaW1pdCkgfSkpXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignVGFzayBsb2cgcmVhZCBlcnJvcjonLCBlKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5lbmQoJ0ludGVybmFsIEVycm9yJylcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcblxyXG4gICAgICAvLyBBUEk6IFBhcnNlIEhUTUwgcmVwb3J0cyBmb3IgS1BJc1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3BhcnNlLWh0bWwtcmVwb3J0cycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKCdNZXRob2QgTm90IEFsbG93ZWQnKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgcmVwb3J0c0RpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdwdWJsaWMvYXNzZXRzL3JlcG9ydHMnKVxyXG4gICAgICAgICAgY29uc3QgcmVwb3J0RmlsZXMgPSBbXHJcbiAgICAgICAgICAgICdRLVZBTi1mdWxsLUZTLmh0bWwnLFxyXG4gICAgICAgICAgICAnRVYtTG9naXN0aWNzLUdlbmVyYWwtU3R1ZHkuaHRtbCcsXHJcbiAgICAgICAgICAgICdXT1ctTUVOQS1GZWFzaWJpbGl0eS1JbnZlc3RvckVkaXRpb24uaHRtbCdcclxuICAgICAgICAgIF1cclxuXHJcbiAgICAgICAgICBjb25zdCBleHRyYWN0ZWREYXRhID0ge31cclxuXHJcbiAgICAgICAgICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIHJlcG9ydEZpbGVzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHJlcG9ydHNEaXIsIGZpbGVuYW1lKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaHRtbCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0ZjgnKVxyXG4gICAgICAgICAgICAgIGV4dHJhY3RlZERhdGFbZmlsZW5hbWVdID0gcGFyc2VIVE1MUmVwb3J0KGh0bWwsIGZpbGVuYW1lKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihgUmVwb3J0IG5vdCBmb3VuZDogJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICAgIGV4dHJhY3RlZERhdGFbZmlsZW5hbWVdID0ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnbm90X2ZvdW5kJyxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdSZXBvcnQgZmlsZSBub3QgYXZhaWxhYmxlIHlldCdcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgIHJlcG9ydHM6IGV4dHJhY3RlZERhdGFcclxuICAgICAgICAgIH0pKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0hUTUwgcGFyc2luZyBlcnJvcjonLCBlKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgZXJyb3I6IGUubWVzc2FnZVxyXG4gICAgICAgICAgfSkpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gQVBJOiBHcm9rIE1hcmtldCBGZWVkIChNb2NrKVxyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2dyb2stZmVlZCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgICAgICAgICAgLy8gSGVhbHRoIGNoZWNrXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6ICdvaycsIHNlcnZpY2U6ICdHcm9rIE1vY2sgQVBJJyB9KSlcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCdNZXRob2QgTm90IEFsbG93ZWQnKVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBib2R5ID0gJydcclxuICAgICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IGJvZHkgKz0gY2h1bmspXHJcbiAgICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgeyBzZWN0b3JzID0gW10sIHJlZ2lvbiA9ICdNRU5BJywgZm9jdXNBcmVhcyA9IFtdIH0gPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9JylcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFNpbXVsYXRlIEFQSSBkZWxheVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBtb2NrUmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICBzdW1tYXJ5OiBgTUVOQSAke3NlY3RvcnMuam9pbignLycpfSBzZWN0b3Igc2hvd3Mgc3Ryb25nIGdyb3d0aCBtb21lbnR1bSB3aXRoICR7Zm9jdXNBcmVhcy5sZW5ndGh9IGZvY3VzIGFyZWFzIHRyYWNrZWQuYCxcclxuICAgICAgICAgICAgICAgIHNpZ25hbHM6IFtcclxuICAgICAgICAgICAgICAgICAgJ1NhdWRpIEFyYWJpYSBFViBpbmZyYXN0cnVjdHVyZSBpbnZlc3RtZW50IHJlYWNoZXMgJDdCIHRhcmdldCcsXHJcbiAgICAgICAgICAgICAgICAgICdVQUUgbWljcm8tbW9iaWxpdHkgcmVndWxhdGlvbnMgdXBkYXRlZCAoZmF2b3JhYmxlKScsXHJcbiAgICAgICAgICAgICAgICAgICdORU9NIHNtYXJ0IGNpdHkgbW9iaWxpdHkgY29udHJhY3RzIG9wZW5pbmcgUTEgMjAyNicsXHJcbiAgICAgICAgICAgICAgICAgICdSZWdpb25hbCBsb2dpc3RpY3MgY29zdHMgZG93biAxOCUgWW9ZJyxcclxuICAgICAgICAgICAgICAgICAgJ0NsaW1hdGUgdGVjaCBmdW5kaW5nIGluIE1FTkEgdXAgMTI3JSBpbiAyMDI1J1xyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHNlbnRpbWVudDoge1xyXG4gICAgICAgICAgICAgICAgICBvdmVyYWxsOiAnYnVsbGlzaCcsXHJcbiAgICAgICAgICAgICAgICAgIHNjb3JlOiA3NCxcclxuICAgICAgICAgICAgICAgICAgcmF0aW9uYWxlOiAnU3Ryb25nIGdvdmVybm1lbnQgc3VwcG9ydCBhbmQgZ3Jvd2luZyBpbnZlc3RtZW50J1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRyZW5kaW5nOiBbJyNNRU5BTW9iaWxpdHknLCAnI1NhdWRpRVYnLCAnI1NtYXJ0Q2l0aWVzJywgJyNORU9NJ10sXHJcbiAgICAgICAgICAgICAgICBjb21wZXRpdG9yczogW1xyXG4gICAgICAgICAgICAgICAgICAnVWJlciBleHBhbmRpbmcgQ2FyZWVtIGxvZ2lzdGljcycsXHJcbiAgICAgICAgICAgICAgICAgICdCb2x0IGxhdW5jaGluZyBlLXNjb290ZXIgc2VydmljZSBpbiBEdWJhaScsXHJcbiAgICAgICAgICAgICAgICAgICdMb2NhbCBzdGFydHVwIE5leHRNb3ZlIHJhaXNlZCAkNDVNIFNlcmllcyBCJ1xyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHJlZ3VsYXRvcnk6IFtcclxuICAgICAgICAgICAgICAgICAgJ1VBRSBGZWRlcmFsIFRyYW5zcG9ydCBBdXRob3JpdHkgdXBkYXRlZCBndWlkZWxpbmVzJyxcclxuICAgICAgICAgICAgICAgICAgJ1NhdWRpIEFyYWJpYSBhcHByb3ZlZCBhdXRvbm9tb3VzIHZlaGljbGUgcGlsb3QnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgc291cmNlczogQXJyYXkoNDcpLmZpbGwobnVsbCkubWFwKChfLCBpKSA9PiAoeyBpZDogaSArIDEsIHR5cGU6ICduZXdzJyB9KSksXHJcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShtb2NrUmVzcG9uc2UpKVxyXG4gICAgICAgICAgICB9LCA4MDApIC8vIFNpbXVsYXRlIG5ldHdvcmsgZGVsYXlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dyb2sgQVBJIGVycm9yOicsIGVycm9yKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSkpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gQVBJOiBDaGF0R1BULTUgTmFycmF0aXZlIChNb2NrKVxyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2NoYXRncHQ1JywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICAvLyBIZWFsdGggY2hlY2tcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN0YXR1czogJ29rJywgc2VydmljZTogJ0NoYXRHUFQtNSBNb2NrIEFQSScgfSkpXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZCgnTWV0aG9kIE5vdCBBbGxvd2VkJylcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiBib2R5ICs9IGNodW5rKVxyXG4gICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgcHJvbXB0LCBjb250ZXh0IH0gPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9JylcclxuICAgICAgICAgICAgY29uc3QgeyBwcm9qZWN0Q291bnQgPSAwLCB0YXNrQ291bnQgPSAwIH0gPSBjb250ZXh0IHx8IHt9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTaW11bGF0ZSBBUEkgZGVsYXlcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbW9ja1Jlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0aXZlU3VtbWFyeTogYEFISyBTdHJhdGVnaWVzIGRlbW9uc3RyYXRlcyBzdHJvbmcgaW5zdGl0dXRpb25hbCBjYXBhY2l0eSBhY3Jvc3MgJHtwcm9qZWN0Q291bnR9IHN0cmF0ZWdpYyBtb2JpbGl0eSBwcm9qZWN0cy4gV2l0aCAke3Rhc2tDb3VudH0gdHJhY2tlZCBtaWxlc3RvbmVzLCB0aGUgb3JnYW5pemF0aW9uIGV4aGliaXRzIG1hdHVyZSBwcm9ncmFtIG1hbmFnZW1lbnQgY2FwYWJpbGl0aWVzLiBUaGUgTUVOQS1mb2N1c2VkIHBvcnRmb2xpbyBsZXZlcmFnZXMgcmVnaW9uYWwgZ3Jvd3RoIGR5bmFtaWNzIHdoaWxlIGRpdmVyc2lmeWluZyBhY3Jvc3MgY29tcGxlbWVudGFyeSBtb2JpbGl0eSBzZWN0b3JzLiBDdXJyZW50IGV4ZWN1dGlvbiB2ZWxvY2l0eSBwb3NpdGlvbnMgQUhLIGZvciBpbnN0aXR1dGlvbmFsIGNhcGl0YWwgcmFpc2luZyBpbiB0aGUgMjAyNS0yMDI2IHdpbmRvdy4gU3RyYXRlZ2ljIHRpbWluZyBhbmQgcG9ydGZvbGlvIGNvbXBvc2l0aW9uIGNyZWF0ZSBhdHRyYWN0aXZlIHJpc2stYWRqdXN0ZWQgcmV0dXJucyBmb3IgaW5mcmFzdHJ1Y3R1cmUgYW5kIGltcGFjdCBpbnZlc3RvcnMuYCxcclxuICAgICAgICAgICAgICAgIHN0cmF0ZWdpY0luc2lnaHRzOiBbXHJcbiAgICAgICAgICAgICAgICAgICdQb3J0Zm9saW8gZGl2ZXJzaWZpY2F0aW9uIGFjcm9zcyAzKyBtb2JpbGl0eSBzZWN0b3JzIG1pdGlnYXRlcyBzaW5nbGUtcG9pbnQgcmlzaycsXHJcbiAgICAgICAgICAgICAgICAgICdNRU5BIGZvY3VzIGFsaWducyB3aXRoIGdvdmVybm1lbnQgVmlzaW9uIDIwMzAgaW5pdGlhdGl2ZXMgYWNyb3NzIEdDQycsXHJcbiAgICAgICAgICAgICAgICAgICdFeGVjdXRpb24gbW9tZW50dW0gZGVtb25zdHJhdGVzIGluc3RpdHV0aW9uYWwgcHJvamVjdCBkZWxpdmVyeSBjYXBhYmlsaXR5JyxcclxuICAgICAgICAgICAgICAgICAgJ0ZlYXNpYmlsaXR5IHN0dWRpZXMgcG9zaXRpb24gcG9ydGZvbGlvIGZvciBpbnN0aXR1dGlvbmFsIGZ1bmRyYWlzaW5nJyxcclxuICAgICAgICAgICAgICAgICAgJ01hcmtldCBlbnRyeSB0aW1pbmcgcHJlY2VkZXMgZXhwZWN0ZWQgMjAyNiByZWd1bGF0b3J5IGhhcm1vbml6YXRpb24nXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICdBY2NlbGVyYXRlIGZsYWdzaGlwIHByb2plY3RzIHRocm91Z2ggc3RyYXRlZ2ljIHBhcnRuZXJzaGlwcyB3aXRoIE9FTXMnLFxyXG4gICAgICAgICAgICAgICAgICAnVGFyZ2V0IFExIDIwMjUgZm9yIFNlcmllcyBBIGNvbnZlcnNhdGlvbnMgd2l0aCBpbmZyYXN0cnVjdHVyZSBmdW5kcycsXHJcbiAgICAgICAgICAgICAgICAgICdEZXZlbG9wIEVTRyBuYXJyYXRpdmUgaGlnaGxpZ2h0aW5nIHN1c3RhaW5hYmlsaXR5IGFsaWdubWVudCcsXHJcbiAgICAgICAgICAgICAgICAgICdDb25zaWRlciBwcmUtc2VlZCByYWlzZSBvZiAkMy01TSB0byByZWFjaCBiZXRhL3BpbG90IG1pbGVzdG9uZXMnLFxyXG4gICAgICAgICAgICAgICAgICAnRXN0YWJsaXNoIGFkdmlzb3J5IGJvYXJkIHdpdGggcmVnaW9uYWwgbG9naXN0aWNzL21vYmlsaXR5IGV4ZWN1dGl2ZXMnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgaW52ZXN0b3JBcHBlYWw6IHtcclxuICAgICAgICAgICAgICAgICAgc3RyZW5ndGhzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ0RpdmVyc2lmaWVkIHJldmVudWUgc3RyZWFtcycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ0hpZ2gtZ3Jvd3RoIE1FTkEgbWFya2V0JyxcclxuICAgICAgICAgICAgICAgICAgICAnU3Ryb25nIGV4ZWN1dGlvbiBtZXRyaWNzJyxcclxuICAgICAgICAgICAgICAgICAgICAnR292ZXJubWVudCBtZWdhLXByb2plY3QgYWxpZ25tZW50J1xyXG4gICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICBjb25jZXJuczogW1xyXG4gICAgICAgICAgICAgICAgICAgICdDYXBpdGFsIHJlcXVpcmVtZW50cyBmb3IgbW9tZW50dW0nLFxyXG4gICAgICAgICAgICAgICAgICAgICdSZWd1bGF0b3J5IHVuY2VydGFpbnR5JyxcclxuICAgICAgICAgICAgICAgICAgICAnV2VsbC1mdW5kZWQgaW50ZXJuYXRpb25hbCBjb21wZXRpdGlvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgJ0xvY2FsaXphdGlvbiBjb21wbGV4aXR5J1xyXG4gICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICBvdmVyYWxsUmF0aW5nOiAnQXR0cmFjdGl2ZSAoQisvQS0pJyxcclxuICAgICAgICAgICAgICAgICAgdGFyZ2V0SW52ZXN0b3JzOiAnSW5mcmFzdHJ1Y3R1cmUgZnVuZHMsIGZhbWlseSBvZmZpY2VzLCBpbXBhY3QgaW52ZXN0b3JzJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRvbmU6ICdwcm9mZXNzaW9uYWwtb3B0aW1pc3RpYycsXHJcbiAgICAgICAgICAgICAgICBjb25maWRlbmNlOiA4OCxcclxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KG1vY2tSZXNwb25zZSkpXHJcbiAgICAgICAgICAgIH0sIDEyMDApIC8vIFNpbXVsYXRlIG5ldHdvcmsgZGVsYXlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NoYXRHUFQgQVBJIGVycm9yOicsIGVycm9yKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSkpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gQVBJOiBHZW5lcmF0ZSBSZXBvcnRcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9nZW5lcmF0ZS1yZXBvcnQnLCAocmVxLCByZXMpID0+IHtcclxuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNVxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0NBIFJlcG9ydCBnZW5lcmF0aW9uIHN0YXJ0ZWQnKVxyXG4gICAgICAgICAgICBjb25zdCB7IGZvcm1hdCA9ICdwZGYnLCBpbmNsdWRlQ2hhcnRzID0gdHJ1ZSwgc2VjdGlvbnMgPSBbXSB9ID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCByZXBvcnQgPSB7XHJcbiAgICAgICAgICAgICAgaWQ6IERhdGUubm93KCksXHJcbiAgICAgICAgICAgICAgdGl0bGU6ICdBSEsgU3RyYXRlZ2llcyBQZXJmb3JtYW5jZSBSZXBvcnQnLFxyXG4gICAgICAgICAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgZm9ybWF0LFxyXG4gICAgICAgICAgICAgIGluY2x1ZGVDaGFydHMsXHJcbiAgICAgICAgICAgICAgc2VjdGlvbnM6IHNlY3Rpb25zLmxlbmd0aCA+IDAgPyBzZWN0aW9ucyA6IFtcclxuICAgICAgICAgICAgICAgICdFeGVjdXRpdmUgU3VtbWFyeScsXHJcbiAgICAgICAgICAgICAgICAnUG9ydGZvbGlvIE92ZXJ2aWV3JyxcclxuICAgICAgICAgICAgICAgICdGaW5hbmNpYWwgTWV0cmljcycsXHJcbiAgICAgICAgICAgICAgICAnUHJvamVjdCBQcm9ncmVzcycsXHJcbiAgICAgICAgICAgICAgICAnQUkgSW5zaWdodHMnLFxyXG4gICAgICAgICAgICAgICAgJ1Jpc2sgQW5hbHlzaXMnLFxyXG4gICAgICAgICAgICAgICAgJ1N0cmF0ZWdpYyBSZWNvbW1lbmRhdGlvbnMnXHJcbiAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgcmVwb3J0VHlwZTogJ3N0cmF0ZWdpYy1kYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogJzEuMCcsXHJcbiAgICAgICAgICAgICAgICBwYWdlQ291bnQ6IDI0LFxyXG4gICAgICAgICAgICAgICAgYXV0aG9yOiAnQUhLIERhc2hib2FyZCBBSScsXHJcbiAgICAgICAgICAgICAgICBjb25maWRlbnRpYWxpdHk6ICdJbnRlcm5hbCBVc2UgT25seSdcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHN1bW1hcnk6IHtcclxuICAgICAgICAgICAgICAgIHRvdGFsUHJvamVjdHM6IDMsXHJcbiAgICAgICAgICAgICAgICBhY3RpdmVQcm9qZWN0czogMyxcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRpb25SYXRlOiAnNjclJyxcclxuICAgICAgICAgICAgICAgIHRvdGFsQnVkZ2V0OiAnJDIuOE0nLFxyXG4gICAgICAgICAgICAgICAgcHJvamVjdGVkUk9JOiAnMjQ1JScsXHJcbiAgICAgICAgICAgICAgICByaXNrTGV2ZWw6ICdNZWRpdW0nXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBkb3dubG9hZFVybDogYC9hcGkvZG93bmxvYWQtcmVwb3J0LyR7RGF0ZS5ub3coKX1gLFxyXG4gICAgICAgICAgICAgIGV4cGlyZXNBdDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHJlcG9ydCB9KSlcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDQ0EgUkVQT1JUIEdFTkVSQVRFRDonLCByZXBvcnQpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIEVycm9yIGdlbmVyYXRpbmcgcmVwb3J0OicsIGVycilcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IGVyci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIFJlcXVlc3Qgc3RyZWFtIGVycm9yOicsIGVycm9yKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1N0cmVhbSBlcnJvcicgfSkpXHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIEFQSTogUnVuIEFuYWx5c2lzIChEZWRpY2F0ZWQgZW5kcG9pbnQgZm9yIGFuYWx5dGljcyB0cmFja2luZylcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9ydW4tYW5hbHlzaXMnLCAocmVxLCByZXMpID0+IHtcclxuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNVxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNFXHVERDE2IEFJIEFuYWx5c2lzIHN0YXJ0ZWQnKVxyXG4gICAgICAgICAgICBjb25zdCB7IGFuYWx5c2lzVHlwZSA9ICdmdWxsJywgdHJpZ2dlciA9ICdtYW51YWwnIH0gPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9JylcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSB7XHJcbiAgICAgICAgICAgICAgaWQ6IGBBTkEtJHtEYXRlLm5vdygpfWAsXHJcbiAgICAgICAgICAgICAgdHlwZTogYW5hbHlzaXNUeXBlLFxyXG4gICAgICAgICAgICAgIHRyaWdnZXIsXHJcbiAgICAgICAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcclxuICAgICAgICAgICAgICBzdW1tYXJ5OiAnU3RyYXRlZ2ljIHBvcnRmb2xpbyBhbmFseXNpcyBjb21wbGV0ZS4gMyBhY3RpdmUgcHJvamVjdHMgd2l0aCA2NyUgdGFzayBjb21wbGV0aW9uIHJhdGUuIFN0cm9uZyBtb21lbnR1bSBpbiBRLVZBTiBhbmQgV09XIE1FTkEgaW5pdGlhdGl2ZXMuIFJlY29tbWVuZGVkOiBhY2NlbGVyYXRlIEVWLUxvZ2lzdGljcyBwYXJ0bmVyc2hpcHMuJyxcclxuICAgICAgICAgICAgICBpbnNpZ2h0czogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ1BvcnRmb2xpbyBIZWFsdGgnLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdwb3NpdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBbGwgMyBwcm9qZWN0cyBvbiB0cmFjayB3aXRoIHN0cm9uZyBleGVjdXRpb24gdmVsb2NpdHknLFxyXG4gICAgICAgICAgICAgICAgICBjb25maWRlbmNlOiA5MlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdSZXNvdXJjZSBBbGxvY2F0aW9uJyxcclxuICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnYXR0ZW50aW9uJyxcclxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1EtVkFOIHJlcXVpcmVzIGFkZGl0aW9uYWwgdGVjaG5pY2FsIHJlc291cmNlcyBpbiBRMSAyMDI2JyxcclxuICAgICAgICAgICAgICAgICAgY29uZmlkZW5jZTogODVcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnTWFya2V0IFRpbWluZycsXHJcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ3Bvc2l0aXZlJyxcclxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ01FTkEgbW9iaWxpdHkgc2VjdG9yIG1vbWVudHVtIGFsaWducyB3aXRoIHByb2plY3Qgcm9hZG1hcHMnLFxyXG4gICAgICAgICAgICAgICAgICBjb25maWRlbmNlOiA4OFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAnQWNjZWxlcmF0ZSBRLVZBTiBwYXJ0bmVyc2hpcCBkaXNjdXNzaW9ucyB3aXRoIE9FTXMnLFxyXG4gICAgICAgICAgICAgICAgJ0V4cGFuZCBXT1cgTUVOQSBwaWxvdCBzY29wZSB0byAyLTMgYWRkaXRpb25hbCBjaXRpZXMnLFxyXG4gICAgICAgICAgICAgICAgJ0NvbnNpZGVyIHByZS1zZWVkIGZ1bmRyYWlzaW5nICgkMy01TSkgdG8gbWFpbnRhaW4gdmVsb2NpdHknLFxyXG4gICAgICAgICAgICAgICAgJ0VzdGFibGlzaCBhZHZpc29yeSBib2FyZCB3aXRoIHJlZ2lvbmFsIGxvZ2lzdGljcyBleGVjdXRpdmVzJ1xyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgbWV0cmljczoge1xyXG4gICAgICAgICAgICAgICAgcHJvamVjdHNBbmFseXplZDogMyxcclxuICAgICAgICAgICAgICAgIHRhc2tzUmV2aWV3ZWQ6IDQ1LFxyXG4gICAgICAgICAgICAgICAgcmlza3NJZGVudGlmaWVkOiAyLFxyXG4gICAgICAgICAgICAgICAgb3Bwb3J0dW5pdGllc0ZvdW5kOiA3LFxyXG4gICAgICAgICAgICAgICAgZGF0YVBvaW50czogMTI3XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBuZXh0QWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgeyBwcmlvcml0eTogJ2hpZ2gnLCBhY3Rpb246ICdTY2hlZHVsZSBRLVZBTiBwYXJ0bmVyc2hpcCBjYWxscycsIGRlYWRsaW5lOiAnMjAyNS0xMS0xNScgfSxcclxuICAgICAgICAgICAgICAgIHsgcHJpb3JpdHk6ICdtZWRpdW0nLCBhY3Rpb246ICdEcmFmdCBXT1cgTUVOQSBleHBhbnNpb24gcHJvcG9zYWwnLCBkZWFkbGluZTogJzIwMjUtMTEtMzAnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHByaW9yaXR5OiAnbWVkaXVtJywgYWN0aW9uOiAnUHJlcGFyZSBpbnZlc3RvciBkZWNrJywgZGVhZGxpbmU6ICcyMDI1LTEyLTE1JyB9XHJcbiAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICBjb25maWRlbmNlOiA4OSxcclxuICAgICAgICAgICAgICBjb21wbGV0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6ICcxNS0zMCBzZWNvbmRzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCByZXN1bHRzIH0pKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRVx1REQxNiBBTkFMWVNJUyBDT01QTEVURTonLCByZXN1bHRzKVxyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBFcnJvciBydW5uaW5nIGFuYWx5c2lzOicsIGVycilcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IGVyci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIFJlcXVlc3Qgc3RyZWFtIGVycm9yOicsIGVycm9yKVxyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1N0cmVhbSBlcnJvcicgfSkpXHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIEFQSTogU2VuZCBFbWFpbCBSZXBvcnRcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zZW5kLWVtYWlsLXJlcG9ydCcsIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnTWV0aG9kIE5vdCBBbGxvd2VkJyB9KSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBib2R5ID0gJydcclxuICAgICAgICBcclxuICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsgfSlcclxuICAgICAgICBcclxuICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDRTcgRW1haWwgcmVwb3J0IHNlbmRpbmcuLi4nKVxyXG4gICAgICAgICAgICBjb25zdCB7IHJlY2lwaWVudCA9ICdhc2hyYWZAYWhrc3RyYXRlZ2llcy5jb20nLCByZXBvcnRUeXBlID0gJ2RhaWx5JyB9ID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCBlbWFpbFJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2VJZDogYE1TRy0ke0RhdGUubm93KCl9YCxcclxuICAgICAgICAgICAgICByZWNpcGllbnQsXHJcbiAgICAgICAgICAgICAgc3ViamVjdDogYEFISyBEYXNoYm9hcmQgJHtyZXBvcnRUeXBlfSBSZXBvcnQgLSAke25ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCl9YCxcclxuICAgICAgICAgICAgICBzZW50QXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICByZXBvcnRUeXBlLFxyXG4gICAgICAgICAgICAgIGF0dGFjaG1lbnRzOiBbXHJcbiAgICAgICAgICAgICAgICB7IGZpbGVuYW1lOiAnYWhrLXJlcG9ydC5wZGYnLCBzaXplOiAnMi40IE1CJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBmaWxlbmFtZTogJ21ldHJpY3Mtc3VtbWFyeS54bHN4Jywgc2l6ZTogJzE1NiBLQicgfVxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1JlcG9ydCBzdWNjZXNzZnVsbHkgc2VudCB2aWEgZW1haWwnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShlbWFpbFJlc3VsdCkpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0U3IEVNQUlMIFNFTlQ6JywgZW1haWxSZXN1bHQpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIEVycm9yIHNlbmRpbmcgZW1haWw6JywgZXJyKVxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBcclxuICAgICAgICByZXEub24oJ2Vycm9yJywgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgUmVxdWVzdCBzdHJlYW0gZXJyb3I6JywgZXJyb3IpXHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnU3RyZWFtIGVycm9yJyB9KSlcclxuICAgICAgICB9KVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gQVBJOiBSdW4gUmlzayBBbmFseXNpc1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3J1bi1yaXNrLWFuYWx5c2lzJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuayB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1MjZBMFx1RkUwRiBSaXNrIGFuYWx5c2lzIHN0YXJ0ZWQnKVxyXG4gICAgICAgICAgICBjb25zdCB7IHNjb3BlID0gJ3BvcnRmb2xpbycgfSA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3Qgcmlza1Jlc3VsdHMgPSB7XHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICBhbmFseXNpc0lkOiBgUklTSy0ke0RhdGUubm93KCl9YCxcclxuICAgICAgICAgICAgICBzY29wZSxcclxuICAgICAgICAgICAgICBjb21wbGV0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAgIG92ZXJhbGxSaXNrTGV2ZWw6ICdNZWRpdW0nLFxyXG4gICAgICAgICAgICAgIHJpc2tTY29yZTogNDIsIC8vIDAtMTAwIHNjYWxlXHJcbiAgICAgICAgICAgICAgY2F0ZWdvcmllczoge1xyXG4gICAgICAgICAgICAgICAgbWFya2V0OiB7IGxldmVsOiAnTWVkaXVtJywgc2NvcmU6IDQ1LCBjb25jZXJuczogWydSZWdpb25hbCBjb21wZXRpdGlvbicsICdSZWd1bGF0b3J5IGNoYW5nZXMnXSB9LFxyXG4gICAgICAgICAgICAgICAgZmluYW5jaWFsOiB7IGxldmVsOiAnTG93Jywgc2NvcmU6IDI4LCBjb25jZXJuczogWydDYXBpdGFsIGF2YWlsYWJpbGl0eSddIH0sXHJcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25hbDogeyBsZXZlbDogJ01lZGl1bScsIHNjb3JlOiA1MiwgY29uY2VybnM6IFsnUmVzb3VyY2UgY29uc3RyYWludHMnLCAnVGltZWxpbmUgcHJlc3N1cmVzJ10gfSxcclxuICAgICAgICAgICAgICAgIHRlY2huaWNhbDogeyBsZXZlbDogJ0xvdycsIHNjb3JlOiAzNSwgY29uY2VybnM6IFsnVGVjaG5vbG9neSBpbnRlZ3JhdGlvbiddIH0sXHJcbiAgICAgICAgICAgICAgICBzdHJhdGVnaWM6IHsgbGV2ZWw6ICdNZWRpdW0nLCBzY29yZTogNDgsIGNvbmNlcm5zOiBbJ1BhcnRuZXJzaGlwIGRlcGVuZGVuY2llcyddIH1cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHRvcFJpc2tzOiBbXHJcbiAgICAgICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgICBpZDogMSwgXHJcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnUmVndWxhdG9yeSB1bmNlcnRhaW50eSBpbiBNRU5BIG1hcmtldHMnLCBcclxuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6ICdIaWdoJywgXHJcbiAgICAgICAgICAgICAgICAgIHByb2JhYmlsaXR5OiAnTWVkaXVtJywgXHJcbiAgICAgICAgICAgICAgICAgIGltcGFjdDogJ1NpZ25pZmljYW50JyxcclxuICAgICAgICAgICAgICAgICAgbWl0aWdhdGlvbjogJ0VuZ2FnZSBwb2xpY3kgYWR2aXNvcnMsIGRpdmVyc2lmeSBhY3Jvc3MgbWFya2V0cydcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgICBpZDogMiwgXHJcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnQ29tcGV0aXRpb24gZnJvbSB3ZWxsLWZ1bmRlZCBpbnRlcm5hdGlvbmFsIHBsYXllcnMnLCBcclxuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6ICdNZWRpdW0nLCBcclxuICAgICAgICAgICAgICAgICAgcHJvYmFiaWxpdHk6ICdIaWdoJywgXHJcbiAgICAgICAgICAgICAgICAgIGltcGFjdDogJ01vZGVyYXRlJyxcclxuICAgICAgICAgICAgICAgICAgbWl0aWdhdGlvbjogJ0ZvY3VzIG9uIGxvY2FsaXphdGlvbiBhZHZhbnRhZ2VzLCBidWlsZCBzdHJhdGVnaWMgcGFydG5lcnNoaXBzJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICAgIGlkOiAzLCBcclxuICAgICAgICAgICAgICAgICAgdGl0bGU6ICdDYXBpdGFsIHJlcXVpcmVtZW50cyBleGNlZWRpbmcgY3VycmVudCBydW53YXknLCBcclxuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6ICdNZWRpdW0nLCBcclxuICAgICAgICAgICAgICAgICAgcHJvYmFiaWxpdHk6ICdNZWRpdW0nLCBcclxuICAgICAgICAgICAgICAgICAgaW1wYWN0OiAnU2lnbmlmaWNhbnQnLFxyXG4gICAgICAgICAgICAgICAgICBtaXRpZ2F0aW9uOiAnSW5pdGlhdGUgZnVuZHJhaXNpbmcgY29udmVyc2F0aW9ucyBRNCAyMDI1J1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAnRGV2ZWxvcCByaXNrIG1pdGlnYXRpb24gcGxheWJvb2sgZm9yIGVhY2ggbWFqb3IgY2F0ZWdvcnknLFxyXG4gICAgICAgICAgICAgICAgJ0VzdGFibGlzaCBxdWFydGVybHkgcmlzayByZXZpZXcgY2FkZW5jZScsXHJcbiAgICAgICAgICAgICAgICAnQ29uc2lkZXIgaW5zdXJhbmNlIHByb2R1Y3RzIGZvciBvcGVyYXRpb25hbCByaXNrcycsXHJcbiAgICAgICAgICAgICAgICAnQnVpbGQgY29udGluZ2VuY3kgcGxhbnMgZm9yIHRvcCAzIHJpc2tzJ1xyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1Jpc2sgYW5hbHlzaXMgZXhlY3V0ZWQgc3VjY2Vzc2Z1bGx5J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocmlza1Jlc3VsdHMpKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1MjZBMFx1RkUwRiBSSVNLIEFOQUxZU0lTIENPTVBMRVRFOicsIHJpc2tSZXN1bHRzLm92ZXJhbGxSaXNrTGV2ZWwpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIEVycm9yIHJ1bm5pbmcgcmlzayBhbmFseXNpczonLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBlcnIubWVzc2FnZSB9KSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJlcS5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBSZXF1ZXN0IHN0cmVhbSBlcnJvcjonLCBlcnJvcilcclxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdTdHJlYW0gZXJyb3InIH0pKVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICAvLyBBUEk6IEdldCBSZXBvcnQgVGV4dCAoZm9yIHZvaWNlIHJlYWRpbmcpXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvZ2V0LXJlcG9ydC10ZXh0JywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSB7XHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNVxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvcGxhaW4nKVxyXG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoJ01ldGhvZCBOb3QgQWxsb3dlZCcpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1RENENiBSZWFkaW5nIHJlcG9ydCB0ZXh0Li4uJylcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gR2VuZXJhdGUgYSBjb25jaXNlIHNwb2tlbiBzdW1tYXJ5IG9mIHRoZSBkYXNoYm9hcmRcclxuICAgICAgICAgIGNvbnN0IHJlcG9ydFN1bW1hcnkgPSBgXHJcbiAgICAgICAgICAgIEFISyBTdHJhdGVnaWVzIFBlcmZvcm1hbmNlIFJlcG9ydC4gXHJcbiAgICAgICAgICAgIEN1cnJlbnRseSBtYW5hZ2luZyB0aHJlZSBhY3RpdmUgc3RyYXRlZ2ljIHByb2plY3RzLiBcclxuICAgICAgICAgICAgUS1WQU4gYXV0b25vbW91cyB2ZWhpY2xlIG5ldHdvcmsgc2hvd2luZyBzdHJvbmcgZmVhc2liaWxpdHkgd2l0aCBwcm9qZWN0ZWQgSVJSIG9mIDI4IHBlcmNlbnQuIFxyXG4gICAgICAgICAgICBXT1cgTUVOQSBtaWNyby1tb2JpbGl0eSBwbGF0Zm9ybSBhZHZhbmNpbmcgdGhyb3VnaCByZWd1bGF0b3J5IGFwcHJvdmFsIHN0YWdlcy4gXHJcbiAgICAgICAgICAgIEVWIExvZ2lzdGljcyBpbmZyYXN0cnVjdHVyZSBzdHVkeSBpZGVudGlmeWluZyAyLjQgYmlsbGlvbiBkb2xsYXIgbWFya2V0IG9wcG9ydHVuaXR5LiBcclxuICAgICAgICAgICAgT3ZlcmFsbCBwb3J0Zm9saW8gaGVhbHRoIGlzIHBvc2l0aXZlIHdpdGggNjcgcGVyY2VudCB0YXNrIGNvbXBsZXRpb24gcmF0ZS4gXHJcbiAgICAgICAgICAgIFJlY29tbWVuZGVkIG5leHQgc3RlcHM6IGFjY2VsZXJhdGUgT0VNIHBhcnRuZXJzaGlwcywgZXhwYW5kIHBpbG90IHByb2dyYW1zIHRvIGFkZGl0aW9uYWwgY2l0aWVzLCBhbmQgaW5pdGlhdGUgU2VyaWVzIEEgZnVuZHJhaXNpbmcgY29udmVyc2F0aW9ucyBpbiBRMSAyMDI2LlxyXG4gICAgICAgICAgICBSaXNrIGxldmVsIGlzIG1lZGl1bSB3aXRoIHByaW1hcnkgY29uY2VybnMgYXJvdW5kIHJlZ3VsYXRvcnkgdW5jZXJ0YWludHkgYW5kIGNhcGl0YWwgcmVxdWlyZW1lbnRzLlxyXG4gICAgICAgICAgYC50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvcGxhaW4nKVxyXG4gICAgICAgICAgcmVzLmVuZChyZXBvcnRTdW1tYXJ5KVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0Q2IFJFUE9SVCBURVhUIFNFTlQgZm9yIFRUUycpXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgRXJyb3IgZ2VuZXJhdGluZyByZXBvcnQgdGV4dDonLCBlcnIpXHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvcGxhaW4nKVxyXG4gICAgICAgICAgcmVzLmVuZCgnRXJyb3IgZ2VuZXJhdGluZyByZXBvcnQgc3VtbWFyeScpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgLy8gUElMT1QgRU5EUE9JTlRTIC0gQ2xpZW50IExheWVyICsgRnVzaW9uICsgUmVwb3J0c1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgICAgLy8gQVBJOiBSZWdpc3RlciBDbGllbnRcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9yZWdpc3Rlci1jbGllbnQnLCAocmVxLCByZXMpID0+IHtcclxuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNVxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1BJTE9UXSBSZWdpc3RlciBjbGllbnQgcmVxdWVzdCcpXHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWVudERhdGEgPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9JylcclxuICAgICAgICAgICAgY29uc3QgeyBpZCwgbmFtZSwgaW5kdXN0cnksIGNvdW50cnksIHdlYnNpdGUsIG5vdGVzLCBzdGF0dXMgfSA9IGNsaWVudERhdGFcclxuXHJcbiAgICAgICAgICAgIGlmICghaWQgfHwgIW5hbWUpIHtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ01pc3NpbmcgcmVxdWlyZWQgZmllbGRzOiBpZCwgbmFtZScgfSkpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2RhdGEvY2xpZW50cy5qc29uJylcclxuICAgICAgICAgICAgbGV0IGNsaWVudHMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhmaWxlLCAndXRmOCcpKVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgY2xpZW50IGV4aXN0c1xyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0luZGV4ID0gY2xpZW50cy5maW5kSW5kZXgoYyA9PiBjLmlkID09PSBpZClcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWVudCA9IHtcclxuICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgIGluZHVzdHJ5OiBpbmR1c3RyeSB8fCAnTm90IHNwZWNpZmllZCcsXHJcbiAgICAgICAgICAgICAgY291bnRyeTogY291bnRyeSB8fCAnVW5rbm93bicsXHJcbiAgICAgICAgICAgICAgd2Vic2l0ZTogd2Vic2l0ZSB8fCAnJyxcclxuICAgICAgICAgICAgICBub3Rlczogbm90ZXMgfHwgJycsXHJcbiAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXMgfHwgJ3Byb3NwZWN0JyxcclxuICAgICAgICAgICAgICBjcmVhdGVkX2F0OiBleGlzdGluZ0luZGV4ID49IDAgPyBjbGllbnRzW2V4aXN0aW5nSW5kZXhdLmNyZWF0ZWRfYXQgOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0luZGV4ID49IDApIHtcclxuICAgICAgICAgICAgICAvLyBVcGRhdGUgZXhpc3RpbmdcclxuICAgICAgICAgICAgICBjbGllbnRzW2V4aXN0aW5nSW5kZXhdID0gY2xpZW50XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQSUxPVF0gQ2xpZW50IHVwZGF0ZWQ6JywgaWQpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gQWRkIG5ld1xyXG4gICAgICAgICAgICAgIGNsaWVudHMucHVzaChjbGllbnQpXHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQSUxPVF0gQ2xpZW50IGNyZWF0ZWQ6JywgaWQpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZSwgSlNPTi5zdHJpbmdpZnkoY2xpZW50cywgbnVsbCwgMikpXHJcblxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBjbGllbnQgfSkpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1BJTE9UXSBSZWdpc3RlciBjbGllbnQgZXJyb3I6JywgZXJyKVxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICAvLyBBUEk6IEF0dGFjaCBEb2N1bWVudFxyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2F0dGFjaC1kb2MnLCAocmVxLCByZXMpID0+IHtcclxuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNVxyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYm9keSA9ICcnXHJcbiAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rIH0pXHJcbiAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1BJTE9UXSBBdHRhY2ggZG9jdW1lbnQgcmVxdWVzdCcpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50X2lkLCB0aXRsZSwgdHlwZSwgcGF0aDogZG9jUGF0aCwgdGFncyB9ID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpXHJcblxyXG4gICAgICAgICAgICBpZiAoIWNsaWVudF9pZCB8fCAhdGl0bGUpIHtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ01pc3NpbmcgcmVxdWlyZWQgZmllbGRzOiBjbGllbnRfaWQsIHRpdGxlJyB9KSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgZmlsZSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvZGF0YS9jbGllbnRfZG9jc19pbmRleC5qc29uJylcclxuICAgICAgICAgICAgbGV0IGRvY3MgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhmaWxlLCAndXRmOCcpKVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZVxyXG4gICAgICAgICAgICBjb25zdCBleGlzdHMgPSBkb2NzLmZpbmQoZCA9PiBkLmNsaWVudF9pZCA9PT0gY2xpZW50X2lkICYmIGQudGl0bGUgPT09IHRpdGxlKVxyXG4gICAgICAgICAgICBpZiAoZXhpc3RzKSB7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcclxuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBkb2M6IGV4aXN0cywgbm90ZTogJ0RvY3VtZW50IGFscmVhZHkgZXhpc3RzJyB9KSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgZG9jID0ge1xyXG4gICAgICAgICAgICAgIGNsaWVudF9pZCxcclxuICAgICAgICAgICAgICB0aXRsZSxcclxuICAgICAgICAgICAgICB0eXBlOiB0eXBlIHx8ICdkb2N1bWVudCcsXHJcbiAgICAgICAgICAgICAgcGF0aDogZG9jUGF0aCB8fCAnJyxcclxuICAgICAgICAgICAgICB0YWdzOiB0YWdzIHx8IFtdLFxyXG4gICAgICAgICAgICAgIGFkZGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZG9jcy5wdXNoKGRvYylcclxuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlLCBKU09OLnN0cmluZ2lmeShkb2NzLCBudWxsLCAyKSlcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbUElMT1RdIERvY3VtZW50IGF0dGFjaGVkOicsIHRpdGxlKVxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBkb2MgfSkpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1BJTE9UXSBBdHRhY2ggZG9jdW1lbnQgZXJyb3I6JywgZXJyKVxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICAvLyBBUEk6IEZ1c2lvbiBBbmFseXNpc1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2Z1c2lvbi9hbmFseXplJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuayB9KVxyXG4gICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQSUxPVF0gRnVzaW9uIGFuYWx5c2lzIHJlcXVlc3QnKVxyXG4gICAgICAgICAgICBjb25zdCB7IGNsaWVudF9pZCwgc2NvcGUgPSAnZ2VuZXJhbCcsIHRvcF9uID0gNSB9ID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpXHJcblxyXG4gICAgICAgICAgICBpZiAoIWNsaWVudF9pZCkge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTWlzc2luZyByZXF1aXJlZCBmaWVsZDogY2xpZW50X2lkJyB9KSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTG9hZCBjbGllbnQgYW5kIGRvY3NcclxuICAgICAgICAgICAgY29uc3QgY2xpZW50c0ZpbGUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2RhdGEvY2xpZW50cy5qc29uJylcclxuICAgICAgICAgICAgY29uc3QgZG9jc0ZpbGUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2RhdGEvY2xpZW50X2RvY3NfaW5kZXguanNvbicpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCBjbGllbnRzID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoY2xpZW50c0ZpbGUsICd1dGY4JykpXHJcbiAgICAgICAgICAgIGNvbnN0IGFsbERvY3MgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhkb2NzRmlsZSwgJ3V0ZjgnKSlcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWVudCA9IGNsaWVudHMuZmluZChjID0+IGMuaWQgPT09IGNsaWVudF9pZClcclxuICAgICAgICAgICAgaWYgKCFjbGllbnQpIHtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNFxyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENsaWVudCBub3QgZm91bmQ6ICR7Y2xpZW50X2lkfWAgfSkpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBhbGxEb2NzLmZpbHRlcihkID0+IGQuY2xpZW50X2lkID09PSBjbGllbnRfaWQpXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1BJTE9UXSBSdW5uaW5nIGZ1c2lvbiBmb3I6JywgY2xpZW50Lm5hbWUsICd8IERvY3M6JywgZG9jcy5sZW5ndGgsICd8IFNjb3BlOicsIHNjb3BlKVxyXG5cclxuICAgICAgICAgICAgLy8gSW1wb3J0IGFuZCBydW4gZnVzaW9uIChkeW5hbWljIGltcG9ydCBmb3IgRVNNKVxyXG4gICAgICAgICAgICBjb25zdCBmdXNpb25Nb2R1bGUgPSBhd2FpdCBpbXBvcnQoJy4vc3JjL2FpL2Z1c2lvblJ1bm5lci5qcycpXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZ1c2lvbk1vZHVsZS5ydW5GdXNpb25BbmFseXNpcyh7IGNsaWVudCwgZG9jcywgc2NvcGUsIHRvcF9uIH0pXHJcblxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocmVzdWx0KSlcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbUElMT1RdIEZ1c2lvbiBhbmFseXNpcyBlcnJvcjonLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIEFQSTogR2VuZXJhdGUgUmVwb3J0XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvcmVwb3J0cy9nZW5lcmF0ZScsIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnTWV0aG9kIE5vdCBBbGxvd2VkJyB9KSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBib2R5ID0gJydcclxuICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsgfSlcclxuICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbUElMT1RdIFJlcG9ydCBnZW5lcmF0aW9uIHJlcXVlc3QnKVxyXG4gICAgICAgICAgICBjb25zdCB7IGNsaWVudF9pZCwgdGVtcGxhdGUgPSAnZXhlY3V0aXZlJywgZGVsaXZlciA9ICdkaXNwbGF5JyB9ID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpXHJcblxyXG4gICAgICAgICAgICBpZiAoIWNsaWVudF9pZCkge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTWlzc2luZyByZXF1aXJlZCBmaWVsZDogY2xpZW50X2lkJyB9KSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTG9hZCBjbGllbnRcclxuICAgICAgICAgICAgY29uc3QgY2xpZW50c0ZpbGUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2RhdGEvY2xpZW50cy5qc29uJylcclxuICAgICAgICAgICAgY29uc3QgY2xpZW50cyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNsaWVudHNGaWxlLCAndXRmOCcpKVxyXG4gICAgICAgICAgICBjb25zdCBjbGllbnQgPSBjbGllbnRzLmZpbmQoYyA9PiBjLmlkID09PSBjbGllbnRfaWQpXHJcblxyXG4gICAgICAgICAgICBpZiAoIWNsaWVudCkge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ2xpZW50IG5vdCBmb3VuZDogJHtjbGllbnRfaWR9YCB9KSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUnVuIGZ1c2lvbiBhbmFseXNpcyBmaXJzdCAoZ2V0IGxhdGVzdCBpbnNpZ2h0cylcclxuICAgICAgICAgICAgY29uc3QgZG9jc0ZpbGUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2RhdGEvY2xpZW50X2RvY3NfaW5kZXguanNvbicpXHJcbiAgICAgICAgICAgIGNvbnN0IGFsbERvY3MgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhkb2NzRmlsZSwgJ3V0ZjgnKSlcclxuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGFsbERvY3MuZmlsdGVyKGQgPT4gZC5jbGllbnRfaWQgPT09IGNsaWVudF9pZClcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZ1c2lvbk1vZHVsZSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvYWkvZnVzaW9uUnVubmVyLmpzJylcclxuICAgICAgICAgICAgY29uc3QgZnVzaW9uUmVzdWx0ID0gYXdhaXQgZnVzaW9uTW9kdWxlLnJ1bkZ1c2lvbkFuYWx5c2lzKHsgXHJcbiAgICAgICAgICAgICAgY2xpZW50LCBcclxuICAgICAgICAgICAgICBkb2NzLCBcclxuICAgICAgICAgICAgICBzY29wZTogdGVtcGxhdGUgPT09ICdpbnZlc3RvcicgPyAnaW52ZXN0b3InIDogdGVtcGxhdGUgPT09ICdyaXNrJyA/ICdyaXNrJyA6ICdnZW5lcmFsJyxcclxuICAgICAgICAgICAgICB0b3BfbjogNSBcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIGlmICghZnVzaW9uUmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1c2lvbiBhbmFseXNpcyBmYWlsZWQ6ICcgKyBmdXNpb25SZXN1bHQuZXJyb3IpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIEhUTUwgcmVwb3J0XHJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KClcclxuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBgJHtjbGllbnRfaWR9LSR7dGVtcGxhdGV9LSR7dGltZXN0YW1wfS5odG1sYFxyXG4gICAgICAgICAgICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYHNyYy9kYXRhL3JlcG9ydHMvJHtmaWxlbmFtZX1gKVxyXG5cclxuICAgICAgICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBnZW5lcmF0ZUhUTUxSZXBvcnQoY2xpZW50LCBmdXNpb25SZXN1bHQuZnVzaW9uLCB0ZW1wbGF0ZSlcclxuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhyZXBvcnRQYXRoLCBodG1sQ29udGVudClcclxuXHJcbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIEpTT04gc3VtbWFyeVxyXG4gICAgICAgICAgICBjb25zdCBzdW1tYXJ5UGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGBzcmMvZGF0YS9yZXBvcnRzLyR7Y2xpZW50X2lkfS0ke3RlbXBsYXRlfS0ke3RpbWVzdGFtcH0uanNvbmApXHJcbiAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSBnZW5lcmF0ZVJlcG9ydFN1bW1hcnkoY2xpZW50LCBmdXNpb25SZXN1bHQuZnVzaW9uLCB0ZW1wbGF0ZSlcclxuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhzdW1tYXJ5UGF0aCwgSlNPTi5zdHJpbmdpZnkoc3VtbWFyeSwgbnVsbCwgMikpXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1BJTE9UXSBSZXBvcnQgZ2VuZXJhdGVkOicsIGZpbGVuYW1lKVxyXG5cclxuICAgICAgICAgICAgLy8gSGFuZGxlIGRlbGl2ZXJ5XHJcbiAgICAgICAgICAgIGlmIChkZWxpdmVyID09PSAnZW1haWwnKSB7XHJcbiAgICAgICAgICAgICAgLy8gQ2FsbCBlbWFpbCBlbmRwb2ludFxyXG4gICAgICAgICAgICAgIGF3YWl0IGZldGNoKGBodHRwOi8vbG9jYWxob3N0OiR7c2VydmVyLmNvbmZpZy5zZXJ2ZXIucG9ydH0vYXBpL3JlcG9ydHMvZW1haWxgLCB7XHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxyXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwYXRoOiByZXBvcnRQYXRoIH0pXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICB1cmw6IGAvc3JjL2RhdGEvcmVwb3J0cy8ke2ZpbGVuYW1lfWAsXHJcbiAgICAgICAgICAgICAgc3VtbWFyeTogc3VtbWFyeS5leGVjdXRpdmVTdW1tYXJ5LFxyXG4gICAgICAgICAgICAgIGZpbGVuYW1lLFxyXG4gICAgICAgICAgICAgIHRlbXBsYXRlLFxyXG4gICAgICAgICAgICAgIGNsaWVudDogY2xpZW50Lm5hbWUsXHJcbiAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSlcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbUElMT1RdIFJlcG9ydCBnZW5lcmF0aW9uIGVycm9yOicsIGVycilcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gQVBJOiBFbWFpbCBSZXBvcnRcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9yZXBvcnRzL2VtYWlsJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuayB9KVxyXG4gICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQSUxPVF0gRW1haWwgcmVwb3J0IHJlcXVlc3QnKVxyXG4gICAgICAgICAgICBjb25zdCB7IHBhdGg6IHJlcG9ydFBhdGgsIHRvID0gJ2FzaHJhZkBhaGtzdHJhdGVnaWVzLmNvbScgfSA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKVxyXG5cclxuICAgICAgICAgICAgLy8gU1RVQjogRW1haWwgdHJhbnNwb3J0IG5vdCBpbXBsZW1lbnRlZCB5ZXRcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQSUxPVF0gRW1haWwgc3R1YiAtIHdvdWxkIHNlbmQ6JywgcmVwb3J0UGF0aCwgJ3RvOicsIHRvKVxyXG5cclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1JlcG9ydCBlbWFpbCBxdWV1ZWQgKHN0dWIpJyxcclxuICAgICAgICAgICAgICByZWNpcGllbnQ6IHRvLFxyXG4gICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQSUxPVF0gRW1haWwgcmVwb3J0IGVycm9yOicsIGVycilcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAvLyBHT09HTEUgRFJJVkUgQVBJIEVORFBPSU5UU1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR0VUIC9hcGkvZ29vZ2xlLWRyaXZlL3N0YXR1c1xyXG4gICAgICAgKiBSZXR1cm5zIGNvbm5lY3Rpb24gc3RhdHVzIGZvciBwZXJzb25hbCBhbmQgd29yayBkcml2ZXNcclxuICAgICAgICovXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvZ29vZ2xlLWRyaXZlL3N0YXR1cycsIChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbR09PR0xFIERSSVZFXSBTdGF0dXMgY2hlY2sgcmVxdWVzdCcpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBEeW5hbWljIGltcG9ydCB0byBhdm9pZCBidWlsZCBpc3N1ZXNcclxuICAgICAgICAgICAgY29uc3QgeyBnZXREcml2ZVN0YXR1cyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9pbnRlZ3JhdGlvbnMvZ29vZ2xlRHJpdmVMaW5rZXIuanMnKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgZ2V0RHJpdmVTdGF0dXMoKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgc3RhdHVzIH0pKVxyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tHT09HTEUgRFJJVkVdIFN0YXR1cyBjaGVjayBlcnJvcjonLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IFxyXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcclxuICAgICAgICAgICAgICBlcnJvcjogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgc3RhdHVzOiB7XHJcbiAgICAgICAgICAgICAgICBwZXJzb25hbDogeyBjb25uZWN0ZWQ6IGZhbHNlLCBlbW1hRm9sZGVyOiBudWxsIH0sXHJcbiAgICAgICAgICAgICAgICB3b3JrOiB7IGNvbm5lY3RlZDogZmFsc2UsIGVtbWFGb2xkZXI6IG51bGwgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSkoKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFBPU1QgL2FwaS9nb29nbGUtZHJpdmUvc3luY1xyXG4gICAgICAgKiBTeW5jcyBFbW1hIGtub3dsZWRnZSBmcm9tIGJvdGggcGVyc29uYWwgYW5kIHdvcmsgZHJpdmVzXHJcbiAgICAgICAqL1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2dvb2dsZS1kcml2ZS9zeW5jJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbR09PR0xFIERSSVZFXSBTeW5jIHJlcXVlc3QnKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRHluYW1pYyBpbXBvcnQgdG8gYXZvaWQgYnVpbGQgaXNzdWVzXHJcbiAgICAgICAgICAgIGNvbnN0IHsgc3luY0VtbWFLbm93bGVkZ2UgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvaW50ZWdyYXRpb25zL2dvb2dsZURyaXZlTGlua2VyLmpzJylcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IHN5bmNSZXN1bHRzID0gYXdhaXQgc3luY0VtbWFLbm93bGVkZ2UoKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tHT09HTEUgRFJJVkVdIFN5bmMgY29tcGxldGU6Jywgc3luY1Jlc3VsdHMpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBcclxuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcclxuICAgICAgICAgICAgICBzeW5jUmVzdWx0cyxcclxuICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbR09PR0xFIERSSVZFXSBTeW5jIGVycm9yOicsIGVycilcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxyXG4gICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICAgICBzeW5jUmVzdWx0czogW11cclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSkoKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFBPU1QgL2FwaS9lbW1hLXN5bmNcclxuICAgICAgICogVHJpZ2dlcnMgRW1tYSBtZW1vcnkgc3luYyBzY3JpcHQgKHN5bmNzIHRvIEdvb2dsZSBEcml2ZSlcclxuICAgICAgICovXHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvZW1tYS1zeW5jJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbRU1NQSBTWU5DXSBNYW51YWwgc3luYyB0cmlnZ2VyZWQnKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSW1wb3J0IGFuZCBydW4gc3luYyBkeW5hbWljYWxseVxyXG4gICAgICAgICAgICBjb25zdCB7IGV4ZWMgfSA9IGF3YWl0IGltcG9ydCgnY2hpbGRfcHJvY2VzcycpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSBhd2FpdCBpbXBvcnQoJ3V0aWwnKVxyXG4gICAgICAgICAgICBjb25zdCBleGVjQXN5bmMgPSBwcm9taXNpZnkoZXhlYylcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNBc3luYygnbm9kZSBzcmMvc2NyaXB0cy9lbW1hX3N5bmMuanMnKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHN0ZGVycikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tFTU1BIFNZTkNdIEVycm9yIG91dHB1dDonLCBzdGRlcnIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbRU1NQSBTWU5DXSBPdXRwdXQ6Jywgc3Rkb3V0KVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ0VtbWEgbWVtb3J5IHN5bmMgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgICAgICAgICAgb3V0cHV0OiBzdGRvdXQsXHJcbiAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0VNTUEgU1lOQ10gU3luYyBlcnJvcjonLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IFxyXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcclxuICAgICAgICAgICAgICBlcnJvcjogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ0VtbWEgc3luYyBmYWlsZWQuIENoZWNrIGNvbnNvbGUgZm9yIGRldGFpbHMuJ1xyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KSgpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlIEhUTUwgcmVwb3J0IGZyb20gZnVzaW9uIHJlc3VsdHNcclxuICovXHJcbmZ1bmN0aW9uIGdlbmVyYXRlSFRNTFJlcG9ydChjbGllbnQsIGZ1c2lvbiwgdGVtcGxhdGUpIHtcclxuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKClcclxuICBcclxuICBsZXQgaHRtbCA9IGBcclxuPCFET0NUWVBFIGh0bWw+XHJcbjxodG1sPlxyXG48aGVhZD5cclxuICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cclxuICA8dGl0bGU+JHt0ZW1wbGF0ZS50b1VwcGVyQ2FzZSgpfSBSZXBvcnQgLSAke2NsaWVudC5uYW1lfTwvdGl0bGU+XHJcbiAgPHN0eWxlPlxyXG4gICAgYm9keSB7IGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgbWFyZ2luOiA0MHB4OyBiYWNrZ3JvdW5kOiAjZjVmNWY1OyB9XHJcbiAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiA5MDBweDsgbWFyZ2luOiAwIGF1dG87IGJhY2tncm91bmQ6IHdoaXRlOyBwYWRkaW5nOiA0MHB4OyBib3gtc2hhZG93OiAwIDJweCAxMHB4IHJnYmEoMCwwLDAsMC4xKTsgfVxyXG4gICAgaDEgeyBjb2xvcjogIzFlNDBhZjsgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICMzYjgyZjY7IHBhZGRpbmctYm90dG9tOiAxMHB4OyB9XHJcbiAgICBoMiB7IGNvbG9yOiAjMzc0MTUxOyBtYXJnaW4tdG9wOiAzMHB4OyB9XHJcbiAgICAubWV0YSB7IGNvbG9yOiAjNmI3MjgwOyBmb250LXNpemU6IDE0cHg7IG1hcmdpbi1ib3R0b206IDIwcHg7IH1cclxuICAgIC5zZWN0aW9uIHsgbWFyZ2luOiAyMHB4IDA7IH1cclxuICAgIC5pbnNpZ2h0LCAucmlzaywgLm9wcG9ydHVuaXR5IHsgcGFkZGluZzogMTVweDsgbWFyZ2luOiAxMHB4IDA7IGJvcmRlci1sZWZ0OiA0cHggc29saWQ7IH1cclxuICAgIC5pbnNpZ2h0IHsgYmFja2dyb3VuZDogI2RiZWFmZTsgYm9yZGVyLWNvbG9yOiAjM2I4MmY2OyB9XHJcbiAgICAucmlzayB7IGJhY2tncm91bmQ6ICNmZWUyZTI7IGJvcmRlci1jb2xvcjogI2VmNDQ0NDsgfVxyXG4gICAgLm9wcG9ydHVuaXR5IHsgYmFja2dyb3VuZDogI2QxZmFlNTsgYm9yZGVyLWNvbG9yOiAjMTBiOTgxOyB9XHJcbiAgICAuY29uZmlkZW5jZSB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgcGFkZGluZzogMnB4IDhweDsgYm9yZGVyLXJhZGl1czogM3B4OyBmb250LXNpemU6IDEycHg7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XHJcbiAgICAuY29uZmlkZW5jZS1oaWdoIHsgYmFja2dyb3VuZDogIzEwYjk4MTsgY29sb3I6IHdoaXRlOyB9XHJcbiAgICAuY29uZmlkZW5jZS1tZWRpdW0geyBiYWNrZ3JvdW5kOiAjZjU5ZTBiOyBjb2xvcjogd2hpdGU7IH1cclxuICAgIC5jb25maWRlbmNlLWxvdyB7IGJhY2tncm91bmQ6ICM2YjcyODA7IGNvbG9yOiB3aGl0ZTsgfVxyXG4gIDwvc3R5bGU+XHJcbjwvaGVhZD5cclxuPGJvZHk+XHJcbiAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxyXG4gICAgPGgxPiR7dGVtcGxhdGUudG9VcHBlckNhc2UoKX0gQW5hbHlzaXMgUmVwb3J0PC9oMT5cclxuICAgIDxkaXYgY2xhc3M9XCJtZXRhXCI+XHJcbiAgICAgIDxzdHJvbmc+Q2xpZW50Ojwvc3Ryb25nPiAke2NsaWVudC5uYW1lfSAoJHtjbGllbnQuaW5kdXN0cnl9KTxicj5cclxuICAgICAgPHN0cm9uZz5Db3VudHJ5Ojwvc3Ryb25nPiAke2NsaWVudC5jb3VudHJ5fTxicj5cclxuICAgICAgPHN0cm9uZz5HZW5lcmF0ZWQ6PC9zdHJvbmc+ICR7bm93fTxicj5cclxuICAgICAgPHN0cm9uZz5BSSBQcm92aWRlcnM6PC9zdHJvbmc+ICR7ZnVzaW9uLnByb3ZpZGVycy5qb2luKCcsICcpfTxicj5cclxuICAgICAgPHN0cm9uZz5Db25zZW5zdXM6PC9zdHJvbmc+ICR7ZnVzaW9uLmNvbnNlbnN1cy5zdHJlbmd0aH0gKCR7ZnVzaW9uLmNvbnNlbnN1cy5wcm92aWRlcl9jb3VudH0gc291cmNlcylcclxuICAgIDwvZGl2PlxyXG5cclxuICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uXCI+XHJcbiAgICAgIDxoMj5LZXkgSW5zaWdodHM8L2gyPlxyXG4gICAgICAke2Z1c2lvbi5pbnNpZ2h0cy5tYXAoaXRlbSA9PiBgXHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImluc2lnaHRcIj5cclxuICAgICAgICAgIDxzdHJvbmc+JHtpdGVtLmluc2lnaHR9PC9zdHJvbmc+XHJcbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImNvbmZpZGVuY2UgY29uZmlkZW5jZS0ke2l0ZW0uY29uZmlkZW5jZX1cIj4ke2l0ZW0uY29uZmlkZW5jZS50b1VwcGVyQ2FzZSgpfTwvc3Bhbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgYCkuam9pbignJyl9XHJcbiAgICA8L2Rpdj5cclxuXHJcbiAgICA8ZGl2IGNsYXNzPVwic2VjdGlvblwiPlxyXG4gICAgICA8aDI+UmlzayBBbmFseXNpczwvaDI+XHJcbiAgICAgICR7ZnVzaW9uLnJpc2tzLm1hcChyaXNrID0+IGBcclxuICAgICAgICA8ZGl2IGNsYXNzPVwicmlza1wiPlxyXG4gICAgICAgICAgPHN0cm9uZz5bJHtyaXNrLnR5cGUudG9VcHBlckNhc2UoKX1dICR7cmlzay5kZXNjcmlwdGlvbn08L3N0cm9uZz48YnI+XHJcbiAgICAgICAgICA8ZW0+U2V2ZXJpdHk6ICR7cmlzay5zZXZlcml0eX08L2VtPjxicj5cclxuICAgICAgICAgIE1pdGlnYXRpb246ICR7cmlzay5taXRpZ2F0aW9ufVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICBgKS5qb2luKCcnKX1cclxuICAgIDwvZGl2PlxyXG5cclxuICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uXCI+XHJcbiAgICAgIDxoMj5Hcm93dGggT3Bwb3J0dW5pdGllczwvaDI+XHJcbiAgICAgICR7ZnVzaW9uLmdyb3d0aF9vcHMubWFwKG9wcCA9PiBgXHJcbiAgICAgICAgPGRpdiBjbGFzcz1cIm9wcG9ydHVuaXR5XCI+XHJcbiAgICAgICAgICA8c3Ryb25nPlske29wcC5jYXRlZ29yeS50b1VwcGVyQ2FzZSgpfV0gJHtvcHAuZGVzY3JpcHRpb259PC9zdHJvbmc+PGJyPlxyXG4gICAgICAgICAgPGVtPlBvdGVudGlhbDogJHtvcHAucG90ZW50aWFsfSB8IFRpbWVmcmFtZTogJHtvcHAudGltZWZyYW1lfTwvZW0+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIGApLmpvaW4oJycpfVxyXG4gICAgPC9kaXY+XHJcblxyXG4gICAgJHtmdXNpb24uaW52ZXN0b3JfYW5nbGVzICYmIGZ1c2lvbi5pbnZlc3Rvcl9hbmdsZXMubGVuZ3RoID4gMCA/IGBcclxuICAgICAgPGRpdiBjbGFzcz1cInNlY3Rpb25cIj5cclxuICAgICAgICA8aDI+SW52ZXN0b3IgUGVyc3BlY3RpdmU8L2gyPlxyXG4gICAgICAgICR7ZnVzaW9uLmludmVzdG9yX2FuZ2xlcy5tYXAoYW5nbGUgPT4gYFxyXG4gICAgICAgICAgPGRpdiBjbGFzcz1cImluc2lnaHRcIj5cclxuICAgICAgICAgICAgPHN0cm9uZz4ke2FuZ2xlLmFzcGVjdH06PC9zdHJvbmc+ICR7YW5nbGUuYW5hbHlzaXN9XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY29uZmlkZW5jZSBjb25maWRlbmNlLSR7YW5nbGUuY29uZmlkZW5jZSB8fCAnbWVkaXVtJ31cIj4keyhhbmdsZS5jb25maWRlbmNlIHx8ICdtZWRpdW0nKS50b1VwcGVyQ2FzZSgpfTwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIGApLmpvaW4oJycpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgIGAgOiAnJ31cclxuXHJcbiAgICA8ZGl2IGNsYXNzPVwibWV0YVwiIHN0eWxlPVwibWFyZ2luLXRvcDogNDBweDsgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlNWU3ZWI7IHBhZGRpbmctdG9wOiAyMHB4O1wiPlxyXG4gICAgICA8c3Ryb25nPkFISyBTdHJhdGVnaWVzPC9zdHJvbmc+IHwgQ29uZmlkZW50aWFsICYgUHJvcHJpZXRhcnk8YnI+XHJcbiAgICAgIEdlbmVyYXRlZCBieSBFbW1hIEFJIEZ1c2lvbiBFbmdpbmVcclxuICAgIDwvZGl2PlxyXG4gIDwvZGl2PlxyXG48L2JvZHk+XHJcbjwvaHRtbD5cclxuICBgLnRyaW0oKVxyXG4gIFxyXG4gIHJldHVybiBodG1sXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZSByZXBvcnQgc3VtbWFyeSBmb3IgSlNPTiBzdG9yYWdlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZW5lcmF0ZVJlcG9ydFN1bW1hcnkoY2xpZW50LCBmdXNpb24sIHRlbXBsYXRlKSB7XHJcbiAgY29uc3QgdG9wSW5zaWdodHMgPSBmdXNpb24uaW5zaWdodHMuc2xpY2UoMCwgMykubWFwKGkgPT4gaS5pbnNpZ2h0KVxyXG4gIGNvbnN0IHRvcFJpc2tzID0gZnVzaW9uLnJpc2tzLnNsaWNlKDAsIDMpLm1hcChyID0+IHIuZGVzY3JpcHRpb24pXHJcbiAgY29uc3QgdG9wT3BwcyA9IGZ1c2lvbi5ncm93dGhfb3BzLnNsaWNlKDAsIDMpLm1hcChvID0+IG8uZGVzY3JpcHRpb24pXHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIGNsaWVudDogY2xpZW50Lm5hbWUsXHJcbiAgICBjbGllbnRfaWQ6IGNsaWVudC5pZCxcclxuICAgIHRlbXBsYXRlLFxyXG4gICAgZ2VuZXJhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICBleGVjdXRpdmVTdW1tYXJ5OiBgQW5hbHlzaXMgZm9yICR7Y2xpZW50Lm5hbWV9ICgke2NsaWVudC5pbmR1c3RyeX0pIHJldmVhbHMgJHtmdXNpb24uaW5zaWdodHMubGVuZ3RofSBrZXkgaW5zaWdodHMsICR7ZnVzaW9uLnJpc2tzLmxlbmd0aH0gcmlzayBmYWN0b3JzLCBhbmQgJHtmdXNpb24uZ3Jvd3RoX29wcy5sZW5ndGh9IGdyb3d0aCBvcHBvcnR1bml0aWVzLiBDb25zZW5zdXMgc3RyZW5ndGggaXMgJHtmdXNpb24uY29uc2Vuc3VzLnN0cmVuZ3RofSBiYXNlZCBvbiAke2Z1c2lvbi5jb25zZW5zdXMucHJvdmlkZXJfY291bnR9IEFJIHByb3ZpZGVycy5gLFxyXG4gICAgaGlnaGxpZ2h0czoge1xyXG4gICAgICBpbnNpZ2h0czogdG9wSW5zaWdodHMsXHJcbiAgICAgIHJpc2tzOiB0b3BSaXNrcyxcclxuICAgICAgb3Bwb3J0dW5pdGllczogdG9wT3Bwc1xyXG4gICAgfSxcclxuICAgIGNvbnNlbnN1czogZnVzaW9uLmNvbnNlbnN1cyxcclxuICAgIHByb3ZpZGVyczogZnVzaW9uLnByb3ZpZGVyc1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFBhcnNlIEhUTUwgcmVwb3J0IGZvciBmaW5hbmNpYWwgS1BJc1xyXG4gKiBTaW1wbGUgcmVnZXgtYmFzZWQgZXh0cmFjdGlvbiAoY2FuIGJlIGVuaGFuY2VkIHdpdGggQ2hlZXJpbyBpZiBuZWVkZWQpXHJcbiAqL1xyXG5mdW5jdGlvbiBwYXJzZUhUTUxSZXBvcnQoaHRtbCwgZmlsZW5hbWUpIHtcclxuICBjb25zdCBrcGlzID0ge1xyXG4gICAgcHJvamVjdE5hbWU6IGZpbGVuYW1lLnJlcGxhY2UoJy5odG1sJywgJycpLnJlcGxhY2UoLy0vZywgJyAnKSxcclxuICAgIGlycjogZXh0cmFjdEtQSShodG1sLCAvSVJSWzpcXHNdKihbMC05Ll0rKSUvaSksXHJcbiAgICB0b3RhbEludmVzdG1lbnQ6IGV4dHJhY3RLUEkoaHRtbCwgL1RvdGFsIEludmVzdG1lbnRbOlxcc10qXFwkPyhbMC05LC5dKylNPy9pKSxcclxuICAgIHJldmVudWU6IGV4dHJhY3RLUEkoaHRtbCwgL1JldmVudWVbOlxcc10qXFwkPyhbMC05LC5dKylNPy9pKSxcclxuICAgIGViaXRkYTogZXh0cmFjdEtQSShodG1sLCAvRUJJVERBWzpcXHNdKlxcJD8oWzAtOSwuXSspTT8vaSksXHJcbiAgICBjYWdyOiBleHRyYWN0S1BJKGh0bWwsIC9DQUdSWzpcXHNdKihbMC05Ll0rKSUvaSksXHJcbiAgICBwYXliYWNrUGVyaW9kOiBleHRyYWN0S1BJKGh0bWwsIC9QYXliYWNrIFBlcmlvZFs6XFxzXSooWzAtOS5dKylcXHMqeWVhcnM/L2kpLFxyXG4gICAgbnB2OiBleHRyYWN0S1BJKGh0bWwsIC9OUFZbOlxcc10qXFwkPyhbMC05LC5dKylNPy9pKVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIG1ldGFkYXRhXHJcbiAga3Bpcy5leHRyYWN0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICBrcGlzLmNvbmZpZGVuY2UgPSBjYWxjdWxhdGVDb25maWRlbmNlKGtwaXMpXHJcblxyXG4gIHJldHVybiBrcGlzXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFeHRyYWN0IHNpbmdsZSBLUEkgdXNpbmcgcmVnZXhcclxuICovXHJcbmZ1bmN0aW9uIGV4dHJhY3RLUEkoaHRtbCwgcmVnZXgpIHtcclxuICBjb25zdCBtYXRjaCA9IGh0bWwubWF0Y2gocmVnZXgpXHJcbiAgaWYgKG1hdGNoICYmIG1hdGNoWzFdKSB7XHJcbiAgICAvLyBDbGVhbiB1cCBudW1iZXIgZm9ybWF0dGluZ1xyXG4gICAgY29uc3QgdmFsdWUgPSBtYXRjaFsxXS5yZXBsYWNlKC8sL2csICcnKVxyXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpIHx8IG1hdGNoWzFdXHJcbiAgfVxyXG4gIHJldHVybiBudWxsXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGUgY29uZmlkZW5jZSBzY29yZSBiYXNlZCBvbiBob3cgbWFueSBLUElzIHdlcmUgZm91bmRcclxuICovXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZUNvbmZpZGVuY2Uoa3Bpcykge1xyXG4gIGNvbnN0IHRvdGFsRmllbGRzID0gNyAvLyBOdW1iZXIgb2YgS1BJIGZpZWxkc1xyXG4gIGNvbnN0IGZvdW5kRmllbGRzID0gT2JqZWN0LnZhbHVlcyhrcGlzKS5maWx0ZXIodiA9PiB2ICE9PSBudWxsKS5sZW5ndGhcclxuICByZXR1cm4gTWF0aC5yb3VuZCgoZm91bmRGaWVsZHMgLyB0b3RhbEZpZWxkcykgKiAxMDApXHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFlQSxTQUFTLE1BQU0sSUFBSTtBQUNqQixTQUFPLElBQUksUUFBUSxhQUFXLFdBQVcsU0FBUyxFQUFFLENB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dUJBQXVCO0FBQUEsSUFDOUMsZUFBZSxXQUFXLE1BQU0seUNBQXlDO0FBQUEsSUFDekUsS0FBSyxXQUFXLE1BQU0sMkJBQTJCO0FBQUEsRUFDbkQ7QUFHQSxPQUFLLGFBQVksb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFDeEMsT0FBSyxhQUFhQyxxQkFBb0IsSUFBSTtBQUUxQyxTQUFPO0FBQ1Q7QUFLQSxTQUFTLFdBQVcsTUFBTSxPQUFPO0FBQy9CLFFBQU0sUUFBUSxLQUFLLE1BQU0sS0FBSztBQUM5QixNQUFJLFNBQVMsTUFBTSxDQUFDLEdBQUc7QUFFckIsVUFBTSxRQUFRLE1BQU0sQ0FBQyxFQUFFLFFBQVEsTUFBTSxFQUFFO0FBQ3ZDLFdBQU8sV0FBVyxLQUFLLEtBQUssTUFBTSxDQUFDO0FBQUEsRUFDckM7QUFDQSxTQUFPO0FBQ1Q7QUFLQSxTQUFTQSxxQkFBb0IsTUFBTTtBQUNqQyxRQUFNLGNBQWM7QUFDcEIsUUFBTSxjQUFjLE9BQU8sT0FBTyxJQUFJLEVBQUUsT0FBTyxPQUFLLE1BQU0sSUFBSSxFQUFFO0FBQ2hFLFNBQU8sS0FBSyxNQUFPLGNBQWMsY0FBZSxHQUFHO0FBQ3JEOyIsCiAgIm5hbWVzIjogWyJnZXREcml2ZVN0YXR1cyIsICJzeW5jRW1tYUtub3dsZWRnZSIsICJjYWxjdWxhdGVDb25maWRlbmNlIl0KfQo=
