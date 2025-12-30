/**
 * Article keyword analyzer
 */

const TextProcessor = require('../utils/textProcessor');
const SEOMetrics = require('../utils/seoMetrics');
const SimpleRAKE = require('../utils/simpleRAKE');
const natural = require('natural');
const { Actor, log } = require('apify');

class ArticleAnalyzer {
    constructor(options = {}) {
        this.textProcessor = new TextProcessor(options);
        this.seoMetrics = new SEOMetrics();
        this.maxKeywords = options.maxKeywords || 50;
        this.analysisDepth = options.analysisDepth || 'standard';
    }

    /**
     * Analyze article content and extract keywords
     */
    async analyze(content) {
        log.info('Starting article keyword analysis...');

        // Combine all relevant text
        const fullText = this.combineText(content);

        if (!fullText || fullText.length < 100) {
            throw new Error('Insufficient content for analysis');
        }

        // Extract sentences for various analyses
        const sentences = this.textProcessor.extractSentences(fullText);

        // Run different extraction methods
        const results = {
            rakeKeywords: await this.extractRAKEKeywords(fullText),
            tfidfKeywords: await this.extractTFIDFKeywords(fullText, sentences),
            metaKeywords: await this.extractMetaKeywords(content),
            headingKeywords: await this.extractHeadingKeywords(content),
            entityKeywords: await this.extractEntities(fullText)
        };

        // Merge and score all keywords
        const mergedKeywords = this.mergeAndScore(results, fullText, sentences);

        // Categorize keywords
        const categorized = this.categorizeKeywords(mergedKeywords, fullText, sentences);

        log.info(`Extracted ${categorized.all.length} total keywords`);

        return categorized;
    }

    /**
     * Combine all text sources
     */
    combineText(content) {
        const parts = [
            content.title,
            content.metaDescription,
            content.articleContent || content.bodyText,
            ...content.headings.h1,
            ...content.headings.h2,
            ...content.headings.h3
        ];

        return parts.filter(Boolean).join(' ');
    }

