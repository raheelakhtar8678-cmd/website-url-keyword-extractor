# Changelog

All notable changes to this actor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-30

### Added
- Initial release of Keyword Extractor Pro
- Playwright-based scraper with Cloudflare bypass capabilities
- Dual analysis modes: Article and E-commerce
- Auto-detection of content type
- Multiple keyword extraction methods:
  - RAKE (Rapid Automatic Keyword Extraction)
  - TF-IDF scoring
  - Named Entity Recognition
  - Meta tag analysis
  - Heading hierarchy analysis
  - Search suggestion capture
- Comprehensive keyword categorization:
  - Top keywords by frequency
  - Long-tail keywords (3+ words)
  - LSI (Latent Semantic Indexing) keywords
  - Competition-based categories (high/medium/low)
  - Commercial intent keywords
  - Question-based keywords
  - Search suggestions
- SEO metrics calculation:
  - Keyword density
  - Prominence scoring
  - Difficulty estimation
  - SEO score (0-100)
- Beautiful HTML report generation with:
  - Modern gradient design
  - Interactive charts and visualizations
  - Export to JSON and PDF
  - Responsive layout
  - SEO insights and recommendations
- Visual input schema with organized sections
- Advanced configuration options:
  - Proxy support
  - Custom stopwords
  - Language selection
  - Minimum keyword length
  - Wait for selector
- Comprehensive error handling and logging
- Local testing capability
- Example configurations for different use cases
- Detailed documentation (README, EXAMPLES, CHANGELOG)

### Technical Details
- Built with Apify SDK v3
- Playwright v1.40 for browser automation
- Natural.js for NLP processing
- Compromise.js for entity extraction
- Stopword library for multi-language support
- Custom RAKE implementation
- Pure CSS visualizations (no external chart libraries)

### Notes
- Tested with various content types (articles, e-commerce, general web pages)
- Cloudflare bypass works with most standard protections
- Processing time: 30-60 seconds for deep analysis
- Recommended memory: 512MB minimum
- Compatible with Apify proxy for better bypass capabilities

---

## Future Roadmap

### Planned for v1.1.0
- [ ] Multi-URL batch processing
- [ ] Keyword comparison across multiple pages
- [ ] Historical keyword tracking
- [ ] Export to CSV format
- [ ] Custom report templates

### Planned for v1.2.0
- [ ] AI-powered keyword clustering
- [ ] Search volume estimation integration
- [ ] Keyword difficulty API integration
- [ ] Competitor keyword gap analysis
- [ ] Content optimization suggestions

### Planned for v2.0.0
- [ ] Real-time keyword monitoring
- [ ] SERP feature detection
- [ ] Backlink keyword analysis
- [ ] Multi-language optimization
- [ ] Custom NLP model training

---

## Support

For bug reports, feature requests, or questions:
- Create an issue in the repository
- Contact support through Apify platform
- Check the [README.md](README.md) for documentation

---

**Maintained by**: Your Name
**License**: Apache-2.0
