// Create a new guide
import { validateSessionWithCsrf } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit, isValidSlug } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting - 10 guide creations per hour
  const rateLimit = await checkRateLimit(request, env, 'guide_create', 10, 3600);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded. Please try again later.' }, 429);
  }

  // Validate session with CSRF protection
  const session = await validateSessionWithCsrf(request, env);
  if (!session) {
    return secureJsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const data = await request.json();
    const { title, description, content, thumbnail, slug, status = 'draft' } = data;

    // Validate required fields
    if (!title || !content || !slug) {
      return secureJsonResponse(
        { error: 'Missing required fields: title, content, slug' },
        400
      );
    }

    // Validate slug format
    if (!isValidSlug(slug)) {
      return secureJsonResponse(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        400
      );
    }

    // Check if slug already exists
    const existingSlug = await env.DB.prepare('SELECT id FROM guides WHERE slug = ?')
      .bind(slug)
      .first();
    
    if (existingSlug) {
      return secureJsonResponse(
        { error: 'Slug already exists. Please choose a different slug.' },
        409
      );
    }

    // Generate unique ID
    const id = crypto.randomUUID();
    const now = Date.now();

    // Insert guide into database
    await env.DB.prepare(
      'INSERT INTO guides (id, slug, title, description, content, thumbnail, author_id, author_name, author_avatar, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        id,
        slug,
        title,
        description || '',
        content,
        thumbnail || '',
        session.user_id,
        session.username,
        session.avatar,
        status,
        now,
        now
      )
      .run();

    // If status is published, trigger static site rebuild
    if (status === 'published') {
      // This will be handled by a webhook or GitHub Action
      // For now, we'll just return success
    }

    return secureJsonResponse(
      {
        success: true,
        guide: {
          id,
          slug,
          title,
          description,
          thumbnail,
          status,
          created_at: now,
        },
      },
      201
    );
  } catch (error) {
    console.error('Error creating guide:', error);
    return secureJsonResponse({ 
      error: 'Failed to create guide',
      details: error.message 
    }, 500);
  }
}




