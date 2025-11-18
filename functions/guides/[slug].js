/**
 * Dynamic guide page renderer
 * 
 * This function serves guide pages from the CMS database.
 * If a guide is not found in the database, it falls back to static HTML files.
 * 
 * @route /guides/:slug
 */

import { injectGuideData } from '../_lib/template-engine.js';
import { htmlResponse, errorResponse } from '../_lib/response-helpers.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const slug = params.slug;

  if (!slug) {
    return errorResponse('Not found', 404);
  }

  try {
    // Attempt to fetch guide from database
    const guide = await fetchGuideFromDB(env.DB, slug);

    if (!guide) {
      // Guide not found in DB, fall back to static file
      console.log(`Guide '${slug}' not found in database, trying static file`);
      return env.ASSETS.fetch(request);
    }

    // Fetch the template HTML file
    const templateHTML = await fetchTemplate(env.ASSETS);
    
    if (!templateHTML) {
      console.error('Failed to load guide template');
      return errorResponse('Template not found', 500);
    }

    // Inject guide data into template
    const html = injectGuideData(templateHTML, guide);

    return htmlResponse(html);

  } catch (error) {
    console.error('Error rendering guide:', error);
    // Fall back to static assets on error
    return env.ASSETS.fetch(request);
  }
}

/**
 * Fetch guide from D1 database
 * @param {D1Database} db - D1 database instance
 * @param {string} slug - Guide slug
 * @returns {Promise<Object|null>} - Guide data or null if not found
 */
async function fetchGuideFromDB(db, slug) {
  const result = await db.prepare(
    'SELECT * FROM guides WHERE slug = ? AND status = ? LIMIT 1'
  )
    .bind(slug, 'published')
    .first();

  return result;
}

/**
 * Fetch HTML template for guides
 * @param {Object} assets - Assets fetch interface
 * @returns {Promise<string|null>} - Template HTML or null if not found
 */
async function fetchTemplate(assets) {
  try {
    const templateResponse = await assets.fetch(
      new Request('http://placeholder/guides/ban-appeal.html')
    );
    
    if (!templateResponse.ok) {
      return null;
    }
    
    return await templateResponse.text();
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}
