/**
 * E-commerce keyword analyzer
 * Extracts search suggestions, product keywords, and category terms
 */

const TextProcessor = require('../utils/textProcessor');
const SEOMetrics = require('../utils/seoMetrics');
const { Actor } = require('apify');

class EcommerceAnalyzer {
    constructor(options = {}) {
        this.textProcessor = new TextProcessor(options);
        this.seoMetrics = new SEOMetrics();
        this.maxKeywords = options.maxKeywords || 50;
    }

    /**
     * Analyze e-commerce site and extract keywords
     */
    async analyze(content, searchSuggestions = []) {
        Actor.log.info('Starting e-commerce keyword analysis...');

        const results = {
            searchSuggestions: this.processSearchSuggestions(searchSuggestions),
            productKeywords: this.extractProductKeywords(content),
            categoryKeywords: this.extractCategoryKeywords(content),
            priceRelatedKeywords: this.extractPriceKeywords(content),
            brandKeywords: this.extractBrandKeywords(content)
        };

        // Merge all keywords
        const mergedKeywords = this.mergeKeywords(results, content);

        // Categorize for e-commerce
        const categorized = this.categorizeKeywords(mergedKeywords, content);

        Actor.log.info(`Extracted ${categorized.all.length} total keywords`);

        return categorized;
    }

    /**
     * Process search suggestions
     */
    processSearchSuggestions(suggestions) {
        return suggestions.map(suggestion => ({
            keyword: suggestion.toLowerCase(),
            method: 'search-suggestion',
            frequency: 1,
            isSearchTerm: true
        }));
    }

    /**
     * Extract product-related keywords
     */
    extractProductKeywords(content) {
        const keywords = [];

        // From schema data (product schema)
        if (content.schemaData) {
            content.schemaData.forEach(schema => {
                if (schema['@type'] === 'Product' || schema['@type']?.includes('Product')) {
                    if (schema.name) {
                        const tokens = this.textProcessor.tokenize(schema.name);
                        const clean = this.textProcessor.removeStopwords(tokens);
                        keywords.push(...clean.map(kw => ({
                            keyword: kw,
                            method: 'product-schema'
                        })));
                    }

                    if (schema.category) {
                        keywords.push({
                            keyword: schema.category.toLowerCase(),
                            method: 'product-category'
                        });
                    }

                    if (schema.brand?.name) {
                        keywords.push({
                            keyword: schema.brand.name.toLowerCase(),
                            method: 'product-brand'
                        });
                    }
                }
            });
        }

        // From image alt text (often contains product info)
        content.images.forEach(img => {
            if (img.alt) {
                const tokens = this.textProcessor.tokenize(img.alt);
                const clean = this.textProcessor.removeStopwords(tokens);
                keywords.push(...clean.map(kw => ({
                    keyword: kw,
                    method: 'image-alt'
                })));
            }
        });

        return keywords;
    }

    /**
     * Extract category keywords from links and navigation
     */
    extractCategoryKeywords(content) {
        const keywords = [];
        const categoryPatterns = [
            /category/i,
            /department/i,
            /shop/i,
            /collection/i,
            /browse/i
        ];

        content.links.forEach(link => {
            // Check if link is likely a category link
            const isCategory = categoryPatterns.some(pattern =>
                pattern.test(link.href) || pattern.test(link.text)
            );

            if (isCategory && link.text) {
                const tokens = this.textProcessor.tokenize(link.text);
                const clean = this.textProcessor.removeStopwords(tokens);
                keywords.push(...clean.map(kw => ({
                    keyword: kw,
                    method: 'category-link'
                })));
            }
        });

        return keywords;
    }

    /**
     * Extract price-related and commercial keywords
     */
    extractPriceKeywords(content) {
        const keywords = [];
        const text = content.bodyText.toLowerCase();

        const priceTerms = [
            'discount', 'sale', 'offer', 'deal', 'coupon', 'promo',
            'free shipping', 'clearance', 'special', 'limited',
            'save', 'off', 'cheap', 'affordable', 'budget',
            'premium', 'luxury', 'exclusive'
        ];

        priceTerms.forEach(term => {
            if (text.includes(term)) {
                keywords.push({
                    keyword: term,
                    method: 'price-term',
                    hasCommercialIntent: true
                });
            }
        });

        return keywords;
    }

    /**
     * Extract brand keywords
     */
    extractBrandKeywords(content) {
        const keywords = [];

        // From title (often contains brand)
        if (content.title) {
            const titleParts = content.title.split(/[-|•]/);
            if (titleParts.length > 1) {
                // Last part often contains brand or site name
                const brand = titleParts[titleParts.length - 1].trim();
                const tokens = this.textProcessor.tokenize(brand);
                keywords.push(...tokens.map(kw => ({
                    keyword: kw,
                    method: 'brand-title'
                })));
            }
        }

        // From schema
        if (content.schemaData) {
            content.schemaData.forEach(schema => {
                if (schema.brand?.name) {
                    keywords.push({
                        keyword: schema.brand.name.toLowerCase(),
                        method: 'brand-schema'
                    });
                }
            });
        }

        return keywords;
    }

