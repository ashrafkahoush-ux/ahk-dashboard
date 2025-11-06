/**
 * Dictionary Indexer
 * Builds in-memory index from /Emma/Dictionaries for fast lookup
 * Supports live reloading with debounce
 */

import fs from 'fs';
import path from 'path';
import { DICTIONARY_CONFIG, getDictionaryPath, isSupportedFile, detectLanguage } from './config.mjs';

class DictionaryIndexer {
  constructor() {
    this.index = {
      synonymMap: new Map(),      // phrase → canonical
      intentMap: new Map(),        // canonical → intent
      stopwords: new Set(),        // language-specific stopwords
      multilingual: new Map(),     // phrase → canonical (cross-language)
      metadata: {
        totalSynonyms: 0,
        totalIntents: 0,
        languages: [],
        lastBuild: null,
      }
    };
    
    this.isBuilding = false;
    this.lastBuildTime = 0;
    this.rebuildDebounceTimer = null;
    this.watchInterval = null;
    this.fileHashes = new Map(); // filename → hash for change detection
  }

  /**
   * Build index from all dictionary files
   * @param {string} projectRoot - Absolute path to project root
   * @returns {Promise<Object>} Build statistics
   */
  async buildIndex(projectRoot = process.cwd()) {
    // Throttle rebuilds
    const now = Date.now();
    if (this.isBuilding) {
      console.log('⏳ Index build already in progress, skipping...');
      return this.index.metadata;
    }
    
    if (now - this.lastBuildTime < DICTIONARY_CONFIG.performance.indexRebuildThrottleMs) {
      console.log('⏳ Index rebuild throttled, try again later');
      return this.index.metadata;
    }

    this.isBuilding = true;
    this.lastBuildTime = now;

    try {
      console.log('📚 Building dictionary index...');
      
      // Reset index
      this.index.synonymMap.clear();
      this.index.intentMap.clear();
      this.index.stopwords.clear();
      this.index.multilingual.clear();
      
      const dictionaryPath = getDictionaryPath(projectRoot);
      
      // Check if directory exists
      if (!fs.existsSync(dictionaryPath)) {
        console.warn(`⚠️ Dictionary directory not found: ${dictionaryPath}`);
        fs.mkdirSync(dictionaryPath, { recursive: true });
        console.log(`✅ Created dictionary directory: ${dictionaryPath}`);
      }

      // Load all dictionary files
      const files = fs.readdirSync(dictionaryPath)
        .filter(isSupportedFile);

      if (files.length === 0) {
        console.warn('⚠️ No dictionary files found');
        this.index.metadata.lastBuild = new Date().toISOString();
        return this.index.metadata;
      }

      const languages = new Set();
      
      for (const file of files) {
        const filePath = path.join(dictionaryPath, file);
        await this.loadDictionaryFile(filePath, languages);
        
        // Calculate file hash for change detection
        const content = fs.readFileSync(filePath, 'utf8');
        this.fileHashes.set(file, this.hashString(content));
      }

      // Update metadata
      this.index.metadata = {
        totalSynonyms: this.index.synonymMap.size,
        totalIntents: this.index.intentMap.size,
        languages: Array.from(languages),
        lastBuild: new Date().toISOString(),
      };

      console.log(`✅ Dictionary index built: ${this.index.metadata.totalIntents} intents, ${this.index.metadata.totalSynonyms} synonyms`);
      
      return this.index.metadata;
      
    } catch (error) {
      console.error('❌ Error building dictionary index:', error);
      throw error;
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Load a single dictionary file
   * @param {string} filePath - Path to dictionary file
   * @param {Set} languages - Set to collect language codes
   */
  async loadDictionaryFile(filePath, languages) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.json') {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        this.processDictionaryData(data, languages);
      } else if (ext === '.yaml' || ext === '.yml') {
        // TODO: Add YAML support if needed
        console.warn(`⚠️ YAML not yet supported: ${filePath}`);
      } else if (ext === '.csv') {
        // TODO: Add CSV support if needed
        console.warn(`⚠️ CSV not yet supported: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading dictionary file ${filePath}:`, error.message);
    }
  }

