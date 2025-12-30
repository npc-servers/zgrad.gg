/**
 * Sitemap XML Generator for VPS
 * Dynamically generates sitemap.xml with static and dynamic content
 */

import { Router } from 'express';
import { query } from '../lib/database.js';
import { SERVER_GROUPS } from '../../js/serverConfig.js';

const router = Router();

/**
 * Static pages configuration
 * Connect pages are loaded dynamically from server-config.js
 */
const STATIC_PAGES = [
  {
    loc: 'https://zgrad.gg/',
    changefreq: 'weekly',
    priority: '1.0'
  },
  {
    loc: 'https://zgrad.gg/servers',
    changefreq: 'daily',
    priority: '0.9'
  },
  {
    loc: 'https://zgrad.gg/rules',
    changefreq: 'monthly',
    priority: '0.8'
  },
  {
    loc: 'https://zgrad.gg/credits',
    changefreq: 'monthly',
    priority: '0.5'
  },
  {
    loc: 'https://zgrad.gg/store',
    changefreq: 'weekly',
    priority: '0.7'
  },
  {
    loc: 'https://zgrad.gg/guides',
    changefreq: 'daily',
    priority: '0.8'
  },
  {
    loc: 'https://zgrad.gg/news',
    changefreq: 'daily',
    priority: '0.8'
  },
  {
    loc: 'https://zgrad.gg/updates',
    changefreq: 'daily',
    priority: '0.7'
  },
  // Play subdomain
  {
    loc: 'https://play.zgrad.gg/',
    changefreq: 'daily',
    priority: '0.9'
  }
];

/**
 * Get all pages including dynamic connect pages from js/serverConfig.js
 */
function getAllStaticPages() {
  const connectPages = SERVER_GROUPS.map(server => ({
    loc: `https://zgrad.gg/${server.link}`,
    changefreq: 'weekly',
    priority: '0.6'
  }));
  return [...STATIC_PAGES, ...connectPages];
}

/**
 * GET /sitemap.xml - Generate sitemap dynamically
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Fetch published guides
    const guides = query.prepare(
      'SELECT slug, updated_at FROM guides WHERE status = ? AND visibility = ? ORDER BY updated_at DESC'
    ).bind('published', 'public').all().results;

    // Fetch published news
    const news = query.prepare(
      'SELECT slug, updated_at FROM news WHERE status = ? AND visibility = ? ORDER BY updated_at DESC'
    ).bind('published', 'public').all().results;

    // Start building XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages (including dynamic connect pages from server config)
    const allStaticPages = getAllStaticPages();
    for (const page of allStaticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(page.loc)}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Add dynamic guide pages
    for (const guide of guides) {
      const lastmod = new Date(guide.updated_at).toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>https://zgrad.gg/guides/${escapeXml(guide.slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    // Add dynamic news pages
    for (const article of news) {
      const lastmod = new Date(article.updated_at).toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>https://zgrad.gg/news/${escapeXml(article.slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    // Set appropriate headers
    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      'X-Content-Type-Options': 'nosniff'
    });

    return res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Fallback sitemap with just the homepage
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zgrad.gg/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes on error
    });

    return res.status(500).send(fallbackXml);
  }
});

/**
 * Helper function to escape XML special characters
 */
function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
