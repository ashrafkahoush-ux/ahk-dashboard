/**
 * Emma's Self-Learning Scheduler
 * Runs periodic analysis and style adjustments in the background
 */

import { summarizeLogs, updateStyleModel, getLearningInsights } from './EmmaCore.mjs';

let learningInterval = null;
let isRunning = false;

/**
 * Start the self-learning scheduler
 */
export function startSelfLearning(intervalMinutes = 30) {
  if (isRunning) {
    console.log('🧠 Emma self-learning already running');
    return;
  }
  
  console.log(`🧠 Emma self-learning started (every ${intervalMinutes} minutes)`);
  isRunning = true;
  
  // Run immediately on start
  runLearningCycle();
  
  // Then run periodically
  learningInterval = setInterval(() => {
    runLearningCycle();
  }, intervalMinutes * 60 * 1000);
}

/**
 * Stop the self-learning scheduler
 */
export function stopSelfLearning() {
  if (learningInterval) {
    clearInterval(learningInterval);
    learningInterval = null;
    isRunning = false;
    console.log('🧠 Emma self-learning stopped');
  }
}

/**
 * Run a single learning cycle
 */
function runLearningCycle() {
  try {
    console.log('🧠 Emma Auto-Analysis Running...');
    
    // Analyze recent interactions
    const insights = summarizeLogs();
    
    // Update communication style based on acceptance rate
    const styleModel = updateStyleModel();
    
    // Get full learning insights
    const learningData = getLearningInsights();
    
    // Log results
    console.log('📊 Emma Learning Summary:', {
      totalInteractions: insights.total,
      topCommand: insights.topCommand,
      peakHour: insights.peakHour,
      acceptanceRate: insights.acceptance + '%',
      currentStyle: styleModel.current
    });
    
    // Log recommendations
    if (learningData.recommendations.length > 0) {
      console.log('💡 Emma Recommendations:', learningData.recommendations);
    }
    
    // Trigger custom event for UI updates
    window.dispatchEvent(new CustomEvent('emma-learning-update', {
      detail: learningData
    }));
    
  } catch (error) {
    console.warn('🧠 Emma self-learning cycle failed:', error);
  }
}

/**
 * Force a learning cycle immediately
 */
export function forceLearningCycle() {
  console.log('🧠 Forcing immediate learning cycle...');
  runLearningCycle();
}

/**
 * Check if self-learning is running
 */
export function isSelfLearningActive() {
  return isRunning;
}

/**
 * React hook for self-learning
 */
export function useSelfLearning(intervalMinutes = 30) {
  const startLearning = () => startSelfLearning(intervalMinutes);
  const stopLearning = () => stopSelfLearning();
  const forceUpdate = () => forceLearningCycle();
  
  return {
    start: startLearning,
    stop: stopLearning,
    force: forceUpdate,
    isActive: isSelfLearningActive
  };
}
