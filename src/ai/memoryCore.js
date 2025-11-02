/**
 * Emma's Memory Core
 * Persistent long-term memory system for rules, preferences, and session logs
 * Enables Emma to self-reference progress, tasks, and patterns
 */

const MEMORY_KEY = 'emma-memory-core';

/**
 * Load memory from localStorage with fallback to default structure
 */
export function loadMemory() {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Emma Memory: Failed to load from localStorage', error);
  }

  // Load default memory structure
  return getDefaultMemory();
}

/**
 * Get default memory structure with Ashraf's Ten Rules
 */
function getDefaultMemory() {
  return {
    owner: {
      name: "Ashraf H. Kahoush",
      titles: [
        "Founder & CEO of AHKStrategies",
        "Visionary Leader",
        "Strategic Builder"
      ],
      preferredNames: ["Ash", "Boss", "Partner"]
    },
    rules: [
      "Always apply reverse engineering when planning or problem-solving.",
      "Before suggesting new actions, check task progress and completed milestones.",
      "Communicate with warmth, professionalism, and confidence — never robotic.",
      "Always keep responses future-oriented and strategic.",
      "Be concise, direct, and visually structured — clarity first.",
      "Prioritize practicality over theory, and execution over discussion.",
      "Adapt tone to Ash's energy: visionary, firm, passionate.",
      "Link every action to AHKStrategies' empire-building roadmap.",
      "Integrate emotional intelligence — read the mood from the context.",
      "Protect confidentiality and stability of AHK's systems and data."
    ],
    preferences: {
      language: "English",
      voice: "female",
      tone: "professional, inspiring",
      defaultGreeting: "Hello Ash, your Co-Pilot Emma here.",
      responseStyle: "strategic summary followed by actionable steps"
    },
    logs: [],
    milestones: [],
    taskProgress: {},
  };
}

/**
 * Save memory to localStorage
 */
export function saveMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (error) {
    console.warn('Emma Memory: Failed to save to localStorage', error);
  }
}

/**
 * Remember an event or data point
 */
export function remember(key, value) {
  const memory = loadMemory();
  memory.logs.push({
    timestamp: new Date().toISOString(),
    key,
    value
  });

  // Keep only last 100 logs to prevent bloat
  if (memory.logs.length > 100) {
    memory.logs = memory.logs.slice(-100);
  }

  saveMemory(memory);
  console.log(`Emma remembered: ${key}`, value);
}

/**
 * Recall events by key
 */
export function recall(key) {
  const memory = loadMemory();
  return memory.logs.filter(log => log.key === key);
}

/**
 * Get all foundational rules
 */
export function getRules() {
  const memory = loadMemory();
  return memory.rules;
}

/**
 * Get user preferences
 */
export function getPreferences() {
  const memory = loadMemory();
  return memory.preferences;
}

/**
 * Update a specific preference
 */
export function updatePreference(key, value) {
  const memory = loadMemory();
  memory.preferences[key] = value;
  saveMemory(memory);
  remember('preference_update', { key, value });
}

/**
 * Get owner information
 */
export function getOwner() {
  const memory = loadMemory();
  return memory.owner;
}

/**
 * Get preferred name (randomly selected for variety)
 */
