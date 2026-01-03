/**
 * HTML Report Generator
 */

const { Actor } = require('apify');
const log = Actor.log;
const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
    constructor() { }

    /**
     * Generate comprehensive HTML report
     */
    async generateReport(data) {
        log.info('Generating HTML report...');

        const html = this.buildHTML(data);

        // Save to key-value store
        await Actor.setValue('report.html', html, { contentType: 'text/html' });

        const store = await Actor.openKeyValueStore();
        const storeId = store.id || 'default';

        // Generate public URL
        const reportUrl = `https://api.apify.com/v2/key-value-stores/${storeId}/records/report.html`;

        log.info(`Report generated: ${reportUrl}`);

        return reportUrl;
    }

    /**
     * Build HTML content
     */
    buildHTML(data) {
        const { url, contentType, keywords, seoMetrics, extractedAt } = data;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyword Analysis Report - ${new URL(url).hostname}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .header .url {
            font-size: 1.1em;
            opacity: 0.9;
            word-break: break-all;
        }

        .meta-info {
            display: flex;
            justify-content: space-around;
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 3px solid #667eea;
        }

        .meta-card {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            min-width: 150px;
        }

        .meta-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }

        .meta-card .label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section-title {
            font-size: 1.8em;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-title .icon {
            font-size: 1.2em;
        }

        .keyword-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .keyword-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .keyword-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.2);
        }

        .keyword-card .keyword {
            font-size: 1.1em;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }

        .keyword-card .metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }

        .keyword-card .badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-high {
            background: #ff6b6b;
            color: white;
        }

        .badge-medium {
            background: #ffd93d;
            color: #333;
        }

        .badge-low {
            background: #51cf66;
            color: white;
        }

        .badge-info {
            background: #667eea;
            color: white;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }

        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        th, td {
            padding: 15px;
            text-align: left;
        }

        tbody tr:nth-child(even) {
            background: #f8f9fa;
        }

        tbody tr:hover {
            background: #e9ecef;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s;
        }

        .insights {
            background: #fff3cd;
            border-left: 5px solid #ffc107;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }

        .insights h3 {
            color: #856404;
            margin-bottom: 10px;
        }

        .insights ul {
            list-style: none;
            padding-left: 0;
        }

        .insights li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }

        .insights li:before {
            content: "💡";
            position: absolute;
            left: 0;
        }

        .export-buttons {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px solid #e9ecef;
        }

        .export-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }

        .export-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .export-btn-primary:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 15px rgba(102, 126, 234, 0.4);
        }

        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            border-top: 3px solid #667eea;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .export-buttons {
                display: none;
            }
        }

        .chart-container {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .competition-bars {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }

        .competition-bar {
            flex: 1;
            text-align: center;
        }

        .competition-bar .bar {
            height: 200px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        .competition-bar .fill {
            transition: height 0.5s;
            border-radius: 10px 10px 0 0;
        }

        .fill-high {
            background: linear-gradient(180deg, #ff6b6b 0%, #ff5252 100%);
        }

        .fill-medium {
            background: linear-gradient(180deg, #ffd93d 0%, #ffc107 100%);
        }

        .fill-low {
            background: linear-gradient(180deg, #51cf66 0%, #40c057 100%);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Keyword Analysis Report</h1>
            <div class="url">${this.escapeHtml(url)}</div>
            <div style="margin-top: 15px; opacity: 0.8;">
                ${contentType.toUpperCase()} • Generated on ${new Date(extractedAt).toLocaleString()}
            </div>
        </div>

        <div class="meta-info">
            <div class="meta-card">
                <div class="value">${seoMetrics.totalKeywords}</div>
                <div class="label">Total Keywords</div>
            </div>
            <div class="meta-card">
                <div class="value">${seoMetrics.uniqueKeywords}</div>
                <div class="label">Unique Keywords</div>
            </div>
            <div class="meta-card">
                <div class="value">${seoMetrics.avgKeywordLength.toFixed(1)}</div>
                <div class="label">Avg Length (words)</div>
            </div>
            <div class="meta-card">
                <div class="value">${contentType}</div>
                <div class="label">Content Type</div>
            </div>
        </div>

        <div class="content">
            ${this.renderTopKeywords(keywords.topKeywords)}
            ${this.renderCompetitionAnalysis(keywords.competitionKeywords)}
            ${this.renderLongTailKeywords(keywords.longTailKeywords)}
            ${this.renderLSIKeywords(keywords.lsiKeywords)}
            ${this.renderCommercialKeywords(keywords.commercialKeywords)}
            ${this.renderQuestionKeywords(keywords.questionKeywords)}
            ${keywords.searchSuggestions ? this.renderSearchSuggestions(keywords.searchSuggestions) : ''}
            ${this.renderInsights(data)}

            <div class="export-buttons">
                <button class="export-btn export-btn-primary" onclick="window.print()">
                    📄 Print / Save as PDF
                </button>
                <button class="export-btn export-btn-primary" onclick="downloadJSON()">
                    💾 Download JSON
                </button>
            </div>
        </div>

        <div class="footer">
            <p><strong>Keyword Extractor Pro</strong> - Advanced SEO Analysis Tool</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Powered by Apify</p>
        </div>
    </div>

    <script>
        // Store data for export
        const reportData = ${JSON.stringify(data, null, 2)};

        function downloadJSON() {
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'keyword-analysis-${new Date().toISOString().split('T')[0]}.json';
            link.click();
            URL.revokeObjectURL(url);
        }

        // Animate progress bars on load
        window.addEventListener('load', () => {
            document.querySelectorAll('.competition-bar .fill').forEach(fill => {
                const height = fill.getAttribute('data-height');
                setTimeout(() => {
                    fill.style.height = height + '%';
                }, 100);
            });
        });
    </script>
</body>
</html>`;
    }

    /**
     * Render top keywords section
     */
    renderTopKeywords(keywords) {
        if (!keywords || keywords.length === 0) return '';

        const rows = keywords.slice(0, 20).map((kw, index) => `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td><strong>${this.escapeHtml(kw.keyword)}</strong></td>
                <td>${kw.frequency}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${kw.seoScore}%"></div>
                    </div>
                    ${kw.seoScore.toFixed(0)}%
                </td>
                <td><span class="badge badge-${kw.competition}">${kw.competition.toUpperCase()}</span></td>
            </tr>
        `).join('');

        return `
            <div class="section">
                <h2 class="section-title"><span class="icon">⭐</span> Top Keywords</h2>
                <p>Most frequently occurring and relevant keywords found on the page.</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Keyword</th>
                            <th>Frequency</th>
                            <th>SEO Score</th>
                            <th>Competition</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render competition analysis
     */
    renderCompetitionAnalysis(competitionKeywords) {
        const high = competitionKeywords.high?.length || 0;
        const medium = competitionKeywords.medium?.length || 0;
        const low = competitionKeywords.low?.length || 0;
        const total = high + medium + low || 1;

        return `
            <div class="section">
                <h2 class="section-title"><span class="icon">📊</span> Competition Analysis</h2>
                <p>Keywords categorized by estimated competition level.</p>
                
                <div class="chart-container">
                    <div class="competition-bars">
                        <div class="competition-bar">
                            <div class="bar">
                                <div class="fill fill-high" data-height="${(high / total * 100)}" style="height: 0%"></div>
                            </div>
                            <div style="margin-top: 10px;">
                                <div style="font-size: 2em; font-weight: bold; color: #ff6b6b;">${high}</div>
                                <div style="color: #666;">High Competition</div>
                            </div>
                        </div>
                        <div class="competition-bar">
                            <div class="bar">
                                <div class="fill fill-medium" data-height="${(medium / total * 100)}" style="height: 0%"></div>
                            </div>
                            <div style="margin-top: 10px;">
                                <div style="font-size: 2em; font-weight: bold; color: #ffc107;">${medium}</div>
                                <div style="color: #666;">Medium Competition</div>
                            </div>
                        </div>
                        <div class="competition-bar">
                            <div class="bar">
                                <div class="fill fill-low" data-height="${(low / total * 100)}" style="height: 0%"></div>
                            </div>
                            <div style="margin-top: 10px;">
                                <div style="font-size: 2em; font-weight: bold; color: #51cf66;">${low}</div>
                                <div style="color: #666;">Low Competition</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderKeywordGrid(competitionKeywords.low?.slice(0, 12) || [], 'Low Competition Keywords (Easier to Rank)')}
            </div>
        `;
    }

    /**
     * Render long-tail keywords
     */
    renderLongTailKeywords(keywords) {
        if (!keywords || keywords.length === 0) return '';

        return `
            <div class="section">
                <h2 class="section-title"><span class="icon">🎯</span> Long-Tail Keywords</h2>
                <p>Specific, multi-word keywords that are easier to rank for and often have higher conversion rates.</p>
                ${this.renderKeywordGrid(keywords.slice(0, 15))}
            </div>
        `;
    }

    /**
     * Render LSI keywords
     */
    renderLSIKeywords(keywords) {
        if (!keywords || keywords.length === 0) return '';

        return `
            <div class="section">
                <h2 class="section-title"><span class="icon">🔗</span> LSI Keywords</h2>
                <p>Latent Semantic Indexing keywords - semantically related terms that support your main keywords.</p>
                ${this.renderKeywordGrid(keywords.slice(0, 15))}
            </div>
        `;
    }

    /**
     * Render commercial keywords
     */
    renderCommercialKeywords(keywords) {
        if (!keywords || keywords.length === 0) return '';

        return `
            <div class="section">
                <h2 class="section-title"><span class="icon">💰</span> Commercial Intent Keywords</h2>
                <p>Keywords indicating buying intent or commercial purpose.</p>
                ${this.renderKeywordGrid(keywords.slice(0, 15))}
            </div>
        `;
    }

    /**
     * Render question keywords
     */
    renderQuestionKeywords(keywords) {
        if (!keywords || keywords.length === 0) return '';

        return `
            <div class="section">
                <h2 class="section-title"><span class="icon">❓</span> Question Keywords</h2>
                <p>Question-based keywords perfect for FAQ sections and voice search optimization.</p>
                ${this.renderKeywordGrid(keywords.slice(0, 10))}
            </div>
        `;
    }

    /**
     * Render search suggestions
     */
    renderSearchSuggestions(keywords) {
        if (!keywords || keywords.length === 0) return '';

        return `
            <div class="section">
                <h2 class="section-title"><span class="icon">🔎</span> Search Suggestions</h2>
                <p>Actual search suggestions captured from the site's search functionality.</p>
                ${this.renderKeywordGrid(keywords.slice(0, 20))}
            </div>
        `;
    }

    /**
     * Render keyword grid
     */
    renderKeywordGrid(keywords, subtitle = '') {
        if (!keywords || keywords.length === 0) return '<p>No keywords found in this category.</p>';

        const cards = keywords.map(kw => `
            <div class="keyword-card">
                <div class="keyword">${this.escapeHtml(kw.keyword)}</div>
                <div class="metrics">
                    ${kw.frequency ? `<span class="badge badge-info">Freq: ${kw.frequency}</span>` : ''}
                    ${kw.seoScore ? `<span class="badge badge-info">Score: ${kw.seoScore.toFixed(0)}</span>` : ''}
                    ${kw.competition ? `<span class="badge badge-${kw.competition}">${kw.competition}</span>` : ''}
                </div>
            </div>
        `).join('');

        return `
            ${subtitle ? `<h3 style="margin-top: 20px; color: #666;">${subtitle}</h3>` : ''}
            <div class="keyword-grid">
                ${cards}
            </div>
        `;
    }

    /**
     * Render insights and recommendations
     */
    renderInsights(data) {
        const insights = [];

        // Generate insights based on data
        if (data.keywords.longTailKeywords?.length > 10) {
            insights.push('Strong presence of long-tail keywords indicates good content depth and specificity.');
        }

        if (data.keywords.questionKeywords?.length > 5) {
            insights.push(`Found ${data.keywords.questionKeywords.length} question-based keywords - excellent for voice search and featured snippets.`);
        }

        if (data.keywords.commercialKeywords?.length > data.seoMetrics.totalKeywords * 0.3) {
            insights.push('High commercial intent detected - content is well-optimized for conversions.');
        }

        const lowCompCount = data.keywords.competitionKeywords.low?.length || 0;
        if (lowCompCount > 10) {
            insights.push(`${lowCompCount} low-competition keywords found - great opportunities for quick wins!`);
        }

        if (insights.length === 0) {
            insights.push('Content has good keyword distribution. Consider adding more long-tail and question-based keywords for better SEO.');
        }

        return `
            <div class="insights">
                <h3>💡 SEO Insights & Recommendations</h3>
                <ul>
                    ${insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

module.exports = ReportGenerator;