    /**
     * Merge keywords from different sources
     */
    mergeKeywords(results, content) {
        const keywordMap = new Map();

        const allKeywords = [
            ...results.searchSuggestions,
            ...results.productKeywords,
            ...results.categoryKeywords,
            ...results.priceRelatedKeywords,
            ...results.brandKeywords
        ];

        allKeywords.forEach(item => {
            const kw = item.keyword.toLowerCase();

            if (kw.length < this.textProcessor.minKeywordLength) return;

            if (!keywordMap.has(kw)) {
                keywordMap.set(kw, {
                    keyword: kw,
                    frequency: 0,
                    methods: new Set(),
                    isSearchTerm: item.isSearchTerm || false,
                    hasCommercialIntent: item.hasCommercialIntent || false
                });
            }

            const entry = keywordMap.get(kw);
            entry.frequency += 1;
            entry.methods.add(item.method);
            if (item.isSearchTerm) entry.isSearchTerm = true;
            if (item.hasCommercialIntent) entry.hasCommercialIntent = true;
        });

        // Calculate metrics
        const keywords = Array.from(keywordMap.values()).map(kw => {
            const fullText = content.bodyText;
            const prominence = this.seoMetrics.calculateProminence(kw.keyword, fullText);
            const difficulty = this.seoMetrics.estimateKeywordDifficulty(kw.keyword, kw.frequency, keywordMap.size);

            // Boost score for search suggestions (they're valuable!)
            let seoScore = this.seoMetrics.calculateSEOScore(kw.keyword, {
                prominence,
                frequency: kw.frequency,
                difficulty
            });

            if (kw.isSearchTerm) seoScore += 20; // Bonus for actual search terms

            return {
                ...kw,
                methods: Array.from(kw.methods),
                prominence,
                difficulty,
                seoScore,
                isLongTail: this.seoMetrics.isLongTail(kw.keyword),
                isQuestion: this.seoMetrics.isQuestion(kw.keyword),
                competition: this.seoMetrics.categorizeCompetition(difficulty)
            };
        });

        return keywords.sort((a, b) => b.seoScore - a.seoScore);
    }

    /**
     * Categorize keywords for e-commerce
     */
    categorizeKeywords(keywords, content) {
        const limited = keywords.slice(0, this.maxKeywords);

        return {
            all: limited,
            searchSuggestions: limited
                .filter(kw => kw.isSearchTerm)
                .slice(0, 20),
            topKeywords: limited
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 20),
            longTailKeywords: limited
                .filter(kw => kw.isLongTail)
                .slice(0, 15),
            commercialKeywords: limited
                .filter(kw => kw.hasCommercialIntent || kw.methods.includes('price-term'))
                .slice(0, 20),
            productKeywords: limited
                .filter(kw => kw.methods.includes('product-schema') || kw.methods.includes('product-category'))
                .slice(0, 15),
            brandKeywords: limited
                .filter(kw => kw.methods.includes('brand-schema') || kw.methods.includes('brand-title'))
                .slice(0, 10),
            competitionKeywords: {
                high: limited.filter(kw => kw.competition === 'high').slice(0, 10),
                medium: limited.filter(kw => kw.competition === 'medium').slice(0, 10),
                low: limited.filter(kw => kw.competition === 'low').slice(0, 10)
            },
            // LSI would be similar keywords
            lsiKeywords: this.findSimilarKeywords(limited).slice(0, 15)
        };
    }

    /**
     * Find similar/related keywords based on common terms
     */
    findSimilarKeywords(keywords) {
        const wordGroups = new Map();

        // Group keywords by common words
        keywords.forEach(kw => {
            const words = kw.keyword.split(' ');
            words.forEach(word => {
                if (!wordGroups.has(word)) {
                    wordGroups.set(word, []);
                }
                wordGroups.get(word).push(kw);
            });
        });

        // Find keywords that share words (LSI candidates)
        const lsiScores = new Map();

        wordGroups.forEach((group, word) => {
            if (group.length > 1) { // Word appears in multiple keywords
                group.forEach(kw => {
                    lsiScores.set(kw.keyword, (lsiScores.get(kw.keyword) || 0) + group.length);
                });
            }
        });

        // Convert to array and sort
        return Array.from(lsiScores.entries())
            .map(([keyword, lsiScore]) => {
                const original = keywords.find(kw => kw.keyword === keyword);
                return {
                    ...original,
                    lsiScore
                };
            })
            .sort((a, b) => b.lsiScore - a.lsiScore);
    }
}

module.exports = EcommerceAnalyzer;
