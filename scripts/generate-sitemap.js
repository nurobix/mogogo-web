#!/usr/bin/env node
/**
 * Generates sitemap.xml from blog articles.
 * Only includes articles with datePublished <= today.
 * Run: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');
const BASE_URL = 'https://mogogo.app';
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Extract datePublished from ld+json in an HTML file
function getDatePublished(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  return match ? match[1] : null;
}

// Collect all blog articles with their dates
const articles = [];
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const date = getDatePublished(filePath);
  if (date && date <= TODAY) {
    articles.push({ file, date });
  }
}

// Sort by date descending
articles.sort((a, b) => b.date.localeCompare(a.date));

// Build sitemap XML
const urls = [];

// Root pages
urls.push({ loc: '/', lastmod: TODAY, changefreq: 'weekly', priority: '1.0' });
urls.push({ loc: '/privacy.html', lastmod: TODAY, changefreq: 'yearly', priority: '0.3' });
urls.push({ loc: '/support.html', lastmod: TODAY, changefreq: 'yearly', priority: '0.3' });
urls.push({ loc: '/terms.html', lastmod: TODAY, changefreq: 'yearly', priority: '0.3' });

// Blog index
urls.push({ loc: '/blog/', lastmod: TODAY, changefreq: 'weekly', priority: '0.8' });

// Published articles
for (const article of articles) {
  urls.push({
    loc: `/blog/${article.file}`,
    lastmod: article.date,
    changefreq: 'monthly',
    priority: '0.6'
  });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Auto-generated sitemap. Do not edit manually. -->
<!-- Generated on ${TODAY} — ${articles.length} published articles, future articles excluded. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, xml, 'utf-8');
console.log(`sitemap.xml generated: ${articles.length} articles published (${files.length - articles.length} scheduled for later)`);
