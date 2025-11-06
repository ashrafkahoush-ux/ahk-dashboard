/**
 * Emma's Cognitive Core v5
 * Self-learning intelligence with log summarization and style reinforcement
 * Browser-based implementation using localStorage
 */

const INTERACTION_LOG_KEY = 'emma-interaction-log';
const STYLE_MODEL_KEY = 'emma-style-model';
const KNOWLEDGE_BASE_KEY = 'emma-knowledge-base';
const MAX_LOG_ENTRIES = 500;

/**
 * Log a command interaction for learning
 */
export function logInteraction(entry) {
  try {
    const stored = localStorage.getItem(INTERACTION_LOG_KEY);
    const data = stored ? JSON.parse(stored) : [];
    
    data.push({
      ...entry,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId()
    });
    
    // Keep last 500 interactions
    if (data.length > MAX_LOG_ENTRIES) {
      data.splice(0, data.length - MAX_LOG_ENTRIES);
    }
    
    localStorage.setItem(INTERACTION_LOG_KEY, JSON.stringify(data));
    console.log('🧠 Emma logged interaction:', entry.command);
  } catch (error) {
    console.warn('Emma Core: Failed to log interaction', error);
  }
}

/**
 * Analyze last 50 interactions and extract insights
 */
export function summarizeLogs() {
  try {
    const stored = localStorage.getItem(INTERACTION_LOG_KEY);
    if (!stored) return getEmptySummary();
    
    const logs = JSON.parse(stored);
    const last50 = logs.slice(-50);
    
    if (last50.length === 0) return getEmptySummary();
    
    // Command frequency analysis
    const commands = {};
    const hours = {};
    const contexts = {};
    let accepted = 0;
    let rejected = 0;
    
    last50.forEach(log => {
      // Count commands
      if (log.command) {
        commands[log.command] = (commands[log.command] || 0) + 1;
      }
      
      // Track peak hours
      const hour = new Date(log.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
      
      // Track contexts
      if (log.context) {
        contexts[log.context] = (contexts[log.context] || 0) + 1;
      }
      
      // Acceptance rate
      if (log.accepted === true) accepted++;
      if (log.accepted === false) rejected++;
    });
    
    // Find top patterns
    const topCommand = Object.entries(commands)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
    
    const peakHour = Object.entries(hours)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    
    const topContext = Object.entries(contexts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "general";
    
    const totalResponses = accepted + rejected;
    const acceptance = totalResponses > 0 
      ? ((accepted / totalResponses) * 100).toFixed(1)
      : "N/A";
    
    // Generate insight
    const insight = `Most used: "${topCommand}", best time: ${peakHour}:00, acceptance ${acceptance}%, favorite context: ${topContext}`;
    
    return {
      total: last50.length,
      topCommand,
      peakHour,
      topContext,
      acceptance,
      accepted,
      rejected,
      insight,
      commandFrequency: commands,
      hourlyActivity: hours
    };
  } catch (error) {
    console.warn('Emma Core: Failed to summarize logs', error);
    return getEmptySummary();
  }
}

/**
 * Empty summary fallback
 */
function getEmptySummary() {
  return {
    total: 0,
    topCommand: "None",
    peakHour: "N/A",
    topContext: "general",
    acceptance: "N/A",
    accepted: 0,
    rejected: 0,
    insight: "No interactions logged yet",
    commandFrequency: {},
    hourlyActivity: {}
  };
}

/**
 * Update Emma's communication style based on acceptance rate
 */
export function updateStyleModel() {
  try {
    const summary = summarizeLogs();
    const acceptanceRate = parseFloat(summary.acceptance) || 0;
    
    let styleProfile;
    if (acceptanceRate > 80) {
      styleProfile = "warm-concise";
    } else if (acceptanceRate > 60) {
      styleProfile = "neutral-supportive";
    } else if (acceptanceRate > 40) {
      styleProfile = "short-direct";
    } else {
      styleProfile = "minimal-practical";
    }
    
    const model = {
      current: styleProfile,
      acceptanceRate,
      lastUpdate: new Date().toISOString(),
      adjustments: {
        verbosity: acceptanceRate > 70 ? "moderate" : "minimal",
        empathy: acceptanceRate > 60 ? "high" : "medium",
        proactivity: acceptanceRate > 75 ? "high" : "low"
      }
    };
    
    localStorage.setItem(STYLE_MODEL_KEY, JSON.stringify(model));
    console.log('🎯 Emma style updated:', styleProfile, `(${acceptanceRate}% acceptance)`);
    
    return model;
  } catch (error) {
    console.warn('Emma Core: Failed to update style model', error);
    return getDefaultStyleModel();
  }
}

/**
 * Recall current communication style
 */
export function recallStyle() {
  try {
    const stored = localStorage.getItem(STYLE_MODEL_KEY);
    if (stored) {
      const model = JSON.parse(stored);
      return model.current;
    }
  } catch (error) {
    console.warn('Emma Core: Failed to recall style', error);
  }
  return "warm-concise"; // Default
}

/**
 * Get full style model with adjustments
 */
export function getStyleModel() {
  try {
    const stored = localStorage.getItem(STYLE_MODEL_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Emma Core: Failed to get style model', error);
  }
  return getDefaultStyleModel();
}

/**
 * Default style model
 */
function getDefaultStyleModel() {
  return {
    current: "expressive-engaging",
    acceptanceRate: 0,
    lastUpdate: new Date().toISOString(),
    adjustments: {
      verbosity: "expressive",
      empathy: "high",
      proactivity: "high"
    }
  };
}

/**
 * Save a fact to Emma's knowledge base
 */
export function saveFact(fact) {
  try {
    const stored = localStorage.getItem(KNOWLEDGE_BASE_KEY);
    const data = stored ? JSON.parse(stored) : [];
    
    data.push({
      ...fact,
      date: new Date().toISOString(),
      sessionId: getSessionId()
    });
    
    // Keep last 200 facts
    if (data.length > 200) {
      data.splice(0, data.length - 200);
    }
    
    localStorage.setItem(KNOWLEDGE_BASE_KEY, JSON.stringify(data));
    console.log('📚 Emma learned:', fact.topic || fact.type);
  } catch (error) {
    console.warn('Emma Core: Failed to save fact', error);
  }
}

/**
 * Fetch web updates (browser-friendly alternative)
 */
export async function fetchWebUpdate(topic) {
  try {
    // For browser environment, we'll simulate learning from context
    // In production, this could call a proxy API
    const info = `Learning about: ${topic}`;
    saveFact({ 
      topic, 
      info,
      source: 'context-aware',
      type: 'web-update'
    });
    return info;
  } catch (error) {
    console.warn('Emma Core: Failed to fetch web update', error);
    return null;
  }
}

/**
 * Get session ID for tracking
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('emma-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('emma-session-id', sessionId);
  }
  return sessionId;
}

/**
 * Get learning insights dashboard
 */
export function getLearningInsights() {
  const summary = summarizeLogs();
  const styleModel = getStyleModel();
  
  return {
    summary,
    styleModel,
    recommendations: generateRecommendations(summary, styleModel)
  };
}

/**
 * Generate proactive recommendations based on learning
 */
function generateRecommendations(summary, styleModel) {
  const recommendations = [];
  
  // Peak hour recommendation
  if (summary.peakHour !== "N/A") {
    recommendations.push({
      type: 'timing',
      priority: 'high',
      message: `Your peak productivity is at ${summary.peakHour}:00 - I'll be more proactive during this time`,
      action: 'timing-optimization'
    });
  }
  
  // Top command shortcut
  if (summary.topCommand !== "None") {
    recommendations.push({
      type: 'efficiency',
      priority: 'medium',
      message: `You frequently use "${summary.topCommand}" - consider adding a quick action`,
      action: 'create-shortcut'
    });
  }
  
  // Style adjustment
  if (styleModel.acceptanceRate < 60) {
    recommendations.push({
      type: 'communication',
      priority: 'high',
      message: `Adjusting to ${styleModel.current} style to better match your preferences`,
      action: 'style-adjustment'
    });
  }
  
  // Proactivity level
  if (summary.accepted > 10 && styleModel.adjustments.proactivity === 'low') {
    recommendations.push({
      type: 'engagement',
      priority: 'medium',
      message: `Your engagement is strong - enabling more proactive suggestions`,
      action: 'increase-proactivity'
    });
  }
  
  return recommendations;
}

/**
 * Reset learning data (for debugging or user request)
 */
export function resetLearning() {
  try {
    localStorage.removeItem(INTERACTION_LOG_KEY);
    localStorage.removeItem(STYLE_MODEL_KEY);
    localStorage.removeItem(KNOWLEDGE_BASE_KEY);
    console.log('🔄 Emma learning data reset');
    return true;
  } catch (error) {
    console.warn('Emma Core: Failed to reset learning', error);
    return false;
  }
}

/**
 * Export all learning data
 */
export function exportLearningData() {
  return {
    interactions: JSON.parse(localStorage.getItem(INTERACTION_LOG_KEY) || '[]'),
    styleModel: JSON.parse(localStorage.getItem(STYLE_MODEL_KEY) || '{}'),
    knowledge: JSON.parse(localStorage.getItem(KNOWLEDGE_BASE_KEY) || '[]'),
    exportDate: new Date().toISOString()
  };
}
