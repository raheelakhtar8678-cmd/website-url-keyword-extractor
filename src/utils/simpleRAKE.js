/**
 * Simple RAKE (Rapid Automatic Keyword Extraction) implementation
 */

const natural = require('natural');
const stopword = require('stopword');

class SimpleRAKE {
    constructor(options = {}) {
        this.minWordLength = options.minWordLength || 3;
        this.maxWordsPerKeyword = options.maxWordsPerKeyword || 4;
        this.language = options.language || 'en';
        this.tokenizer = new natural.WordTokenizer();
    }

    /**
     * Extract keywords using RAKE algorithm
     */
    extract(text) {
        // Split text into sentences
        const sentences = this.splitIntoSentences(text);

        // Generate candidate keywords
        const candidates = [];
        sentences.forEach(sentence => {
            const words = this.extractCandidateWords(sentence);
            candidates.push(...words);
        });

        // Calculate scores
        const scoredKeywords = this.scoreKeywords(candidates);

        // Sort by score and return
        return scoredKeywords
            .sort((a, b) => b.score - a.score)
            .map(item => item.keyword);
    }

    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        const sentenceTokenizer = new natural.SentenceTokenizer();
        return sentenceTokenizer.tokenize(text);
    }

    /**
     * Extract candidate keywords from sentence
     */
    extractCandidateWords(sentence) {
        // Tokenize
        const tokens = this.tokenizer.tokenize(sentence.toLowerCase());

        // Split on stopwords to get candidate keyword phrases
        const candidates = [];
        let currentPhrase = [];

        // Get stopword list
        // Get stopword list with fallback
        const stopwords = stopword[this.language] || stopword.en || [];

        tokens.forEach(token => {
            if (stopwords.includes(token) || token.length < this.minWordLength) {
                // This is a stopword or too short - save current phrase and reset
                if (currentPhrase.length > 0) {
                    if (currentPhrase.length <= this.maxWordsPerKeyword) {
                        candidates.push(currentPhrase.join(' '));
                    }
                    currentPhrase = [];
                }
            } else {
                // Add to current phrase
                currentPhrase.push(token);
            }
        });

        // Don't forget the last phrase
        if (currentPhrase.length > 0 && currentPhrase.length <= this.maxWordsPerKeyword) {
            candidates.push(currentPhrase.join(' '));
        }

        return candidates;
    }

    /**
     * Score keywords based on word co-occurrence
     */
    scoreKeywords(candidates) {
        // Calculate word frequency and degree
        const wordFrequency = {};
        const wordDegree = {};

        candidates.forEach(phrase => {
            const words = phrase.split(' ');
            const degree = words.length - 1;

            words.forEach(word => {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                wordDegree[word] = (wordDegree[word] || 0) + degree;
            });
        });

        // Calculate phrase scores
        const phraseScores = {};
        candidates.forEach(phrase => {
            const words = phrase.split(' ');
            let score = 0;

            words.forEach(word => {
                const freq = wordFrequency[word] || 1;
                const deg = wordDegree[word] || 0;
                score += (deg + freq) / freq;
            });

            phraseScores[phrase] = (phraseScores[phrase] || 0) + score;
        });

        // Convert to array
        return Object.entries(phraseScores).map(([keyword, score]) => ({
            keyword,
            score
        }));
    }
}

module.exports = SimpleRAKE;
