/**
 * Dictionary Normalizer
 * Multi-step normalization pipeline with synonym expansion
 */

import indexer from './indexer.mjs';
import { detectLanguage } from './config.mjs';

/**
 * Normalize text through dictionary-driven pipeline
 * Steps:
 * 1. Lowercase, strip punctuation, collapse whitespace
 * 2. Language detection
 * 3. Remove stopwords
 * 4. Expand synonyms → canonical phrase list
 * 5. Return cleaned text + canonical candidates
 * 
 * @param {string} rawText - Raw input text
 * @param {string} [hintLanguage] - Optional language hint ('en' or 'ar')
 * @returns {Object} { cleaned, canonicalCandidates, language, tokens }
 */
export function normalize(rawText, hintLanguage = null) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      cleaned: '',
      canonicalCandidates: [],
      language: 'en',
      tokens: [],
      confidence: 0,
    };
  }

  // Step 1: Basic cleaning
  const cleaned = cleanText(rawText);
  
  // Step 2: Language detection
  const language = hintLanguage || detectLanguage(cleaned);
  
  // Step 3: Tokenize
  const tokens = tokenize(cleaned);
  
  // Step 4: Remove stopwords
  const filteredTokens = removeStopwords(tokens);
  
  // Step 5: Expand synonyms and find canonical candidates
  const canonicalCandidates = expandToCanonical(filteredTokens, cleaned);
  
  return {
    cleaned,
    canonicalCandidates,
    language,
    tokens: filteredTokens,
    confidence: calculateConfidence(canonicalCandidates, tokens),
  };
}

/**
 * Clean text: lowercase, strip punctuation, collapse whitespace
 * Preserves Arabic characters
 * @param {string} text - Input text
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  return text
    .toLowerCase()
    // Remove punctuation but keep spaces, alphanumeric, and Arabic
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into words
 * @param {string} text - Input text
 * @returns {string[]} Array of tokens
 */
function tokenize(text) {
  return text.split(/\s+/).filter(token => token.length > 0);
}

/**
 * Remove stopwords from token array
 * @param {string[]} tokens - Input tokens
 * @returns {string[]} Filtered tokens
 */
function removeStopwords(tokens) {
  return tokens.filter(token => !indexer.isStopword(token));
}

/**
 * Expand tokens to canonical forms using dictionary
 * @param {string[]} tokens - Filtered tokens
 * @param {string} fullText - Original cleaned text
 * @returns {Array} Array of {canonical, confidence, matched} objects
 */
function expandToCanonical(tokens, fullText) {
  const candidates = [];
  const seen = new Set();

  // Try full phrase first
  const fullPhraseResult = indexer.detectIntent(fullText);
  if (fullPhraseResult.canonical && !seen.has(fullPhraseResult.canonical)) {
    candidates.push(fullPhraseResult);
    seen.add(fullPhraseResult.canonical);
  }

  // Try progressively shorter n-grams (up to 5 words)
  for (let n = Math.min(5, tokens.length); n >= 2; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = tokens.slice(i, i + n).join(' ');
      const result = indexer.detectIntent(ngram);
      
      if (result.canonical && !seen.has(result.canonical)) {
        candidates.push(result);
        seen.add(result.canonical);
      }
    }
  }

  // Try individual tokens
  for (const token of tokens) {
    const canonical = indexer.mapToCanonical(token);
    if (canonical && !seen.has(canonical)) {
      candidates.push({
        intent: 'UNKNOWN',
        confidence: 0.3, // Lower confidence for single tokens
        canonical,
        matched: token,
      });
      seen.add(canonical);
    }
  }

  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence);

  return candidates;
}

/**
 * Calculate overall confidence based on candidates
 * @param {Array} candidates - Canonical candidates
 * @param {string[]} tokens - Original tokens
 * @returns {number} Confidence score 0-1
 */
function calculateConfidence(candidates, tokens) {
  if (candidates.length === 0) return 0;
  
  // Take highest confidence from candidates
  const maxConfidence = candidates[0].confidence;
  
  // Boost if we have multiple candidates (shows good dictionary coverage)
  const coverageBoost = Math.min(0.1, candidates.length * 0.02);
  
  return Math.min(1.0, maxConfidence + coverageBoost);
}

/**
 * Normalize for expected answers (context-aware mode)
 * Used when Emma is awaiting a specific answer
 * @param {string} rawText - User's response
 * @param {string[]} expectedAnswers - Array of expected phrases
 * @returns {Object} { matched, confidence, canonical }
 */
export function normalizeForExpectedAnswers(rawText, expectedAnswers) {
  const { cleaned, language } = normalize(rawText);
  
  let bestMatch = null;
  let maxScore = 0;

  for (const expected of expectedAnswers) {
    const normalizedExpected = cleanText(expected);
    const score = calculateSimilarity(cleaned, normalizedExpected);
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = {
        matched: expected,
        confidence: score,
        canonical: indexer.mapToCanonical(expected) || expected,
        language,
      };
    }
  }

  return bestMatch || {
    matched: null,
    confidence: 0,
    canonical: null,
    language,
  };
}

/**
 * Calculate similarity between two phrases
 * Uses token overlap and Levenshtein-like scoring
 * @param {string} phrase1 - First phrase
 * @param {string} phrase2 - Second phrase
 * @returns {number} Similarity score 0-1
 */
function calculateSimilarity(phrase1, phrase2) {
  const tokens1 = tokenize(phrase1);
  const tokens2 = tokenize(phrase2);
  
  // Exact match
  if (phrase1 === phrase2) return 1.0;
  
  // Token overlap
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  let overlap = 0;
  
  for (const token of set1) {
    if (set2.has(token)) overlap++;
  }
  
  const maxTokens = Math.max(tokens1.length, tokens2.length);
  if (maxTokens === 0) return 0;
  
  const tokenScore = overlap / maxTokens;
  
  // Substring match bonus
  const substringBonus = phrase1.includes(phrase2) || phrase2.includes(phrase1) ? 0.2 : 0;
  
  return Math.min(1.0, tokenScore + substringBonus);
}

/**
 * Get intent with dictionary boost
 * @param {string} text - Input text
 * @param {number} dictionaryBoost - Confidence boost for dictionary matches
 * @returns {Object} { intent, confidence, canonical, source }
 */
export function getIntentWithBoost(text, dictionaryBoost = 0.2) {
  const result = normalize(text);
  
  if (result.canonicalCandidates.length === 0) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      canonical: null,
      source: 'none',
    };
  }

  const topCandidate = result.canonicalCandidates[0];
  
  return {
    intent: topCandidate.intent,
    confidence: Math.min(1.0, topCandidate.confidence + dictionaryBoost),
    canonical: topCandidate.canonical,
    matched: topCandidate.matched,
    source: 'dictionary',
  };
}

export default {
  normalize,
  normalizeForExpectedAnswers,
  getIntentWithBoost,
};
