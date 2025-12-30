/**
 * Text processing utilities for keyword extraction
 */

const stopword = require('stopword');
const natural = require('natural');

class TextProcessor {
    constructor(options = {}) {
        this.minKeywordLength = options.minKeywordLength || 3;
        this.excludeStopwords = options.excludeStopwords !== false;
        this.language = options.language || 'en';
        this.customStopwords = options.customStopwords || [];
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
    }

    /**
     * Clean and normalize text
     */
    cleanText(text) {
        if (!text) return '';
        
        // Remove extra whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Remove special characters but keep hyphenated words
        text = text.replace(/[^\w\s-]/g, ' ');
        
        // Remove numbers-only tokens
        text = text.replace(/\b\d+\b/g, '');
        
        return text;
    }

    /**
     * Tokenize text into words
     */
    tokenize(text) {
        const cleaned = this.cleanText(text);
        return this.tokenizer.tokenize(cleaned.toLowerCase());
    }

    /**
     * Remove stopwords from token array
     */
    removeStopwords(tokens) {
        if (!this.excludeStopwords) return tokens;
        
        // Combine default and custom stopwords
        const customStops = this.customStopwords.map(w => w.toLowerCase());
        
        // Use stopword library for language-specific stopwords
        let filtered = stopword.removeStopwords(tokens, stopword[this.language] || stopword.en);
        
        // Remove custom stopwords
        filtered = filtered.filter(token => !customStops.includes(token));
        
        // Filter by minimum length
        filtered = filtered.filter(token => token.length >= this.minKeywordLength);
        
        return filtered;
    }

    /**
     * Generate n-grams from tokens
     */
    generateNGrams(tokens, n = 2) {
        const ngrams = [];
        for (let i = 0; i <= tokens.length - n; i++) {
            ngrams.push(tokens.slice(i, i + n).join(' '));
        }
        return ngrams;
    }

    /**
     * Get all n-grams (1-gram to max-gram)
     */
    getAllNGrams(tokens, maxN = 4) {
        const allNGrams = [];
        
        // Single words (1-grams)
        allNGrams.push(...tokens);
        
        // Multi-word phrases (2-grams to maxN-grams)
        for (let n = 2; n <= Math.min(maxN, tokens.length); n++) {
            allNGrams.push(...this.generateNGrams(tokens, n));
        }
        
        return allNGrams;
    }

    /**
     * Stem words to their root form
     */
    stem(word) {
        return this.stemmer.stem(word);
    }

    /**
     * Calculate word frequency
     */
    calculateFrequency(tokens) {
        const frequency = {};
        
        tokens.forEach(token => {
            frequency[token] = (frequency[token] || 0) + 1;
        });
        
        return frequency;
    }

    /**
     * Extract sentences from text
     */
    extractSentences(text) {
        const sentenceTokenizer = new natural.SentenceTokenizer();
        return sentenceTokenizer.tokenize(text);
    }

    /**
     * Calculate TF-IDF scores for keywords
     */
    calculateTFIDF(documents) {
        const TfIdf = natural.TfIdf;
        const tfidf = new TfIdf();
        
        documents.forEach(doc => {
            tfidf.addDocument(doc);
        });
        
        return tfidf;
    }

    /**
     * Normalize scores to 0-100 range
     */
    normalizeScores(scores) {
        const values = Object.values(scores);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;
        
        const normalized = {};
        Object.keys(scores).forEach(key => {
            normalized[key] = ((scores[key] - min) / range) * 100;
        });
        
        return normalized;
    }
}

module.exports = TextProcessor;
