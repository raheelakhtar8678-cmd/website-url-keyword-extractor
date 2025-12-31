# Keyword Extractor Pro - Advanced SEO Analysis Actor 🔍

Extract comprehensive keyword insights from any URL with advanced analysis including competition levels, LSI keywords, commercial intent, and more!

## ✨ Features

- **🌐 Universal URL Support**: Works with articles, e-commerce sites, blogs, and general web pages
- **🛡️ Cloudflare Bypass**: Advanced stealth techniques to bypass Cloudflare and other protections
- **🔄 Hybrid Scraping Strategy**: Smart fallback mechanism that switches to HTTP scraping (got-scraping) if browser automation is blocked
- **🎯 Dual Extraction Modes**:
  - **Article Mode**: TF-IDF, RAKE, entity extraction, heading analysis
  - **E-commerce Mode**: Search suggestions, product keywords, category analysis
  - **Auto-Detect**: Automatically determines the best approach
- **📊 Advanced Categorization**:
  - Top keywords by frequency
  - Long-tail keywords (3+ words)
  - LSI (semantically related) keywords
  - Competition analysis (high/medium/low)
  - Commercial intent detection
  - Question-based keywords
- **📄 Beautiful HTML Reports**: Visual reports with charts, tables, and export options
- **💾 Multiple Export Formats**: JSON, CSV, and interactive HTML

## 🚀 Quick Start

### Input Configuration

```json
{
  "url": "https://example.com/article-or-product-page",
  "extractionMode": "auto",
  "maxKeywords": 50,
  "analysisDepth": "standard",
  "includeSearchSuggestions": true,
  "generateReport": true
}
```

### Input Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `url` | String | **Required**. The URL to analyze | - |
| `extractionMode` | String | Extraction strategy: `auto`, `article`, `ecommerce`, `general` | `auto` |
| `maxKeywords` | Integer | Maximum keywords per category (10-200) | `50` |
| `analysisDepth` | String | Analysis depth: `quick`, `standard`, `deep` | `standard` |
| `includeSearchSuggestions` | Boolean | Extract search autocomplete suggestions | `true` |
| `generateReport` | Boolean | Generate HTML report with visualizations | `true` |

### Advanced Options

```json
{
  "advancedOptions": {
    "useProxy": true,
    "waitForSelector": "article",
    "minKeywordLength": 3,
    "excludeStopwords": true,
    "language": "en",
    "customStopwords": ["example", "test"]
  }
}
```

## 📊 Output Format

### Dataset Output

Each actor run produces a comprehensive JSON object:

```json
{
  "url": "https://example.com",
  "contentType": "article",
  "extractedAt": "2025-12-30T20:47:08Z",
  "keywords": {
    "topKeywords": [...],
    "longTailKeywords": [...],
    "lsiKeywords": [...],
    "questionKeywords": [...],
    "commercialKeywords": [...],
    "competitionKeywords": {
      "high": [...],
      "medium": [...],
      "low": [...]
    },
    "searchSuggestions": [...],
    "all": [...]
  },
  "seoMetrics": {
    "totalKeywords": 150,
    "uniqueKeywords": 95,
    "avgKeywordLength": 2.3,
    "competitionBreakdown": {...}
  },
  "pageMetadata": {
    "title": "...",
    "metaDescription": "...",
    "headingsCount": {...}
  },
  "reportUrl": "https://api.apify.com/v2/..."
}
```

### Keyword Object Structure

Each keyword includes:

```json
{
  "keyword": "example keyword",
  "frequency": 5,
  "prominence": 85,
  "difficulty": 45,
  "seoScore": 78,
  "competition": "medium",
  "isLongTail": false,
  "isQuestion": false,
  "hasCommercialIntent": false,
  "methods": ["rake", "tfidf", "heading"]
}
```

## 📈 Use Cases

### 1. SEO Content Analysis
Analyze your own content to discover keyword opportunities and optimize for search engines.

### 2. Competitor Research
Extract keywords from competitor pages to understand their targeting strategy.

### 3. E-commerce Optimization
Capture search suggestions from e-commerce sites to understand customer search behavior.

### 4. Content Planning
Identify question-based keywords for FAQ sections and long-tail opportunities.

### 5. PPC Campaign Research
Find commercial intent keywords for paid advertising campaigns.

## 🎨 HTML Report Features

The generated HTML report includes:

- **Executive Summary**: Key metrics at a glance
- **Visual Charts**: Competition distribution, keyword trends
- **Categorized Tables**: Keywords organized by type and importance
- **SEO Insights**: Automated recommendations based on analysis
- **Export Options**: Download as JSON or print as PDF
- **Responsive Design**: Beautiful on all devices

## 🔧 Technical Details

### Extraction Methods

1. **RAKE**: Rapid Automatic Keyword Extraction algorithm
2. **TF-IDF**: Term Frequency-Inverse Document Frequency scoring
3. **NLP Entities**: Named entity recognition (people, places, organizations)
4. **Meta Analysis**: Meta tags, title, and description parsing
5. **DOM Analysis**: Heading hierarchy and structure
6. **Co-occurrence**: LSI keyword detection through semantic relationships

### Cloudflare Bypass Techniques

- User-Agent rotation
- Navigator property mocking
- Playwright stealth mode
- **Smart Fallback**: Automatic switch to header-mimicking HTTP requests (got-scraping) for stubborn sites
- Apify proxy integration
- Cookie and session handling

## 📝 Examples

### Example 1: Analyze a Blog Post

```json
{
  "url": "https://techblog.com/ai-trends-2025",
  "extractionMode": "article",
  "analysisDepth": "deep",
  "generateReport": true
}
```

### Example 2: E-commerce Product Page

```json
{
  "url": "https://shop.com/products/laptop",
  "extractionMode": "ecommerce",
  "includeSearchSuggestions": true,
  "maxKeywords": 100
}
```

### Example 3: Competitor Analysis

```json
{
  "url": "https://competitor.com/services",
  "extractionMode": "auto",
  "analysisDepth": "deep",
  "advancedOptions": {
    "useProxy": true,
    "language": "en"
  }
}
```

## 🤝 Support

For issues, questions, or feature requests, please contact support or open an issue in the actor's repository.

## 📄 License

Apache-2.0

## 🏷️ Keywords

SEO, keyword extraction, keyword research, content analysis, competition analysis, LSI keywords, long-tail keywords, e-commerce SEO, Cloudflare bypass, web scraping, NLP, TF-IDF, RAKE

---

**Made with ❤️ for SEO professionals and content marketers**
