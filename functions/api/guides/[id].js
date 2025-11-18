// Get, update, or delete a specific guide
import { validateSession, validateSessionWithCsrf } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit, isValidSlug } from '../../_lib/security-utils.js';

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const guideId = params.id;

  // Rate limiting for GET requests
  const rateLimit = await checkRateLimit(request, env, 'guide_get', 100, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  try {
    const guide = await env.DB.prepare('SELECT * FROM guides WHERE id = ?')
      .bind(guideId)
      .first();

    if (!guide) {
      return secureJsonResponse({ error: 'Guide not found' }, 404);
    }

    // Get contributors for this guide
    const contributors = await env.DB.prepare(
      'SELECT user_id, username, avatar, contributed_at FROM guide_contributors WHERE guide_id = ? ORDER BY contributed_at DESC'
    )
      .bind(guideId)
      .all();

    return secureJsonResponse({ 
      guide,
      contributors: contributors.results || []
    }, 200);
  } catch (error) {
    console.error('Error fetching guide:', error);
    return secureJsonResponse({ error: 'Failed to fetch guide' }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, params, env } = context;
  const guideId = params.id;

  // Rate limiting for PUT requests
  const rateLimit = await checkRateLimit(request, env, 'guide_update', 30, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  // Validate session with CSRF protection
  const session = await validateSessionWithCsrf(request, env);
  if (!session) {
    return secureJsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const data = await request.json();
    const { title, description, content, thumbnail, slug, status } = data;

    // Check if guide exists first
    const existingGuide = await env.DB.prepare('SELECT * FROM guides WHERE id = ?')
      .bind(guideId)
      .first();

    if (!existingGuide) {
      return secureJsonResponse({ error: 'Guide not found' }, 404);
    }

    // Use existing slug if not provided or empty (handle null, undefined, and empty string)
    const finalSlug = (slug && slug.trim()) ? slug.trim() : existingGuide.slug;

    // Validate slug format only if it's being changed
    if (finalSlug !== existingGuide.slug && !isValidSlug(finalSlug)) {
      return secureJsonResponse(
        { error: `Invalid slug format: "${finalSlug}". Use lowercase letters, numbers, and hyphens only.` },
        400
      );
    }

    // Check if slug is being changed and if the new slug already exists
    if (finalSlug !== existingGuide.slug) {
      const slugInUse = await env.DB.prepare('SELECT id FROM guides WHERE slug = ? AND id != ?')
        .bind(finalSlug, guideId)
        .first();
      
      if (slugInUse) {
        return secureJsonResponse(
          { error: 'Slug already exists. Please choose a different slug.' },
          409
        );
      }
    }

    // Check if editor is not the original author
    const isContributor = existingGuide.author_id !== session.user_id;
    
    // Update guide
    const now = Date.now();
    await env.DB.prepare(
      'UPDATE guides SET title = ?, description = ?, content = ?, thumbnail = ?, slug = ?, status = ?, updated_at = ? WHERE id = ?'
    )
      .bind(title, description, content, thumbnail, finalSlug, status, now, guideId)
      .run();

    // If this is a contributor (not the original author), add them to contributors
    if (isContributor) {
      // Check if already a contributor
      const existingContributor = await env.DB.prepare(
        'SELECT * FROM guide_contributors WHERE guide_id = ? AND user_id = ?'
      )
        .bind(guideId, session.user_id)
        .first();

      if (!existingContributor) {
        // Add new contributor
        const contributorId = crypto.randomUUID();
        await env.DB.prepare(
          'INSERT INTO guide_contributors (id, guide_id, user_id, username, avatar, contributed_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
          .bind(contributorId, guideId, session.user_id, session.username, session.avatar, now)
          .run();
      } else {
        // Update contribution timestamp
        await env.DB.prepare(
          'UPDATE guide_contributors SET contributed_at = ?, username = ?, avatar = ? WHERE guide_id = ? AND user_id = ?'
        )
          .bind(now, session.username, session.avatar, guideId, session.user_id)
          .run();
      }
    }

    return secureJsonResponse({
      success: true,
      is_contributor: isContributor,
      guide: {
        id: guideId,
        title,
        description,
        slug: finalSlug,
        thumbnail,
        status,
        updated_at: now,
      },
    }, 200);
  } catch (error) {
    console.error('Error updating guide:', error);
    // Include error details for debugging (helpful during development)
    return secureJsonResponse({ 
      error: 'Failed to update guide',
      details: error.message 
    }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const guideId = params.id;

  // Rate limiting for DELETE requests
  const rateLimit = await checkRateLimit(request, env, 'guide_delete', 20, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  // Validate session with CSRF protection
  const session = await validateSessionWithCsrf(request, env);
  if (!session) {
    return secureJsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    // Check if guide exists
    const existingGuide = await env.DB.prepare('SELECT * FROM guides WHERE id = ?')
      .bind(guideId)
      .first();

    if (!existingGuide) {
      return secureJsonResponse({ error: 'Guide not found' }, 404);
    }

    // Delete guide (and contributors will cascade delete due to foreign key)
    await env.DB.prepare('DELETE FROM guides WHERE id = ?').bind(guideId).run();

    return secureJsonResponse({ success: true }, 200);
  } catch (error) {
    console.error('Error deleting guide:', error);
    return secureJsonResponse({ error: 'Failed to delete guide' }, 500);
  }
}




