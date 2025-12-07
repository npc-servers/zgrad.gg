/**
 * Dynamic news page rendering for VPS
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../lib/database.js';
import { injectNewsData } from '../lib/html-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Serve dynamic news pages
 */
export async function serveNews(req, res) {
  const slug = req.params.slug;

  if (!slug) {
    return res.status(404).send('Not found');
  }

  try {
    // Fetch news from database
    const news = query.prepare(
      'SELECT * FROM news WHERE slug = ? AND status = ? AND visibility = ? LIMIT 1'
    ).bind(slug, 'published', 'public').first();

    if (!news) {
      // News article not found - serve 404
      return res.status(404).sendFile(path.join(__dirname, '../../dist/404.html'));
    }

    // Check if we should count this view
    const cookieName = `news_view_${slug}`;
    const hasViewedRecently = req.cookies?.[cookieName];

    if (!hasViewedRecently) {
      // Increment view count
      query.prepare(
        'UPDATE news SET view_count = view_count + 1 WHERE id = ?'
      ).bind(news.id).run();

      // Set view tracking cookie (24 hours)
      res.cookie(cookieName, '1', {
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: 'lax'
      });
    }

    // Load template
    const templatePath = path.join(__dirname, '../../dist/news/template.html');
    if (!fs.existsSync(templatePath)) {
      console.error('News template not found');
      return res.status(500).send('Template not found');
    }

    const templateHTML = fs.readFileSync(templatePath, 'utf8');
    const html = injectNewsData(templateHTML, news);

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    });

    res.send(html);
  } catch (error) {
    console.error('Error serving news:', error);
    res.status(500).send('Error loading news');
  }
}
