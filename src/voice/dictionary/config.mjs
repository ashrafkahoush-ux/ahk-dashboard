/**
 * Dictionary System Configuration
 * Paths, reload intervals, language settings for Emma's dictionary-driven NLU
 */

import path from 'path';

export const DICTIONARY_CONFIG = {
  // Base path for dictionary files (relative to project root)
  basePath: 'Emma/Dictionaries',
  
  // Supported file extensions
  supportedExtensions: ['.json', '.yaml', '.yml', '.csv'],
  
  // Live reload settings
  reload: {
    enabled: true,
    intervalMs: 60000, // Check for changes every 60 seconds
    debounceMs: 2000,  // Debounce rebuild by 2 seconds after file change
  },
  
  // Language settings
  languages: {
    supported: ['en', 'ar'],
    default: 'en',
    // Arabic detection: if text contains Arabic range (U+0600 to U+06FF)
    arabicRangeRegex: /[\u0600-\u06FF]/,
  },
  
  // Confidence thresholds
  confidence: {
    accept: 0.7,      // >= 0.7: Execute immediately
    clarify: 0.4,     // 0.4-0.69: Ask single clarification question
    reject: 0.4,      // < 0.4: Show fallback with examples
    dictionaryBoost: 0.2, // Boost confidence by 0.2 if matched via dictionary
  },
  
  // Performance settings
  performance: {
    maxCacheSize: 10000, // Max number of normalized phrases to cache
    indexRebuildThrottleMs: 5000, // Min time between index rebuilds
  },
  
  // Clarification settings
  clarification: {
    maxAttempts: 1,        // Ask for clarification only once
    timeoutMs: 10000,      // Wait 10s for clarification response
    showExamples: true,    // Show example phrases in fallback
    maxExamples: 3,        // Max number of examples to show
  },
  
  // SSML settings
  ssml: {
    enabled: true,
    maxChunkLength: 180,   // Max characters per speech chunk
    pauseBetweenChunks: 500, // Milliseconds pause between chunks
  },
  
  // Core dictionary files (relative to basePath)
  coreFiles: {
    en: 'en-core.json',
    ar: 'ar-core.json',
  },
};

/**
 * Get full path to dictionary directory
 * @param {string} projectRoot - Absolute path to project root
 * @returns {string} Absolute path to dictionary directory
 */
export function getDictionaryPath(projectRoot) {
  return path.join(projectRoot, DICTIONARY_CONFIG.basePath);
}

/**
 * Get full path to a specific dictionary file
 * @param {string} projectRoot - Absolute path to project root
 * @param {string} filename - Dictionary filename
 * @returns {string} Absolute path to dictionary file
 */
export function getDictionaryFilePath(projectRoot, filename) {
  return path.join(projectRoot, DICTIONARY_CONFIG.basePath, filename);
}

/**
 * Check if file extension is supported
 * @param {string} filename - File name to check
 * @returns {boolean} True if extension is supported
 */
export function isSupportedFile(filename) {
  return DICTIONARY_CONFIG.supportedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
}

/**
 * Detect language from text
 * @param {string} text - Input text
 * @returns {string} Language code ('ar' or 'en')
 */
export function detectLanguage(text) {
  if (DICTIONARY_CONFIG.languages.arabicRangeRegex.test(text)) {
    return 'ar';
  }
  return DICTIONARY_CONFIG.languages.default;
}

export default DICTIONARY_CONFIG;
