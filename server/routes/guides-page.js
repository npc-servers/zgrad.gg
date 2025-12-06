/**
 * Dynamic guide page rendering for VPS
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../lib/database.js';
import { injectGuideData } from '../lib/html-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Serve dynamic guide pages
 */
export async function serveGuide(req, res) {
  const slug = req.params.slug;

  if (!slug) {
    return res.status(404).send('Not found');
  }

  try {
    // Fetch guide from database
    const guide = query.prepare(
      'SELECT * FROM guides WHERE slug = ? AND status = ? LIMIT 1'
    ).bind(slug, 'published').first();

    if (!guide) {
      // Fall back to static file
      const staticPath = path.join(__dirname, '../../dist/guides', `${slug}.html`);
      if (fs.existsSync(staticPath)) {
        return res.sendFile(staticPath);
      }
      return res.status(404).sendFile(path.join(__dirname, '../../dist/404.html'));
    }

    // Check if we should count this view
    const cookieName = `guide_view_${slug}`;
    const hasViewedRecently = req.cookies?.[cookieName];

    if (!hasViewedRecently) {
      // Increment view count
      query.prepare(
        'UPDATE guides SET view_count = view_count + 1 WHERE id = ?'
      ).bind(guide.id).run();

      // Set view tracking cookie (24 hours)
      res.cookie(cookieName, '1', {
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: 'lax'
      });
    }

    // Load template
    const templatePath = path.join(__dirname, '../../dist/guides/template.html');
    if (!fs.existsSync(templatePath)) {
      console.error('Guide template not found');
      return res.status(500).send('Template not found');
    }

    const templateHTML = fs.readFileSync(templatePath, 'utf8');
    const html = injectGuideData(templateHTML, guide);

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    });

    res.send(html);
  } catch (error) {
    console.error('Error serving guide:', error);
    res.status(500).send('Error loading guide');
  }
}