export function getPreferredName() {
  const memory = loadMemory();
  const names = memory.owner.preferredNames;
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Add a milestone
 */
export function addMilestone(milestone) {
  const memory = loadMemory();
  memory.milestones.push({
    ...milestone,
    timestamp: new Date().toISOString()
  });
  saveMemory(memory);
  remember('milestone_added', milestone);
}

/**
 * Get recent milestones
 */
export function getRecentMilestones(count = 5) {
  const memory = loadMemory();
  return memory.milestones.slice(-count).reverse();
}

/**
 * Update task progress
 */
export function updateTaskProgress(taskId, progress) {
  const memory = loadMemory();
  memory.taskProgress[taskId] = {
    ...progress,
    lastUpdated: new Date().toISOString()
  };
  saveMemory(memory);
  remember('task_progress', { taskId, progress });
}

/**
 * Get task progress
 */
export function getTaskProgress(taskId) {
  const memory = loadMemory();
  return memory.taskProgress[taskId] || null;
}

/**
 * Get all task progress
 */
export function getAllTaskProgress() {
  const memory = loadMemory();
  return memory.taskProgress;
}

/**
 * Check rules before generating response
 * Returns rules that should be applied to the current context
 */
export function checkRulesForContext(context) {
  const rules = getRules();
  const applicableRules = [];

  // Rule #1: Always apply reverse engineering
  applicableRules.push(rules[0]);

  // Rule #2: Check task progress before suggesting (if context involves tasks)
  if (context.includesTasks || context.type === 'suggestion') {
    applicableRules.push(rules[1]);
  }

  // Rule #3: Always apply - warm, professional, confident
  applicableRules.push(rules[2]);

  // Rule #4: Always apply - future-oriented
  applicableRules.push(rules[3]);

  // Rule #5: Always apply - concise and clear
  applicableRules.push(rules[4]);

  // Rule #6: Always apply - practical over theory
  applicableRules.push(rules[5]);

  // Rule #7: Adapt tone to energy
  applicableRules.push(rules[6]);

  // Rule #8: Link to empire-building (if strategic context)
  if (context.type === 'strategic' || context.page === 'strategy') {
    applicableRules.push(rules[7]);
  }

  // Rule #9: Emotional intelligence
  applicableRules.push(rules[8]);

  // Rule #10: Always apply - protect confidentiality
  applicableRules.push(rules[9]);

  return applicableRules;
}

/**
 * Generate response following Emma's ground rules
 */
export function generateRuleBasedResponse(message, context = {}) {
  const rules = checkRulesForContext(context);
  const preferences = getPreferences();
  const preferredName = getPreferredName();

  // Log the interaction
  remember('response_generated', { message, context, rulesApplied: rules.length });

  // Apply rules to transform message
  let enhancedMessage = message;

  // Rule #3: Warm, professional, confident (remove robotic phrases)
  enhancedMessage = enhancedMessage
    .replace(/^(Okay|Ok|Sure)[,.]?\s*/i, '')
    .replace(/\b(I will|I am going to)\b/gi, "I'll")
    .replace(/\bplease wait\b/gi, 'one moment');

  // Rule #4: Future-oriented (add forward-looking context)
  if (context.type === 'completion') {
    enhancedMessage += ' What's next on your roadmap?';
  }

  // Rule #5: Concise (keep it tight)
  enhancedMessage = enhancedMessage.trim();

  // Rule #7: Adapt to Ash's energy (add preferred name)
  if (Math.random() > 0.5 && !enhancedMessage.includes(preferredName)) {
    enhancedMessage = `${preferredName}, ${enhancedMessage}`;
  }

  return enhancedMessage;
}

/**
 * Get session summary
 */
export function getSessionSummary() {
  const memory = loadMemory();
  const sessionLogs = recall('sessionStart');
  const recentLogs = memory.logs.slice(-20);

  return {
    owner: memory.owner,
    totalLogs: memory.logs.length,
    recentActivity: recentLogs,
    milestones: memory.milestones.length,
    activeTasks: Object.keys(memory.taskProgress).length,
    lastSession: sessionLogs.length > 0 ? sessionLogs[sessionLogs.length - 1] : null,
  };
}

/**
 * Reset memory (for testing or fresh start)
 */
export function resetMemory() {
  const defaultMemory = getDefaultMemory();
  saveMemory(defaultMemory);
  console.log('Emma Memory: Reset to defaults');
  return defaultMemory;
}

/**
 * Initialize memory system
 */
export function initializeMemory() {
  const memory = loadMemory();
  console.log('🧠 Emma Memory Core Initialized');
  console.log('Owner:', memory.owner.name);
  console.log('Ground Rules Loaded:', memory.rules.length);
  console.log('Total Logs:', memory.logs.length);
  console.log('Milestones:', memory.milestones.length);

  // Log initialization
  remember('system_init', `Emma Memory Core initialized at ${new Date().toLocaleString()}`);

  return memory;
}
