/**
 * SEO metrics calculator for keywords
 */

class SEOMetrics {
    constructor() { }

    /**
     * Calculate keyword density
     */
    calculateKeywordDensity(keyword, totalWords) {
        const keywordWords = keyword.split(' ').length;
        return (keywordWords / totalWords) * 100;
    }

    /**
     * Calculate prominence score based on position in content
     */
    calculateProminence(keyword, content) {
        const lowerContent = content.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();
        const position = lowerContent.indexOf(lowerKeyword);

        if (position === -1) return 0;

        // Earlier appearance = higher score
        const totalLength = content.length;
        const prominenceScore = 100 - (position / totalLength * 100);

        return Math.round(prominenceScore);
    }

    /**
     * Estimate keyword difficulty (0-100)
     * Based on keyword length and competition
     */
    estimateKeywordDifficulty(keyword, frequency, totalKeywords) {
        const wordCount = keyword.split(' ').length;

        // Long-tail keywords (3+ words) are easier
        if (wordCount >= 3) return 20 + (frequency / totalKeywords * 30);

        // Short keywords with high frequency = high competition
        if (wordCount === 1) return 60 + (frequency / totalKeywords * 40);

        // Medium keywords
        return 40 + (frequency / totalKeywords * 35);
    }

    /**
     * Calculate keyword co-occurrence matrix
     */
    calculateCoOccurrence(keywords, windowSize = 5, sentences) {
        const coOccurrence = {};

        sentences.forEach(sentence => {
            const words = sentence.toLowerCase().split(/\s+/);

            // Find which keywords appear in this sentence
            const presentKeywords = keywords.filter(kw =>
                sentence.toLowerCase().includes(kw.toLowerCase())
            );

            // Record co-occurrences
            for (let i = 0; i < presentKeywords.length; i++) {
                for (let j = i + 1; j < presentKeywords.length; j++) {
                    const pair = [presentKeywords[i], presentKeywords[j]].sort().join('|');
                    coOccurrence[pair] = (coOccurrence[pair] || 0) + 1;
                }
            }
        });

        return coOccurrence;
    }

    /**
     * Categorize keyword by competition level
     */
    categorizeCompetition(difficulty) {
        if (difficulty >= 70) return 'high';
        if (difficulty >= 40) return 'medium';
        return 'low';
    }

    /**
     * Detect if keyword is long-tail (3+ words)
     */
    isLongTail(keyword) {
        return keyword.split(' ').length >= 3;
    }

    /**
     * Detect if keyword is a question
     */
    isQuestion(keyword) {
        const questionWords = ['what', 'when', 'where', 'why', 'who', 'how', 'which', 'can', 'does', 'is', 'are'];
        const firstWord = keyword.split(' ')[0].toLowerCase();
        return questionWords.includes(firstWord) || keyword.includes('?');
    }

    /**
     * Detect commercial intent
     */
    hasCommercialIntent(keyword) {
        const commercialWords = [
            'buy', 'purchase', 'order', 'price', 'cost', 'cheap', 'affordable',
            'discount', 'sale', 'deal', 'coupon', 'free shipping', 'best',
            'review', 'comparison', 'vs', 'alternative', 'shop', 'store'
        ];

        const lowerKeyword = keyword.toLowerCase();
        return commercialWords.some(word => lowerKeyword.includes(word));
    }

    /**
     * Calculate overall SEO score for a keyword
     */
    calculateSEOScore(keyword, metrics) {
        let score = 0;

        // Prominence (0-30 points)
        score += (metrics.prominence || 0) * 0.3;

        // Frequency (0-25 points)
        score += Math.min((metrics.frequency || 0) * 5, 25);

        // Length bonus (0-20 points) - longer keywords often more specific
        const wordCount = keyword.split(' ').length;
        score += Math.min(wordCount * 5, 20);

        // Competition inverse (0-25 points) - lower competition = higher score
        score += 25 - ((metrics.difficulty || 50) * 0.25);

        return Math.round(Math.min(score, 100));
    }

    /**
     * Generate SEO recommendations
     */
    generateRecommendations(keywordData) {
        const recommendations = [];

        // Check for long-tail opportunities
        const longTailCount = keywordData.filter(kw => this.isLongTail(kw.keyword)).length;
        if (longTailCount < keywordData.length * 0.3) {
            recommendations.push({
                type: 'opportunity',
                message: 'Consider targeting more long-tail keywords (3+ words) for easier ranking'
            });
        }

        // Check for question keywords
        const questionCount = keywordData.filter(kw => this.isQuestion(kw.keyword)).length;
        if (questionCount > 0) {
            recommendations.push({
                type: 'suggestion',
                message: `Found ${questionCount} question-based keywords - great for FAQ sections and voice search`
            });
        }

        // Check for commercial intent
        const commercialCount = keywordData.filter(kw => this.hasCommercialIntent(kw.keyword)).length;
        if (commercialCount > keywordData.length * 0.5) {
            recommendations.push({
                type: 'insight',
                message: 'High commercial intent detected - content is well-optimized for conversions'
            });
        }

        return recommendations;
    }
}

module.exports = SEOMetrics;
