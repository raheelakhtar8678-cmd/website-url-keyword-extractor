/**
 * Playwright-based scraper with Cloudflare bypass
 */

const { chromium } = require('playwright');
const { Actor, log } = require('apify');

class Scraper {
    constructor(options = {}) {
        this.options = options;
        this.browser = null;
        this.page = null;
    }

    /**
     * Initialize browser with stealth settings
     */
    async initialize() {
        const proxyConfig = this.options.useProxy ? await Actor.createProxyConfiguration() : null;

        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--disable-blink-features=AutomationControlled'
            ]
        };

        if (proxyConfig) {
            const proxyUrl = await proxyConfig.newUrl();
            launchOptions.proxy = {
                server: proxyUrl
            };
        }

        this.browser = await chromium.launch(launchOptions);

        const context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York',
            permissions: [],
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        // Additional stealth measures
        await context.addInitScript(() => {
            // Override the navigator.webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            // Mock plugins and languages
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });

            // Mock chrome object
            window.chrome = {
                runtime: {},
            };

            // Mock permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        });

        this.page = await context.newPage();

        log.info('Browser initialized with stealth settings');
    }

    /**
     * Navigate to URL and wait for content
     */
    async navigateTo(url, waitForSelector = null) {
        if (!this.page) {
            await this.initialize();
        }

        log.info(`Navigating to: ${url}`);
        this.currentUrl = url;

        try {
            // First attempt: Standard navigation
            // using domcontentloaded is faster and more reliable than networkidle
            await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });

            // Wait for specific selector if provided
            try {
                if (waitForSelector) {
                    await this.page.waitForSelector(waitForSelector, { timeout: 30000 });
                } else {
                    // Try waiting for multiple common load indicators
                    await Promise.race([
                        this.page.waitForSelector('body', { timeout: 30000 }),
                        this.page.waitForSelector('h1', { timeout: 30000 }),
                        this.page.waitForSelector('main', { timeout: 30000 }),
                        this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { })
                    ]);
                }
            } catch (waitError) {
                log.warning(`Selector wait timed out, but continuing as page might be loaded: ${waitError.message}`);
            }

            // Additional wait for dynamic content
            await this.verifyContent();

            log.info('Page loaded successfully');
            return true;

        } catch (error) {
            log.warning(`Primary navigation failed: ${error.message}. Retrying with relaxed settings...`);

            try {
                // Retry with minimal wait requirements
                await this.page.goto(url, {
                    waitUntil: 'commit',
                    timeout: 60000
                });

                // Wait for content to actually populate
                await this.verifyContent();

                log.info('Secondary navigation successful');
                return true;
            } catch (retryError) {
                log.error(`Failed to navigate to ${url}: ${retryError.message}`);
                throw retryError;
            }
        }
    }

    /**
     * Verify that page has actual content
     */
    async verifyContent() {
        log.info('Verifying page content...');
        try {
            await this.page.waitForFunction(() => {
                return document.body && document.body.innerText.length > 200;
            }, { timeout: 15000 }); // Wait up to 15s for meaningful content
        } catch (e) {
            log.warning('Content verification timed out. Page might be empty, blocked, or still loading.');
        }
    }


    /**
     * Extract page content
     */
    async extractContent() {
        const content = await this.page.evaluate(() => {
            // Helper to check if element is visible
            const isVisible = (elem) => {
                if (!elem) return false;
                const style = window.getComputedStyle(elem);
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0';
            };

            // Extract text from visible elements only
            const getVisibleText = (selector) => {
                const elements = document.querySelectorAll(selector);
                return Array.from(elements)
                    .filter(el => isVisible(el))
                    .map(el => el.textContent)
                    .join(' ');
            };

            return {
                // Meta information
                title: document.title || '',
                metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                metaKeywords: document.querySelector('meta[name="keywords"]')?.content || '',

                // Content sections
                headings: {
                    h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
                    h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
                    h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim())
                },

                // Main content
                bodyText: document.body ? (document.body.innerText || '') : '',
                articleContent: getVisibleText('article, [role="main"], main, .content, .post-content, .entry-content'),

                // Links
                links: Array.from(document.querySelectorAll('a')).map(a => ({
                    text: a.textContent ? a.textContent.trim() : '',
                    href: a.href || ''
                })),

                // Images
                images: Array.from(document.querySelectorAll('img')).map(img => ({
                    alt: img.alt,
                    src: img.src
                })),

                // Schema.org data
                schemaData: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
                    .map(script => {
                        try {
                            return JSON.parse(script.textContent);
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(data => data !== null),

                // Page type detection
                hasSearchBox: !!document.querySelector('input[type="search"], input[name*="search"], input[placeholder*="search" i]'),
                hasProductInfo: !!document.querySelector('[itemprop="price"], .price, [class*="price"]'),
                hasArticleStructure: !!document.querySelector('article, [itemtype*="Article"]'),

                // URL
                url: window.location.href
            };
        });

        if (content && content.bodyText && content.bodyText.length > 200) {
            return content;
        }

        log.warning('Playwright extracted insufficient content. Attempting fallback scrape with got-scraping...');
        return await this.fallbackScrape(this.currentUrl || this.page.url());
    }

    /**
     * Fallback scraping using got-scraping (bypasses some JS blocks)
     */
    async fallbackScrape(url) {
        try {
            const { gotScraping } = require('got-scraping');
            const cheerio = require('cheerio');

            const response = await gotScraping({
                url,
                headerGeneratorOptions: {
                    browsers: [{ name: 'chrome', minVersion: 110 }],
                    devices: ['desktop'],
                    locales: ['en-US', 'en'],
                    operatingSystems: ['windows'],
                }
            });

            const $ = cheerio.load(response.body);
            const bodyText = $('body').text().trim();

            // Extract using cheerio
            const getVisibleText = (selector) => {
                return $(selector).text().replace(/\s+/g, ' ').trim();
            };

            return {
                title: $('title').text() || '',
                metaDescription: $('meta[name="description"]').attr('content') || '',
                metaKeywords: $('meta[name="keywords"]').attr('content') || '',
                headings: {
                    h1: $('h1').map((i, el) => $(el).text().trim()).get(),
                    h2: $('h2').map((i, el) => $(el).text().trim()).get(),
                    h3: $('h3').map((i, el) => $(el).text().trim()).get()
                },
                bodyText: bodyText,
                articleContent: getVisibleText('article, [role="main"], main, .content, .post-content, .entry-content'),
                links: $('a').map((i, el) => ({
                    text: $(el).text().trim(),
                    href: $(el).attr('href')
                })).get(),
                images: $('img').map((i, el) => ({
                    alt: $(el).attr('alt') || '',
                    src: $(el).attr('src') || ''
                })).get(),
                schemaData: [], // Hard to parse JSON-LD with regex reliably, skipping for fallback
                hasSearchBox: $('input[type="search"]').length > 0,
                hasProductInfo: $('[itemprop="price"]').length > 0,
                hasArticleStructure: $('article').length > 0,
                url: url
            };

        } catch (error) {
            log.error(`Fallback scraping failed: ${error.message}`);
            throw new Error('Insufficient content for analysis (both Playwright and Fallback failed)');
        }
    }

    /**
     * Extract search suggestions (for ecommerce sites)
     */
    async extractSearchSuggestions(searchTerm = '') {
        try {
            // Find search input - Expanded selectors for better compatibility (including 'q' for Google/general sites)
            const searchInput = await this.page.$('input[type="search"], input[name*="search"], input[placeholder*="search" i], input[name="q"], textarea[name="q"]');

            if (!searchInput) {
                log.warning('No search input found on page');
                return [];
            }

            const suggestions = [];

            // Try different common search terms to extract suggestions
            // If custom keyword is provided, use ONLY that. Otherwise use generic terms.
            const testTerms = searchTerm ? [searchTerm] : ['a', 'b', 'c', 'the', 'best'];

            for (const term of testTerms) {
                try {
                    // Clear and type
                    await searchInput.fill('');
                    await searchInput.type(term, { delay: 100 });

                    // Wait for suggestions to appear
                    await this.page.waitForTimeout(2000); // Increased wait time slightly

                    // Extract suggestions (common selectors)
                    const termSuggestions = await this.page.evaluate(() => {
                        const suggestionSelectors = [
                            '[role="listbox"] li',
                            '[role="listbox"] div[role="option"]', // ARIA standard
                            'ul[role="listbox"] > li',
                            '.autocomplete-suggestion',
                            '.search-suggestion',
                            '[class*="suggestion"]',
                            '[class*="autocomplete"] li',
                            '.ui-menu-item',
                            '.s-suggestion', // Amazon
                            'li.sbct' // Common on some search engines
                        ];

                        for (const selector of suggestionSelectors) {
                            const elements = document.querySelectorAll(selector);
                            if (elements.length > 0) {
                                return Array.from(elements)
                                    .map(el => el.textContent.trim())
                                    .filter(text => text.length > 0);
                            }
                        }

                        return [];
                    });

                    suggestions.push(...termSuggestions);
                } catch (err) {
                    // Continue with next term
                }
            }

            // Remove duplicates
            return [...new Set(suggestions)];

        } catch (error) {
            log.warning(`Failed to extract search suggestions: ${error.message}`);
            return [];
        }
    }

    /**
     * Take screenshot
     */
    async takeScreenshot() {
        if (!this.page) return null;

        try {
            const screenshot = await this.page.screenshot({
                fullPage: false,
                type: 'png'
            });

            return screenshot;
        } catch (error) {
            log.warning(`Failed to take screenshot: ${error.message}`);
            return null;
        }
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            log.info('Browser closed');
        }
    }
}

module.exports = Scraper;
