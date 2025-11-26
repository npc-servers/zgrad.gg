// Create a new news article
import { validateSessionWithCsrf } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit, isValidSlug } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting - 10 news creations per hour
  const rateLimit = await checkRateLimit(request, env, 'news_create', 10, 3600);
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
    const { title, content, cover_image, image_caption, slug, status = 'draft', visibility = 'public', category = 'announcement' } = data;

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
    const existingSlug = await env.DB.prepare('SELECT id FROM news WHERE slug = ?')
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

    // Insert news article into database
    await env.DB.prepare(
      'INSERT INTO news (id, slug, title, content, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        id,
        slug,
        title,
        content,
        cover_image || '',
        image_caption || '',
        category,
        session.user_id,
        session.username,
        session.avatar,
        status,
        visibility,
        now,
        now
      )
      .run();

    return secureJsonResponse(
      {
        success: true,
        news: {
          id,
          slug,
          title,
          cover_image,
          image_caption,
          category,
          status,
          visibility,
          created_at: now,
        },
      },
      201
    );
  } catch (error) {
    console.error('Error creating news:', error);
    return secureJsonResponse({ 
      error: 'Failed to create news article',
      details: error.message 
    }, 500);
  }
}

