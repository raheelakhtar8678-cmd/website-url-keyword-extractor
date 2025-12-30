# Example Input Configurations

This directory contains example input configurations for different use cases.

## Example 1: Analyze News Article

**Use Case**: Extract keywords from a news article for SEO optimization

```json
{
  "url": "https://techcrunch.com/2024/01/15/ai-revolution-continues/",
  "extractionMode": "article",
  "maxKeywords": 50,
  "analysisDepth": "deep",
  "includeSearchSuggestions": false,
  "generateReport": true,
  "advancedOptions": {
    "useProxy": true,
    "minKeywordLength": 3,
    "excludeStopwords": true,
    "language": "en"
  }
}
```

**Expected Output**:
- Top keywords related to AI and technology
- Long-tail keywords for specific concepts
- Question keywords for FAQ sections
- LSI keywords for semantic SEO

---

## Example 2: E-commerce Product Page

**Use Case**: Extract product keywords and search suggestions from Amazon

```json
{
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "extractionMode": "ecommerce",
  "maxKeywords": 100,
  "analysisDepth": "standard",
  "includeSearchSuggestions": true,
  "generateReport": true,
  "advancedOptions": {
    "useProxy": true,
    "excludeStopwords": true
  }
}
```

**Expected Output**:
- Product-related keywords
- Brand keywords
- Search autocomplete suggestions
- Commercial intent keywords
- Category keywords

---

## Example 3: Competitor Analysis

**Use Case**: Analyze competitor's landing page for SEO strategy

```json
{
  "url": "https://competitor.com/services/consulting",
  "extractionMode": "auto",
  "maxKeywords": 75,
  "analysisDepth": "deep",
  "includeSearchSuggestions": false,
  "generateReport": true,
  "advancedOptions": {
    "useProxy": true,
    "minKeywordLength": 4,
    "excludeStopwords": true,
    "customStopwords": ["copyright", "reserved", "rights"]
  }
}
```

**Expected Output**:
- High-value keywords competitors are targeting
- Competition level analysis
- LSI keywords for content gap analysis
- Commercial vs informational keyword breakdown

---

## Example 4: Blog Post Optimization

**Use Case**: Quick analysis of your own blog post

```json
{
  "url": "https://yourblog.com/ultimate-guide-to-seo",
  "extractionMode": "article",
  "maxKeywords": 30,
  "analysisDepth": "quick",
  "includeSearchSuggestions": false,
  "generateReport": true,
  "advancedOptions": {
    "useProxy": false,
    "minKeywordLength": 3,
    "excludeStopwords": true
  }
}
```

**Expected Output**:
- Current keyword usage
- Potential optimization opportunities
- Long-tail keyword suggestions
- SEO score for each keyword

---

## Example 5: E-commerce Category Page

**Use Case**: Analyze category pages for keyword opportunities

```json
{
  "url": "https://www.etsy.com/search?q=handmade+jewelry",
  "extractionMode": "ecommerce",
  "maxKeywords": 150,
  "analysisDepth": "deep",
  "includeSearchSuggestions": true,
  "generateReport": true,
  "advancedOptions": {
    "useProxy": true,
    "waitForSelector": ".search-results",
    "minKeywordLength": 2,
    "excludeStopwords": true
  }
}
```

**Expected Output**:
- Popular search terms
- Product category keywords
- User search patterns
- Trending keywords

---

## Example 6: Minimal Configuration

**Use Case**: Quick keyword extraction with all defaults

```json
{
  "url": "https://example.com/page-to-analyze"
}
```

**Expected Output**:
- Auto-detected content type
- Standard analysis depth (50 keywords per category)
- HTML report generated
- All default settings applied

---

## Tips for Best Results

### 🎯 Choosing Extraction Mode

- **Auto**: Let the actor detect the content type (recommended for most cases)
- **Article**: For blogs, news sites, documentation, guides
- **Ecommerce**: For product pages, category pages, online stores
- **General**: For mixed content or special page types

### 📊 Analysis Depth

- **Quick**: Fast analysis, basic keywords (good for testing)
- **Standard**: Balanced speed and comprehensiveness (recommended)
- **Deep**: Maximum analysis, all extraction methods (for thorough research)

### 🔧 Advanced Options

- **useProxy**: Enable for better Cloudflare bypass (recommended: true)
- **waitForSelector**: Use when page has specific loading indicator
- **minKeywordLength**: Adjust based on your needs (2-5 characters)
- **excludeStopwords**: Keep true for cleaner results
- **language**: Specify for non-English content (en, es, fr, de, etc.)
- **customStopwords**: Add brand names or common terms to exclude

### 💡 Common Patterns

**For SEO Research**:
```json
{
  "analysisDepth": "deep",
  "maxKeywords": 100,
  "generateReport": true
}
```

**For Quick Checks**:
```json
{
  "analysisDepth": "quick",
  "maxKeywords": 20,
  "generateReport": false
}
```

**For E-commerce Focus**:
```json
{
  "extractionMode": "ecommerce",
  "includeSearchSuggestions": true,
  "maxKeywords": 150
}
```

---

## Running Examples Locally

To test an example locally, save it to a file and modify `test.js`:

```javascript
// In test.js, replace getInput with:
getInput: async () => require('./examples/my-example.json')
```

Or use environment variable:
```bash
TEST_URL=https://example.com npm test
```

---

## Support

For issues or questions about input configuration:
- Check the [README.md](../README.md) for detailed field descriptions
- Review the [INPUT_SCHEMA.json](../.actor/INPUT_SCHEMA.json) for validation rules
- Test locally before deploying to Apify
