# Quick Start Guide

Get started with Keyword Extractor Pro in 3 simple steps!

## 🚀 Method 1: Run on Apify (Recommended)

### Step 1: Deploy to Apify

```bash
# Install Apify CLI (one-time setup)
npm install -g apify-cli

# Login to your Apify account
apify login

# Navigate to project directory
cd "e:\website url keyword extractor"

# Push to Apify platform
apify push
```

### Step 2: Run Your First Analysis

1. Go to [Apify Console](https://console.apify.com)
2. Find your actor in "My Actors"
3. Click "Try it"
4. Enter a URL (e.g., `https://techcrunch.com/latest-article`)
5. Click "Start"

### Step 3: View Results

- **Dataset**: See JSON output with all keywords
- **Key-Value Store**: Download the HTML report
- **Log**: Check extraction progress

---

## 💻 Method 2: Local Testing

### Step 1: Install Dependencies

```bash
cd "e:\website url keyword extractor"
npm install
```

### Step 2: Run Test

```bash
# Test with default URL (Wikipedia AI article)
npm test

# Or test with your own URL
TEST_URL=https://example.com npm test
```

### Step 3: View Results

- Open `test-report.html` in your browser
- Check `test-results.json` for raw data

---

## 📝 Basic Usage Examples

### Example 1: Analyze a Blog Post

**Input**:
```json
{
  "url": "https://yourblog.com/post"
}
```

**What you'll get**:
- Top 50 keywords
- Long-tail keyword opportunities
- SEO recommendations
- Beautiful HTML report

### Example 2: E-commerce Product Analysis

**Input**:
```json
{
  "url": "https://amazon.com/product",
  "extractionMode": "ecommerce",
  "includeSearchSuggestions": true
}
```

**What you'll get**:
- Product keywords
- Search suggestions
- Commercial keywords
- Brand analysis

### Example 3: Deep Competitor Analysis

**Input**:
```json
{
  "url": "https://competitor.com",
  "analysisDepth": "deep",
  "maxKeywords": 100
}
```

**What you'll get**:
- 100+ keywords per category
- Competition breakdown
- LSI keywords
- Question opportunities

---

## 🎯 Understanding the Output

### Dataset Fields

| Field | Description |
|-------|-------------|
| `url` | The analyzed URL |
| `contentType` | Detected type (article/ecommerce/general) |
| `keywords.topKeywords` | Most frequent keywords |
| `keywords.longTailKeywords` | 3+ word phrases |
| `keywords.lsiKeywords` | Semantically related terms |
| `keywords.competitionKeywords` | By difficulty level |
| `seoMetrics` | Overall statistics |
| `reportUrl` | Link to HTML report |

### HTML Report Sections

1. **Metrics Dashboard**: Quick overview
2. **Top Keywords**: Ranked by SEO score
3. **Competition Analysis**: Visual breakdown
4. **Long-tail Keywords**: Specific opportunities
5. **LSI Keywords**: Related terms
6. **SEO Insights**: Automated recommendations

---

## 🔧 Common Configurations

### For Content Writers
```json
{
  "url": "YOUR_URL",
  "extractionMode": "article",
  "analysisDepth": "standard"
}
```

### For SEO Specialists
```json
{
  "url": "YOUR_URL",
  "analysisDepth": "deep",
  "maxKeywords": 100,
  "generateReport": true
}
```

### For E-commerce Managers
```json
{
  "url": "YOUR_URL",
  "extractionMode": "ecommerce",
  "includeSearchSuggestions": true,
  "maxKeywords": 150
}
```

### For Quick Checks
```json
{
  "url": "YOUR_URL",
  "analysisDepth": "quick",
  "maxKeywords": 20
}
```

---

## ❓ Troubleshooting

### Issue: "URL is not accessible"
**Solution**: Enable proxy in advanced options:
```json
{
  "advancedOptions": {
    "useProxy": true
  }
}
```

### Issue: Too many/few keywords
**Solution**: Adjust maxKeywords:
```json
{
  "maxKeywords": 30  // Lower number
}
```

### Issue: Irrelevant keywords
**Solution**: Add custom stopwords:
```json
{
  "advancedOptions": {
    "customStopwords": ["brand", "company", "copyright"]
  }
}
```

### Issue: Page takes too long to load
**Solution**: Use waitForSelector:
```json
{
  "advancedOptions": {
    "waitForSelector": "article"  // Wait for specific element
  }
}
```

---

## 📚 Next Steps

- ✅ Read the full [README.md](README.md)
- ✅ Check [EXAMPLES.md](EXAMPLES.md) for more use cases
- ✅ Review [CHANGELOG.md](CHANGELOG.md) for updates
- ✅ Join Apify community for support

---

## 💡 Pro Tips

1. **Use Deep Analysis** for comprehensive research
2. **Enable Proxy** for protected sites
3. **Check HTML Report** for visual insights
4. **Export JSON** for further processing
5. **Test Locally** before running on Apify
6. **Use Auto Mode** when unsure about content type

---

**Happy Keyword Extracting! 🎉**
