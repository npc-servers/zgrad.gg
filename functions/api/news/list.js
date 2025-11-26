// List all news articles from database
import { validateSession } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(request, env, 'news_list', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  // Check if user is authenticated with valid Discord roles (optional for this endpoint)
  const session = await validateSession(request, env, true);

  try {
    let query;
    
    if (session) {
      // Authenticated users with valid roles (CMS) - show all news including drafts
      query = env.DB.prepare(
        'SELECT id, slug, title, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at FROM news ORDER BY created_at DESC'
      );
    } else {
      // Public users or users without valid roles - only show published news
      query = env.DB.prepare(
        'SELECT id, slug, title, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at FROM news WHERE status = ? AND visibility = ? ORDER BY created_at DESC'
      ).bind('published', 'public');
    }

    const { results } = await query.all();

    return secureJsonResponse({ 
      news: results,
      is_authenticated: !!session 
    }, 200);
  } catch (error) {
    console.error('Error fetching news:', error);
    return secureJsonResponse({ error: 'Failed to fetch news' }, 500);
  }
}

