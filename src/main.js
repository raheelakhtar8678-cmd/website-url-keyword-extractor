/**
 * Keyword Extractor Pro - Main Actor Entry Point
 * 
 * This Apify actor extracts keywords from any URL with advanced analysis:
 * - Article keyword extraction (TF-IDF, RAKE, entities)
 * - E-commerce search suggestion extraction
 * - Competition analysis
 * - LSI keyword detection
 * - Commercial intent detection
 * - Beautiful HTML reports
 */

const { Actor, log } = require('apify');
const Scraper = require('./scraper');
const ArticleAnalyzer = require('./analyzers/articleAnalyzer');
const EcommerceAnalyzer = require('./analyzers/ecommerceAnalyzer');
const ReportGenerator = require('./reportGenerator');
const SEOMetrics = require('./utils/seoMetrics');

async function main() {
    await Actor.init();

    log.info('='.repeat(60));
    log.info('KEYWORD EXTRACTOR PRO - STARTING');
    log.info('='.repeat(60));

    try {
        // Get input
        log.info('Fetching input...');
        const input = await Actor.getInput();

        log.info(`Input received: ${input ? 'Yes' : 'No'}`);

        if (!input) {
            throw new Error('No input received. Please provide input configuration.');
        }

        if (!input.url) {
            throw new Error('Input URL is required. Please provide a URL in the input.');
        }

        log.info('Starting Keyword Extractor Pro...', { url: input.url });

        // Validate URL
        let url;
        try {
            url = new URL(input.url);
        } catch (error) {
            throw new Error(`Invalid URL: ${input.url}`);
        }

        // Extract configuration
        const {
            extractionMode = 'auto',
            maxKeywords = 50,
            analysisDepth = 'standard',
            includeSearchSuggestions = true,
            searchFocusKeyword = '',
            generateReport = true,
            advancedOptions = {}
        } = input;

        // Initialize scraper
        const scraper = new Scraper({
            useProxy: advancedOptions.useProxy !== false,
            waitForSelector: advancedOptions.waitForSelector
        });

        // Scrape the page
        await scraper.navigateTo(input.url, advancedOptions.waitForSelector);
        const content = await scraper.extractContent();

        log.info('Page content extracted successfully');

        // Detect content type if auto mode
        let detectedType = extractionMode;
        if (extractionMode === 'auto') {
            detectedType = detectContentType(content);
            log.info(`Auto-detected content type: ${detectedType}`);
        }

        // Extract search suggestions for e-commerce
        let searchSuggestions = [];
        if ((detectedType === 'ecommerce' || detectedType === 'general') && includeSearchSuggestions) {
            log.info('Attempting to extract search suggestions...');
            searchSuggestions = await scraper.extractSearchSuggestions(searchFocusKeyword);
            log.info(`Found ${searchSuggestions.length} search suggestions`);
        }

        // Take screenshot for report (only if we have a valid browser session)
        if (content.extractionMethod !== 'fallback') {
            const screenshot = await scraper.takeScreenshot();
            if (screenshot) {
                await Actor.setValue('screenshot.png', screenshot, { contentType: 'image/png' });
            }
        } else {
            log.info('Skipping screenshot because fallback scraping was used (browser context likely lost/timed out)');
        }

        // Close browser
        await scraper.close();

        // Analyze keywords based on content type
        let keywordResults;

        const analyzerOptions = {
            maxKeywords,
            analysisDepth,
            minKeywordLength: advancedOptions.minKeywordLength || 3,
            excludeStopwords: advancedOptions.excludeStopwords !== false,
            language: advancedOptions.language || 'en',
            customStopwords: advancedOptions.customStopwords || []
        };

        if (detectedType === 'article') {
            log.info('Using Article Analyzer...');
            const analyzer = new ArticleAnalyzer(analyzerOptions);
            keywordResults = await analyzer.analyze(content);
        } else if (detectedType === 'ecommerce') {
            log.info('Using E-commerce Analyzer...');
            const analyzer = new EcommerceAnalyzer(analyzerOptions);
            keywordResults = await analyzer.analyze(content, searchSuggestions);
        } else {
            // General mode - use article analyzer as fallback
            log.info('Using General Analyzer (Article-based)...');
            const analyzer = new ArticleAnalyzer(analyzerOptions);
            keywordResults = await analyzer.analyze(content);
        }

        // Calculate SEO metrics
        const seoMetricsCalc = new SEOMetrics();
        const seoMetrics = {
            totalKeywords: keywordResults.all.length,
            uniqueKeywords: new Set(keywordResults.all.map(kw => kw.keyword)).size,
            avgKeywordLength: keywordResults.all.reduce((sum, kw) => sum + kw.keyword.split(' ').length, 0) / keywordResults.all.length || 0,
            competitionBreakdown: {
                high: keywordResults.competitionKeywords.high?.length || 0,
                medium: keywordResults.competitionKeywords.medium?.length || 0,
                low: keywordResults.competitionKeywords.low?.length || 0
            }
        };

        // Prepare output data
        const outputData = {
            url: input.url,
            urlHostname: url.hostname,
            contentType: detectedType,
            extractedAt: new Date().toISOString(),

            // Keywords by category
            keywords: {
                topKeywords: keywordResults.topKeywords || [],
                longTailKeywords: keywordResults.longTailKeywords || [],
                lsiKeywords: keywordResults.lsiKeywords || [],
                questionKeywords: keywordResults.questionKeywords || [],
                commercialKeywords: keywordResults.commercialKeywords || [],
                competitionKeywords: keywordResults.competitionKeywords || { high: [], medium: [], low: [] },
                searchSuggestions: keywordResults.searchSuggestions || [],
                all: keywordResults.all || []
            },

            // SEO metrics
            seoMetrics,

            // Metadata
            pageMetadata: {
                title: content.title,
                metaDescription: content.metaDescription,
                headingsCount: {
                    h1: content.headings.h1.length,
                    h2: content.headings.h2.length,
                    h3: content.headings.h3.length
                }
            }
        };

        // Generate HTML report
        let reportUrl = null;
        if (generateReport) {
            const reportGenerator = new ReportGenerator();
            reportUrl = await reportGenerator.generateReport(outputData);
            outputData.reportUrl = reportUrl;

            log.info('='.repeat(60));
            log.info(`📄 REPORT GENERATED: ${reportUrl}`);
            log.info('='.repeat(60));
        }

        // Save to dataset
        await Actor.pushData(outputData);

        log.info('Keyword extraction completed successfully!', {
            totalKeywords: seoMetrics.totalKeywords,
            contentType: detectedType,
            reportUrl
        });

        // Exit successfully
        await Actor.exit();

    } catch (error) {
        log.error('='.repeat(60));
        log.error('ACTOR FAILED WITH ERROR');
        log.error('='.repeat(60));
        log.error('Error message:', error.message);
        log.error('Error stack:', error.stack);
        log.error('Error details:', JSON.stringify(error, null, 2));

        // Make sure the error is thrown so Apify marks the run as failed
        await Actor.fail(error.message);
    }
}

/**
 * Detect content type based on page characteristics
 */
function detectContentType(content) {
    // Check for e-commerce indicators
    const hasProductInfo = content.hasProductInfo ||
        content.schemaData?.some(schema =>
            schema['@type'] === 'Product' ||
            schema['@type']?.includes('Product')
        );

    const hasSearchBox = content.hasSearchBox;

    // Check for article indicators
    const hasArticleStructure = content.hasArticleStructure ||
        content.schemaData?.some(schema =>
            schema['@type']?.includes('Article') ||
            schema['@type']?.includes('NewsArticle') ||
            schema['@type']?.includes('BlogPosting')
        );

    const hasSubstantialArticleContent = content.articleContent && content.articleContent.length > 1000;

    // Determine type
    if (hasProductInfo || (hasSearchBox && !hasArticleStructure)) {
        return 'ecommerce';
    } else if (hasArticleStructure || hasSubstantialArticleContent) {
        return 'article';
    } else {
        return 'general';
    }
}

// Run the actor
main();

module.exports = { main, detectContentType };
