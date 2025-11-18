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
      return env.ASSETS.fetch(request);
    }

    // Check if we should count this view
    const shouldCountView = checkAndSetViewCookie(request, slug);
    
    if (shouldCountView) {
      // Increment view count asynchronously (don't wait for it)
      incrementViewCount(env.DB, guide.id).catch(err => {
        console.error('Error incrementing view count:', err);
      });
    }

    // Fetch the template HTML file
    const templateHTML = await fetchTemplate(env.ASSETS);
    
    if (!templateHTML) {
      console.error('Failed to load guide template');
      return errorResponse('Template not found', 500);
    }

    // Inject guide data into template
    const html = injectGuideData(templateHTML, guide);

    // Create response with view tracking cookie if needed
    const response = htmlResponse(html);
    
    if (shouldCountView) {
      const cookieName = `guide_view_${slug}`;
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      response.headers.append(
        'Set-Cookie',
        `${cookieName}=1; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax`
      );
    }

    return response;

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
      new Request('http://placeholder/guides/template.html')
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

/**
 * Check if view should be counted based on cookie
 * @param {Request} request - The incoming request
 * @param {string} slug - Guide slug
 * @returns {boolean} - True if view should be counted
 */
function checkAndSetViewCookie(request, slug) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return true; // No cookies, count the view
  }

  const cookieName = `guide_view_${slug}`;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  
  for (const cookie of cookies) {
    if (cookie.startsWith(`${cookieName}=`)) {
      return false; // Cookie exists, don't count view
    }
  }
  
  return true; // Cookie doesn't exist, count the view
}

/**
 * Increment view count for a guide
 * @param {D1Database} db - D1 database instance
 * @param {string} guideId - Guide ID
 * @returns {Promise<void>}
 */
async function incrementViewCount(db, guideId) {
  await db.prepare(
    'UPDATE guides SET view_count = view_count + 1 WHERE id = ?'
  )
    .bind(guideId)
    .run();
}
