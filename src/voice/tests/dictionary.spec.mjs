/**
 * Dictionary System Test Suite
 * Tests for multilingual intent matching, synonym expansion, and context-aware answers
 */

import { describe, it, expect, beforeAll } from 'vitest';
import dictionary from '../dictionary/browser.js';

// Import test dictionaries
import enCore from '../../../Emma/Dictionaries/en-core.json';
import arCore from '../../../Emma/Dictionaries/ar-core.json';

describe('Dictionary System Tests', () => {
  beforeAll(() => {
    // Load dictionaries before running tests
    dictionary.loadDictionaries([enCore, arCore]);
    console.log('📚 Test dictionaries loaded');
  });

  describe('English Intent Detection', () => {
    it('should detect START_ANALYSIS from "begin analysis"', () => {
      const result = dictionary.detectIntent('begin analysis');
      expect(result.intent).toBe('START_ANALYSIS');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect START_ANALYSIS from "kick off analysis"', () => {
      const result = dictionary.detectIntent('kick off analysis');
      expect(result.intent).toBe('START_ANALYSIS');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect READ_REPORT from "brief me"', () => {
      const result = dictionary.detectIntent('brief me');
      expect(result.intent).toBe('READ_REPORT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect READ_REPORT from "executive summary"', () => {
      const result = dictionary.detectIntent('executive summary');
      expect(result.intent).toBe('READ_REPORT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect READ_REPORT from "full report"', () => {
      const result = dictionary.detectIntent('full report');
      expect(result.intent).toBe('READ_REPORT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect STOP from "enough"', () => {
      const result = dictionary.detectIntent('enough');
      expect(result.intent).toBe('STOP');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect RELOAD_DICTIONARY from "refresh dictionary"', () => {
      const result = dictionary.detectIntent('refresh dictionary');
      expect(result.intent).toBe('RELOAD_DICTIONARY');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Arabic Intent Detection', () => {
    it('should detect START_ANALYSIS from "ابدئي التحليل"', () => {
      const result = dictionary.detectIntent('ابدئي التحليل');
      expect(result.intent).toBe('START_ANALYSIS');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect START_ANALYSIS from "شغلي التحليل"', () => {
      const result = dictionary.detectIntent('شغلي التحليل');
      expect(result.intent).toBe('START_ANALYSIS');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect READ_REPORT from "اقري التقرير"', () => {
      const result = dictionary.detectIntent('اقري التقرير');
      expect(result.intent).toBe('READ_REPORT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect READ_REPORT from "الملخص التنفيذي"', () => {
      const result = dictionary.detectIntent('الملخص التنفيذي');
      expect(result.intent).toBe('READ_REPORT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect STOP from "كفى"', () => {
      const result = dictionary.detectIntent('كفى');
      expect(result.intent).toBe('STOP');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Noise Handling', () => {
    it('should handle filler words: "please now kindly read it"', () => {
      const result = dictionary.detectIntent('please now kindly read it');
      expect(result.intent).toBe('READ_REPORT');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should handle Arabic fillers: "من فضلك اقري التقرير"', () => {
      const result = dictionary.detectIntent('من فضلك اقري التقرير');
      expect(result.intent).toBe('READ_REPORT');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should handle casual speech: "uh can you like start the analysis"', () => {
      const result = dictionary.detectIntent('uh can you like start the analysis');
      expect(result.intent).toBe('START_ANALYSIS');
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });

  describe('Context-Aware Answers', () => {
    describe('Report Choice Context', () => {
      it('should match "executive summary" in report_choice context', () => {
        const contextAnswers = dictionary.getContextualAnswers('report_choice');
        const summaryAnswers = contextAnswers.executive_summary || [];
        const result = dictionary.matchExpectedAnswer('executive summary', summaryAnswers);
        expect(result.confidence).toBeGreaterThan(0.8);
        expect(result.matched).toBeTruthy();
      });

      it('should match "brief" in report_choice context', () => {
        const contextAnswers = dictionary.getContextualAnswers('report_choice');
        const summaryAnswers = contextAnswers.executive_summary || [];
        const result = dictionary.matchExpectedAnswer('brief', summaryAnswers);
        expect(result.confidence).toBeGreaterThan(0.6);
      });

      it('should match "full report" in report_choice context', () => {
        const contextAnswers = dictionary.getContextualAnswers('report_choice');
        const fullAnswers = contextAnswers.full_report || [];
        const result = dictionary.matchExpectedAnswer('full report', fullAnswers);
        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('should match Arabic "ملخص" in report_choice context', () => {
        const contextAnswers = dictionary.getContextualAnswers('report_choice');
        const summaryAnswers = contextAnswers.executive_summary || [];
        const result = dictionary.matchExpectedAnswer('ملخص', summaryAnswers);
        expect(result.confidence).toBeGreaterThan(0.6);
      });

      it('should match Arabic "كامل" in report_choice context', () => {
        const contextAnswers = dictionary.getContextualAnswers('report_choice');
        const fullAnswers = contextAnswers.full_report || [];
        const result = dictionary.matchExpectedAnswer('كامل', fullAnswers);
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });

    describe('Yes/No Context', () => {
      it('should match "yes" in yes_no context', () => {
        const yesNoAnswers = dictionary.getContextualAnswers('yes_no');
        const yesAnswers = yesNoAnswers.yes || [];
        const result = dictionary.matchExpectedAnswer('yes', yesAnswers);
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should match "sure" in yes_no context', () => {
        const yesNoAnswers = dictionary.getContextualAnswers('yes_no');
        const yesAnswers = yesNoAnswers.yes || [];
        const result = dictionary.matchExpectedAnswer('sure', yesAnswers);
        expect(result.confidence).toBeGreaterThan(0.6);
      });

      it('should match "no" in yes_no context', () => {
        const yesNoAnswers = dictionary.getContextualAnswers('yes_no');
        const noAnswers = yesNoAnswers.no || [];
        const result = dictionary.matchExpectedAnswer('no', noAnswers);
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should match Arabic "نعم" in yes_no context', () => {
        const yesNoAnswers = dictionary.getContextualAnswers('yes_no');
        const yesAnswers = yesNoAnswers.yes || [];
        const result = dictionary.matchExpectedAnswer('نعم', yesAnswers);
        expect(result.confidence).toBeGreaterThan(0.6);
      });

      it('should match Arabic "لا" in yes_no context', () => {
        const yesNoAnswers = dictionary.getContextualAnswers('yes_no');
        const noAnswers = yesNoAnswers.no || [];
        const result = dictionary.matchExpectedAnswer('لا', noAnswers);
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });
  });

  describe('Unknown Intents', () => {
    it('should return UNKNOWN for nonsense input', () => {
      const result = dictionary.detectIntent('xyz foo bar qwerty');
      expect(result.intent).toBe('UNKNOWN');
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should return UNKNOWN for unrelated phrase', () => {
      const result = dictionary.detectIntent('the weather is nice today');
      expect(result.intent).toBe('UNKNOWN');
      expect(result.confidence).toBeLessThan(0.3);
    });
  });

  describe('Canonical Mapping', () => {
    it('should map "kick off analysis" to "start analysis"', () => {
      const canonical = dictionary.mapToCanonical('kick off analysis');
      expect(canonical).toBe('start analysis');
    });

    it('should map "brief me" to "read report"', () => {
      const canonical = dictionary.mapToCanonical('brief me');
      expect(canonical).toBe('read report');
    });

    it('should map Arabic "شغلي التحليل" to "start analysis"', () => {
      const canonical = dictionary.mapToCanonical('شغلي التحليل');
      expect(canonical).toBe('start analysis');
    });
  });

  describe('Language Detection', () => {
    it('should detect English for "start analysis"', () => {
      const lang = dictionary.detectLanguage('start analysis');
      expect(lang).toBe('en');
    });

    it('should detect Arabic for "ابدئي التحليل"', () => {
      const lang = dictionary.detectLanguage('ابدئي التحليل');
      expect(lang).toBe('ar');
    });

    it('should detect Arabic for mixed input with Arabic characters', () => {
      const lang = dictionary.detectLanguage('hello مرحبا');
      expect(lang).toBe('ar');
    });
  });

  describe('Stopword Filtering', () => {
    it('should identify "please" as a stopword', () => {
      const isStop = dictionary.isStopword('please');
      expect(isStop).toBe(true);
    });

    it('should identify "kindly" as a stopword', () => {
      const isStop = dictionary.isStopword('kindly');
      expect(isStop).toBe(true);
    });

    it('should identify Arabic "من فضلك" as a stopword', () => {
      const isStop = dictionary.isStopword('من فضلك');
      expect(isStop).toBe(true);
    });

    it('should NOT identify "analysis" as a stopword', () => {
      const isStop = dictionary.isStopword('analysis');
      expect(isStop).toBe(false);
    });
  });

  describe('Dictionary Statistics', () => {
    it('should have loaded intents', () => {
      const stats = dictionary.getStats();
      expect(stats.totalIntents).toBeGreaterThan(0);
    });

    it('should have loaded synonyms', () => {
      const stats = dictionary.getStats();
      expect(stats.totalSynonyms).toBeGreaterThan(0);
    });

    it('should have loaded multiple languages', () => {
      const stats = dictionary.getStats();
      expect(stats.languages).toContain('en');
      expect(stats.languages).toContain('ar');
    });

    it('should have a build timestamp', () => {
      const stats = dictionary.getStats();
      expect(stats.lastBuild).toBeTruthy();
    });
  });

  describe('Clarification Path', () => {
    it('should suggest clarification for partial match', () => {
      const result = dictionary.detectIntent('analysis');
      // Partial match should have medium confidence
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should suggest clarification for ambiguous input', () => {
      const result = dictionary.detectIntent('report');
      // Ambiguous should have medium confidence
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.confidence).toBeLessThan(0.7);
    });
  });
});
