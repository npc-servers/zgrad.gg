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

  // Require authentication for CMS guide list
  const session = await validateSession(request, env);
  if (!session) {
    return secureJsonResponse({ error: 'Unauthorized - Authentication required' }, 401);
  }

  try {
    // Return all guides (including drafts) for authenticated CMS users
    const { results } = await env.DB.prepare(
      'SELECT id, slug, title, description, thumbnail, author_id, author_name, author_avatar, status, created_at, updated_at FROM guides ORDER BY created_at DESC'
    ).all();

    return secureJsonResponse({ guides: results }, 200);
  } catch (error) {
    console.error('Error fetching guides:', error);
    return secureJsonResponse({ error: 'Failed to fetch guides' }, 500);
  }
}