    /**
     * Extract keywords using RAKE (Rapid Automatic Keyword Extraction)
     */
    async extractRAKEKeywords(text) {
        try {
            const rake = new SimpleRAKE({
                language: 'english',
                minWordLength: this.textProcessor.minKeywordLength
            });

            const keywords = rake.extract(text);

            // Return top keywords
            return keywords.slice(0, this.maxKeywords).map(kw => ({
                keyword: kw,
                method: 'rake'
            }));
        } catch (error) {
            log.warning(`RAKE extraction failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Extract keywords using TF-IDF
     */
    async extractTFIDFKeywords(text, sentences) {
        try {
            const tfidf = this.textProcessor.calculateTFIDF(sentences);
            const keywords = [];

            // Get top terms from first document (we only have one in this context)
            tfidf.listTerms(0).forEach(item => {
                if (item.term.length >= this.textProcessor.minKeywordLength) {
                    keywords.push({
                        keyword: item.term,
                        score: item.tfidf,
                        method: 'tfidf'
                    });
                }
            });

            // Sort by score and limit
            return keywords
                .sort((a, b) => b.score - a.score)
                .slice(0, this.maxKeywords);
        } catch (error) {
            log.warning(`TF-IDF extraction failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Extract meta keywords
     */
    async extractMetaKeywords(content) {
        const keywords = [];

        // From meta keywords tag
        if (content.metaKeywords) {
            const metaKws = content.metaKeywords
                .split(',')
                .map(kw => kw.trim())
                .filter(kw => kw.length >= this.textProcessor.minKeywordLength);

            keywords.push(...metaKws.map(kw => ({
                keyword: kw,
                method: 'meta'
            })));
        }

        // From title
        if (content.title) {
            const titleTokens = this.textProcessor.tokenize(content.title);
            const cleanTokens = this.textProcessor.removeStopwords(titleTokens);
            keywords.push(...cleanTokens.map(kw => ({
                keyword: kw,
                method: 'title'
            })));
        }

        return keywords;
    }

    /**
     * Extract keywords from headings
     */
    async extractHeadingKeywords(content) {
        const keywords = [];
        const allHeadings = [
            ...content.headings.h1,
            ...content.headings.h2,
            ...content.headings.h3
        ];

        allHeadings.forEach(heading => {
            const tokens = this.textProcessor.tokenize(heading);
            const cleanTokens = this.textProcessor.removeStopwords(tokens);
            keywords.push(...cleanTokens.map(kw => ({
                keyword: kw,
                method: 'heading'
            })));
        });

        return keywords;
    }

    /**
     * Extract named entities (people, places, organizations)
     */
    async extractEntities(text) {
        try {
            const compromise = require('compromise');
            const doc = compromise(text);

            const keywords = [];

            // Extract different entity types
            const people = doc.people().out('array');
            const places = doc.places().out('array');
            const organizations = doc.organizations().out('array');
            const topics = doc.topics().out('array');

            keywords.push(...people.map(e => ({ keyword: e.toLowerCase(), method: 'entity-person' })));
            keywords.push(...places.map(e => ({ keyword: e.toLowerCase(), method: 'entity-place' })));
            keywords.push(...organizations.map(e => ({ keyword: e.toLowerCase(), method: 'entity-org' })));
            keywords.push(...topics.map(e => ({ keyword: e.toLowerCase(), method: 'entity-topic' })));

            return keywords;
        } catch (error) {
            log.warning(`Entity extraction failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Merge keywords from different methods and calculate scores
     */
    mergeAndScore(results, fullText, sentences) {
        const keywordMap = new Map();

        // Combine all keywords
        const allKeywords = [
            ...results.rakeKeywords,
            ...results.tfidfKeywords,
            ...results.metaKeywords,
            ...results.headingKeywords,
            ...results.entityKeywords
        ];

        // Count frequency and methods
        allKeywords.forEach(item => {
            const kw = item.keyword.toLowerCase();

            if (!keywordMap.has(kw)) {
                keywordMap.set(kw, {
                    keyword: kw,
                    frequency: 0,
                    methods: new Set(),
                    tfidfScore: 0
                });
            }

            const entry = keywordMap.get(kw);
            entry.frequency += 1;
            entry.methods.add(item.method);
            if (item.score) entry.tfidfScore = Math.max(entry.tfidfScore, item.score);
        });

        // Calculate metrics for each keyword
        const keywords = Array.from(keywordMap.values()).map(kw => {
            const prominence = this.seoMetrics.calculateProminence(kw.keyword, fullText);
            const difficulty = this.seoMetrics.estimateKeywordDifficulty(kw.keyword, kw.frequency, keywordMap.size);
            const seoScore = this.seoMetrics.calculateSEOScore(kw.keyword, {
                prominence,
                frequency: kw.frequency,
                difficulty
            });

            return {
                ...kw,
                methods: Array.from(kw.methods),
                prominence,
                difficulty,
                seoScore,
                isLongTail: this.seoMetrics.isLongTail(kw.keyword),
                isQuestion: this.seoMetrics.isQuestion(kw.keyword),
                hasCommercialIntent: this.seoMetrics.hasCommercialIntent(kw.keyword),
                competition: this.seoMetrics.categorizeCompetition(difficulty)
            };
        });

        // Sort by SEO score
        return keywords.sort((a, b) => b.seoScore - a.seoScore);
    }

    /**
     * Categorize keywords into different groups
     */
    categorizeKeywords(keywords, fullText, sentences) {
        const limited = keywords.slice(0, this.maxKeywords);

        return {
            all: limited,
            topKeywords: limited
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, Math.min(20, this.maxKeywords)),
            longTailKeywords: limited
                .filter(kw => kw.isLongTail)
                .slice(0, Math.min(15, this.maxKeywords)),
            questionKeywords: limited
                .filter(kw => kw.isQuestion)
                .slice(0, Math.min(10, this.maxKeywords)),
            commercialKeywords: limited
                .filter(kw => kw.hasCommercialIntent)
                .slice(0, Math.min(15, this.maxKeywords)),
            competitionKeywords: {
                high: limited.filter(kw => kw.competition === 'high').slice(0, 10),
                medium: limited.filter(kw => kw.competition === 'medium').slice(0, 10),
                low: limited.filter(kw => kw.competition === 'low').slice(0, 10)
            },
            lsiKeywords: this.extractLSIKeywords(limited, fullText, sentences)
        };
    }

    /**
     * Extract LSI (Latent Semantic Indexing) keywords
     * These are semantically related keywords
     */
    extractLSIKeywords(keywords, fullText, sentences) {
        // Calculate co-occurrence
        const topKeywords = keywords.slice(0, 30).map(kw => kw.keyword);
        const coOccurrence = this.seoMetrics.calculateCoOccurrence(topKeywords, 5, sentences);

        // Find keywords that frequently co-occur with top keywords
        const lsiCandidates = new Map();

        Object.entries(coOccurrence).forEach(([pair, count]) => {
            if (count >= 2) { // Appear together at least twice
                const [kw1, kw2] = pair.split('|');
                lsiCandidates.set(kw1, (lsiCandidates.get(kw1) || 0) + count);
                lsiCandidates.set(kw2, (lsiCandidates.get(kw2) || 0) + count);
            }
        });

        // Convert to array and sort
        const lsiKeywords = Array.from(lsiCandidates.entries())
            .map(([keyword, score]) => {
                const original = keywords.find(kw => kw.keyword === keyword);
                return {
                    keyword,
                    lsiScore: score,
                    ...original
                };
            })
            .sort((a, b) => b.lsiScore - a.lsiScore)
            .slice(0, 15);

        return lsiKeywords;
    }
}

module.exports = ArticleAnalyzer;