  /**
   * Process dictionary data into index
   * @param {Object} data - Dictionary data
   * @param {Set} languages - Set to collect language codes
   */
  processDictionaryData(data, languages) {
    const lang = data.language || 'en';
    languages.add(lang);

    // Process synonyms
    if (data.synonyms) {
      for (const [canonical, variants] of Object.entries(data.synonyms)) {
        const normalizedCanonical = this.normalizePhrase(canonical);
        
        // Add canonical → canonical mapping
        this.index.synonymMap.set(normalizedCanonical, canonical);
        
        // Add all variants → canonical mappings
        if (Array.isArray(variants)) {
          for (const variant of variants) {
            const normalizedVariant = this.normalizePhrase(variant);
            this.index.synonymMap.set(normalizedVariant, canonical);
          }
        }
      }
    }

    // Process intents
    if (data.intents) {
      for (const [intent, phrases] of Object.entries(data.intents)) {
        if (Array.isArray(phrases)) {
          for (const phrase of phrases) {
            const normalizedPhrase = this.normalizePhrase(phrase);
            const canonical = this.index.synonymMap.get(normalizedPhrase) || phrase;
            const normalizedCanonical = this.normalizePhrase(canonical);
            this.index.intentMap.set(normalizedCanonical, intent);
          }
        }
      }
    }

    // Process stopwords
    if (data.stopwords && Array.isArray(data.stopwords)) {
      for (const word of data.stopwords) {
        this.index.stopwords.add(this.normalizePhrase(word));
      }
    }

    // Process multilingual mappings
    if (data.multilingual) {
      for (const [targetLang, mappings] of Object.entries(data.multilingual)) {
        languages.add(targetLang);
        
        for (const [canonical, variants] of Object.entries(mappings)) {
          if (Array.isArray(variants)) {
            for (const variant of variants) {
              const normalizedVariant = this.normalizePhrase(variant);
              this.index.multilingual.set(normalizedVariant, canonical);
              
              // Also add to synonym map
              this.index.synonymMap.set(normalizedVariant, canonical);
            }
          }
        }
      }
    }
  }

