// List all guides from database
import { validateSession } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(request, env, 'guides_list', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  // Check if user is authenticated with valid Discord roles (optional for this endpoint)
  // Note: We verify roles to ensure only authorized users can see drafts
  const session = await validateSession(request, env, true);

  try {
    let query;
    
    if (session) {
      // Authenticated users with valid roles (CMS) - show all guides including drafts
      query = env.DB.prepare(
        'SELECT id, slug, title, description, thumbnail, author_id, author_name, author_avatar, status, created_at, updated_at FROM guides ORDER BY created_at DESC'
      );
    } else {
      // Public users or users without valid roles - only show published guides
      query = env.DB.prepare(
        'SELECT id, slug, title, description, thumbnail, author_id, author_name, author_avatar, status, created_at, updated_at FROM guides WHERE status = ? ORDER BY created_at DESC'
      ).bind('published');
    }

    const { results } = await query.all();

    return secureJsonResponse({ 
      guides: results,
      is_authenticated: !!session 
    }, 200);
  } catch (error) {
    console.error('Error fetching guides:', error);
    return secureJsonResponse({ error: 'Failed to fetch guides' }, 500);
  }
}




