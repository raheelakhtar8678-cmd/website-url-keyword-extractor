/**
 * Test script for Keyword Extractor Actor
 * Run this locally to test the actor before deploying to Apify
 */

// Mock Apify environment for local testing
const mockApifyStorage = {
    keyValueStore: new Map(),
    dataset: []
};

const Actor = {
    init: async () => console.log('✓ Actor initialized'),
    exit: async () => console.log('✓ Actor exited'),
    getInput: async () => ({
        url: process.env.TEST_URL || 'https://en.wikipedia.org/wiki/Artificial_intelligence',
        extractionMode: 'auto',
        maxKeywords: 30,
        analysisDepth: 'quick',
        includeSearchSuggestions: false,
        generateReport: true,
        advancedOptions: {
            useProxy: false,
            minKeywordLength: 3,
            excludeStopwords: true
        }
    }),
    log: {
        info: (...args) => console.log('[INFO]', ...args),
        warning: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args),
        debug: (...args) => console.log('[DEBUG]', ...args)
    },
    pushData: async (data) => {
        mockApifyStorage.dataset.push(data);
        console.log('\n✓ Data pushed to dataset');
        console.log('Summary:', {
            url: data.url,
            contentType: data.contentType,
            totalKeywords: data.seoMetrics.totalKeywords,
            topKeywordsCount: data.keywords.topKeywords?.length || 0,
            longTailCount: data.keywords.longTailKeywords?.length || 0
        });
    },
    setValue: async (key, value, options = {}) => {
        mockApifyStorage.keyValueStore.set(key, value);
        console.log(`✓ Saved ${key} to key-value store`);
    },
    getValue: async (key) => {
        return mockApifyStorage.keyValueStore.get(key);
    },
    openKeyValueStore: async () => ({
        id: 'test-store-id'
    }),
    createProxyConfiguration: async () => null  // No proxy in local testing
};

// Replace the real Apify module
require.cache[require.resolve('apify')] = {
    exports: { Actor }
};

// Now run the main actor
console.log('='.repeat(60));
console.log('KEYWORD EXTRACTOR ACTOR - LOCAL TEST');
console.log('='.repeat(60));
console.log('\nUsing test configuration...\n');

const { main } = require('./src/main');

main().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    // Show results
    if (mockApifyStorage.dataset.length > 0) {
        const result = mockApifyStorage.dataset[0];

        console.log('\n📊 RESULTS SUMMARY:');
        console.log('-'.repeat(60));
        console.log(`URL: ${result.url}`);
        console.log(`Content Type: ${result.contentType}`);
        console.log(`Total Keywords: ${result.seoMetrics.totalKeywords}`);
        console.log(`Unique Keywords: ${result.seoMetrics.uniqueKeywords}`);
        console.log(`Avg Keyword Length: ${result.seoMetrics.avgKeywordLength.toFixed(2)} words`);

        console.log('\n🏆 TOP 10 KEYWORDS:');
        console.log('-'.repeat(60));
        result.keywords.topKeywords.slice(0, 10).forEach((kw, idx) => {
            console.log(`${idx + 1}. "${kw.keyword}" (freq: ${kw.frequency}, score: ${kw.seoScore.toFixed(0)})`);
        });

        if (result.keywords.longTailKeywords.length > 0) {
            console.log('\n🎯 SAMPLE LONG-TAIL KEYWORDS:');
            console.log('-'.repeat(60));
            result.keywords.longTailKeywords.slice(0, 5).forEach((kw, idx) => {
                console.log(`${idx + 1}. "${kw.keyword}"`);
            });
        }

        console.log('\n📈 COMPETITION BREAKDOWN:');
        console.log('-'.repeat(60));
        console.log(`High: ${result.seoMetrics.competitionBreakdown.high}`);
        console.log(`Medium: ${result.seoMetrics.competitionBreakdown.medium}`);
        console.log(`Low: ${result.seoMetrics.competitionBreakdown.low}`);

        if (result.reportUrl) {
            console.log(`\n📄 Report URL: ${result.reportUrl}`);
        }

        console.log('\n' + '='.repeat(60));

        // Save results to file for inspection
        const fs = require('fs');
        fs.writeFileSync('test-results.json', JSON.stringify(result, null, 2));
        console.log('✓ Full results saved to test-results.json');

        // Save HTML report if generated
        const htmlReport = mockApifyStorage.keyValueStore.get('report.html');
        if (htmlReport) {
            fs.writeFileSync('test-report.html', htmlReport);
            console.log('✓ HTML report saved to test-report.html');
            console.log('  Open test-report.html in your browser to view the report!');
        }
    }
}).catch(error => {
    console.error('\n' + '='.repeat(60));
    console.error('TEST FAILED');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
});
