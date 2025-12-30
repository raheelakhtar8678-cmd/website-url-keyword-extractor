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

        try {
            // Navigate with timeout
            await this.page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 60000
            });

            // Wait for specific selector if provided
            if (waitForSelector) {
                await this.page.waitForSelector(waitForSelector, { timeout: 10000 });
            } else {
                // Wait for body to be loaded
                await this.page.waitForSelector('body', { timeout: 10000 });
            }

            // Additional wait for dynamic content
            await this.page.waitForTimeout(2000);

            log.info('Page loaded successfully');

            return true;
        } catch (error) {
            log.error(`Failed to navigate to ${url}: ${error.message}`);
            throw error;
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
                bodyText: document.body.innerText || '',
                articleContent: getVisibleText('article, [role="main"], main, .content, .post-content, .entry-content'),

                // Links
                links: Array.from(document.querySelectorAll('a')).map(a => ({
                    text: a.textContent.trim(),
                    href: a.href
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

        return content;
    }

    /**
     * Extract search suggestions (for ecommerce sites)
     */
    async extractSearchSuggestions(searchTerm = '') {
        try {
            // Find search input
            const searchInput = await this.page.$('input[type="search"], input[name*="search"], input[placeholder*="search" i]');

            if (!searchInput) {
                log.warning('No search input found on page');
                return [];
            }

            const suggestions = [];

            // Try different common search terms to extract suggestions
            const testTerms = searchTerm ? [searchTerm] : ['a', 'b', 'c', 'the', 'best'];

            for (const term of testTerms) {
                try {
                    // Clear and type
                    await searchInput.fill('');
                    await searchInput.type(term, { delay: 100 });

                    // Wait for suggestions to appear
                    await this.page.waitForTimeout(1000);

                    // Extract suggestions (common selectors)
                    const termSuggestions = await this.page.evaluate(() => {
                        const suggestionSelectors = [
                            '[role="listbox"] li',
                            '.autocomplete-suggestion',
                            '.search-suggestion',
                            '[class*="suggestion"]',
                            '[class*="autocomplete"] li',
                            '.ui-menu-item'
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