  /**
   * Normalize phrase for consistent lookup
   * @param {string} phrase - Input phrase
   * @returns {string} Normalized phrase
   */
  normalizePhrase(phrase) {
    return phrase
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep alphanumeric + Arabic
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get synonyms for a phrase
   * @param {string} phrase - Input phrase
   * @returns {string[]} Array of synonyms
   */
  getSynonymsFor(phrase) {
    const normalized = this.normalizePhrase(phrase);
    const canonical = this.index.synonymMap.get(normalized);
    
    if (!canonical) return [];

    // Find all phrases that map to this canonical
    const synonyms = [];
    for (const [variant, can] of this.index.synonymMap.entries()) {
      if (can === canonical && variant !== normalized) {
        synonyms.push(variant);
      }
    }
    
    return synonyms;
  }

  /**
   * Map phrase to canonical form
   * @param {string} phrase - Input phrase
   * @returns {string|null} Canonical phrase or null
   */
  mapToCanonical(phrase) {
    const normalized = this.normalizePhrase(phrase);
    return this.index.synonymMap.get(normalized) || 
           this.index.multilingual.get(normalized) || 
           null;
  }

  /**
   * Detect intent from phrase
   * @param {string} phrase - Input phrase
   * @returns {Object} {intent, confidence, canonical}
   */
  detectIntent(phrase) {
    const normalized = this.normalizePhrase(phrase);
    
    // Try direct lookup
    let canonical = this.mapToCanonical(phrase);
    if (!canonical) canonical = phrase;
    
    const normalizedCanonical = this.normalizePhrase(canonical);
    const intent = this.index.intentMap.get(normalizedCanonical);
    
    if (intent) {
      return {
        intent,
        confidence: 1.0, // Exact match
        canonical,
        matched: phrase,
      };
    }

    // Try partial matching (token-based)
    const tokens = normalized.split(' ');
    const bestMatch = this.findBestPartialMatch(tokens);
    
    return bestMatch || {
      intent: 'UNKNOWN',
      confidence: 0.0,
      canonical: null,
      matched: null,
    };
  }

  /**
   * Find best partial match using tokens
   * @param {string[]} tokens - Input tokens
   * @returns {Object|null} Best match result
   */
  findBestPartialMatch(tokens) {
    let bestMatch = null;
    let maxScore = 0;

    for (const [phrase, canonical] of this.index.synonymMap.entries()) {
      const phraseTokens = phrase.split(' ');
      const overlap = this.calculateTokenOverlap(tokens, phraseTokens);
      const score = overlap / Math.max(tokens.length, phraseTokens.length);

      if (score > maxScore && score >= 0.5) {
        const normalizedCanonical = this.normalizePhrase(canonical);
        const intent = this.index.intentMap.get(normalizedCanonical);
        
        if (intent) {
          maxScore = score;
          bestMatch = {
            intent,
            confidence: score,
            canonical,
            matched: phrase,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate token overlap between two token arrays
   * @param {string[]} tokens1 - First token array
   * @param {string[]} tokens2 - Second token array
   * @returns {number} Number of overlapping tokens
   */
  calculateTokenOverlap(tokens1, tokens2) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    let overlap = 0;
    
    for (const token of set1) {
      if (set2.has(token)) overlap++;
    }
    
    return overlap;
  }

  /**
   * Check if word is a stopword
   * @param {string} word - Word to check
   * @returns {boolean} True if stopword
   */
  isStopword(word) {
    return this.index.stopwords.has(this.normalizePhrase(word));
  }

  /**
   * Start watching for file changes
   * @param {string} projectRoot - Project root path
   */
  startWatching(projectRoot = process.cwd()) {
    if (!DICTIONARY_CONFIG.reload.enabled) {
      console.log('📚 Dictionary live reload is disabled');
      return;
    }

    if (this.watchInterval) {
      console.log('📚 Dictionary watcher already running');
      return;
    }

    console.log(`📚 Starting dictionary watcher (interval: ${DICTIONARY_CONFIG.reload.intervalMs}ms)`);
    
    this.watchInterval = setInterval(() => {
      this.checkForChanges(projectRoot);
    }, DICTIONARY_CONFIG.reload.intervalMs);
  }

  /**
   * Stop watching for file changes
   */
  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
      console.log('📚 Dictionary watcher stopped');
    }
  }

  /**
   * Check for file changes and rebuild if needed
   * @param {string} projectRoot - Project root path
   */
  async checkForChanges(projectRoot) {
    try {
      const dictionaryPath = getDictionaryPath(projectRoot);
      
      if (!fs.existsSync(dictionaryPath)) return;

      const files = fs.readdirSync(dictionaryPath).filter(isSupportedFile);
      let hasChanges = false;

      for (const file of files) {
        const filePath = path.join(dictionaryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const currentHash = this.hashString(content);
        const storedHash = this.fileHashes.get(file);

        if (currentHash !== storedHash) {
          console.log(`📚 Detected change in: ${file}`);
          hasChanges = true;
          break;
        }
      }

      // Check for deleted or new files
      if (files.length !== this.fileHashes.size) {
        hasChanges = true;
      }

      if (hasChanges) {
        this.debouncedRebuild(projectRoot);
      }
    } catch (error) {
      console.error('❌ Error checking for dictionary changes:', error.message);
    }
  }

  /**
   * Debounced rebuild to avoid rapid rebuilds
   * @param {string} projectRoot - Project root path
   */
  debouncedRebuild(projectRoot) {
    if (this.rebuildDebounceTimer) {
      clearTimeout(this.rebuildDebounceTimer);
    }

    this.rebuildDebounceTimer = setTimeout(async () => {
      console.log('📚 Rebuilding dictionary index due to changes...');
      await this.buildIndex(projectRoot);
    }, DICTIONARY_CONFIG.reload.debounceMs);
  }

  /**
   * Simple hash function for string content
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Get index statistics
   * @returns {Object} Index metadata
   */
  getStats() {
    return { ...this.index.metadata };
  }
}

// Singleton instance
const indexer = new DictionaryIndexer();

export default indexer;
export { DictionaryIndexer };
