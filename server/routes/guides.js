/**
 * Guides API routes for VPS
 */

import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../lib/database.js';
import { validateSession, validateSessionWithCsrf } from '../middleware/auth.js';
import { 
  secureJsonResponse, 
  checkRateLimit, 
  isValidSlug,
  sanitizeHtml 
} from '../lib/security-utils.js';
import { escapeHtml } from '../lib/html-utils.js';

const router = Router();

/**
 * GET /api/guides/list - List all guides
 */
router.get('/list', async (req, res) => {
  // Rate limiting
  const rateLimit = await checkRateLimit(req, 'guides_list', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);

  try {
    let results;
    
    if (session) {
      // Authenticated users - show all guides including drafts
      results = query.prepare(
        'SELECT id, slug, title, description, thumbnail, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at, draft_content FROM guides ORDER BY created_at DESC'
      ).all().results;
    } else {
      // Public users - only show published guides
      results = query.prepare(
        'SELECT id, slug, title, description, thumbnail, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at FROM guides WHERE status = ? AND visibility = ? ORDER BY created_at DESC'
      ).bind('published', 'public').all().results;
    }

    return secureJsonResponse(res, { 
      guides: results,
      is_authenticated: !!session 
    });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch guides' }, 500);
  }
});

/**
 * POST /api/guides/create - Create a new guide
 */
router.post('/create', async (req, res) => {
  // Rate limiting
  const rateLimit = await checkRateLimit(req, 'guide_create', 10, 3600);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded. Please try again later.' }, 429);
  }

  const session = await validateSessionWithCsrf(req);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const { title, description, content, thumbnail, slug, status = 'draft', visibility = 'public' } = req.body;

    if (!title || !content || !slug) {
      return secureJsonResponse(res, { error: 'Missing required fields: title, content, slug' }, 400);
    }

    if (!isValidSlug(slug)) {
      return secureJsonResponse(res, { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' }, 400);
    }

    const existingSlug = query.prepare('SELECT id FROM guides WHERE slug = ?').bind(slug).first();
    if (existingSlug) {
      return secureJsonResponse(res, { error: 'Slug already exists. Please choose a different slug.' }, 409);
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    query.prepare(
      'INSERT INTO guides (id, slug, title, description, content, thumbnail, author_id, author_name, author_avatar, status, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, slug, title, description || '', content, thumbnail || '',
      session.user_id, session.username, session.avatar,
      status, visibility, now, now
    ).run();

    return secureJsonResponse(res, {
      success: true,
      guide: { id, slug, title, description, thumbnail, status, visibility, created_at: now },
    }, 201);
  } catch (error) {
    console.error('Error creating guide:', error);
    return secureJsonResponse(res, { error: 'Failed to create guide', details: error.message }, 500);
  }
});

/**
 * GET /api/guides/:id - Get a specific guide
 */
router.get('/:id', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'guide_get', 100, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const guide = query.prepare('SELECT * FROM guides WHERE id = ?').bind(req.params.id).first();

    if (!guide) {
      return secureJsonResponse(res, { error: 'Guide not found' }, 404);
    }

    const contributors = query.prepare(
      'SELECT user_id, username, avatar, contributed_at FROM guide_contributors WHERE guide_id = ? ORDER BY contributed_at DESC'
    ).bind(req.params.id).all();

    return secureJsonResponse(res, { 
      guide,
      contributors: contributors.results || []
    });
  } catch (error) {
    console.error('Error fetching guide:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch guide' }, 500);
  }
});

/**
 * PUT /api/guides/:id - Update a guide
 */
router.put('/:id', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'guide_update', 30, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSessionWithCsrf(req);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const guideId = req.params.id;
    const { title, description, content, thumbnail, slug, status, visibility } = req.body;

    const existingGuide = query.prepare('SELECT * FROM guides WHERE id = ?').bind(guideId).first();
    if (!existingGuide) {
      return secureJsonResponse(res, { error: 'Guide not found' }, 404);
    }

    const finalSlug = (slug && slug.trim()) ? slug.trim() : existingGuide.slug;

    if (finalSlug !== existingGuide.slug && !isValidSlug(finalSlug)) {
      return secureJsonResponse(res, { error: `Invalid slug format: "${finalSlug}". Use lowercase letters, numbers, and hyphens only.` }, 400);
    }

    if (finalSlug !== existingGuide.slug) {
      const slugInUse = query.prepare('SELECT id FROM guides WHERE slug = ? AND id != ?').bind(finalSlug, guideId).first();
      if (slugInUse) {
        return secureJsonResponse(res, { error: 'Slug already exists. Please choose a different slug.' }, 409);
      }
    }

    const isContributor = existingGuide.author_id !== session.user_id;
    const now = Date.now();
    const finalVisibility = visibility || existingGuide.visibility || 'public';

    // Handle draft/publish logic
    if (status === 'draft' && existingGuide.status === 'published') {
      query.prepare(
        'UPDATE guides SET title = ?, description = ?, draft_content = ?, thumbnail = ?, slug = ?, visibility = ?, updated_at = ? WHERE id = ?'
      ).bind(title, description, content, thumbnail, finalSlug, finalVisibility, now, guideId).run();
    } else if (status === 'published') {
      query.prepare(
        'UPDATE guides SET title = ?, description = ?, content = ?, draft_content = NULL, thumbnail = ?, slug = ?, status = ?, visibility = ?, updated_at = ? WHERE id = ?'
      ).bind(title, description, content, thumbnail, finalSlug, status, finalVisibility, now, guideId).run();
    } else {
      query.prepare(
        'UPDATE guides SET title = ?, description = ?, content = ?, thumbnail = ?, slug = ?, status = ?, visibility = ?, updated_at = ? WHERE id = ?'
      ).bind(title, description, content, thumbnail, finalSlug, status, finalVisibility, now, guideId).run();
    }

    // Handle contributors
    if (isContributor) {
      const existingContributor = query.prepare(
        'SELECT * FROM guide_contributors WHERE guide_id = ? AND user_id = ?'
      ).bind(guideId, session.user_id).first();

      if (!existingContributor) {
        const contributorId = crypto.randomUUID();
        query.prepare(
          'INSERT INTO guide_contributors (id, guide_id, user_id, username, avatar, contributed_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(contributorId, guideId, session.user_id, session.username, session.avatar, now).run();
      } else {
        query.prepare(
          'UPDATE guide_contributors SET contributed_at = ?, username = ?, avatar = ? WHERE guide_id = ? AND user_id = ?'
        ).bind(now, session.username, session.avatar, guideId, session.user_id).run();
      }
    }

    let actionMessage = 'Guide updated successfully';
    if (status === 'draft' && existingGuide.status === 'published') {
      actionMessage = 'Draft saved without affecting published guide';
    } else if (status === 'published' && existingGuide.draft_content) {
      actionMessage = 'Draft published successfully';
    } else if (status === 'published') {
      actionMessage = 'Guide published successfully';
    }

    return secureJsonResponse(res, {
      success: true,
      is_contributor: isContributor,
      action_message: actionMessage,
      guide: {
        id: guideId,
        title,
        description,
        slug: finalSlug,
        thumbnail,
        status,
        visibility: finalVisibility,
        has_draft: status === 'draft' && existingGuide.status === 'published',
        updated_at: now,
      },
    });
  } catch (error) {
    console.error('Error updating guide:', error);
    return secureJsonResponse(res, { error: 'Failed to update guide', details: error.message }, 500);
  }
});

/**
 * DELETE /api/guides/:id - Delete a guide
 */
router.delete('/:id', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'guide_delete', 20, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSessionWithCsrf(req);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const existingGuide = query.prepare('SELECT * FROM guides WHERE id = ?').bind(req.params.id).first();
    if (!existingGuide) {
      return secureJsonResponse(res, { error: 'Guide not found' }, 404);
    }

    query.prepare('DELETE FROM guides WHERE id = ?').bind(req.params.id).run();
    return secureJsonResponse(res, { success: true });
  } catch (error) {
    console.error('Error deleting guide:', error);
    return secureJsonResponse(res, { error: 'Failed to delete guide' }, 500);
  }
});

/**
 * POST /api/guides/build - Build endpoint for static site generation
 */
router.post('/build', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== `Bearer ${process.env.BUILD_SECRET}`) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const { results: guides } = query.prepare(
      'SELECT id, slug, title, description, content, thumbnail, author_id, author_name, author_avatar, created_at, updated_at FROM guides WHERE status = ? ORDER BY created_at DESC'
    ).bind('published').all();

    const generatedGuides = guides.map(guide => {
      const sanitizedContent = sanitizeHtml(guide.content);
      
      return {
        slug: guide.slug,
        title: guide.title,
        description: guide.description,
        content: sanitizedContent,
        thumbnail: guide.thumbnail,
        author: {
          id: guide.author_id,
          name: guide.author_name,
          avatar: guide.author_avatar,
        },
        createdAt: guide.created_at,
        updatedAt: guide.updated_at,
        html: generateGuideHTML({ ...guide, content: sanitizedContent }),
      };
    });

    return secureJsonResponse(res, {
      success: true,
      guides: generatedGuides,
      count: generatedGuides.length,
      generatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error generating guides:', error);
    return secureJsonResponse(res, { error: 'Failed to generate guides' }, 500);
  }
});

function generateGuideHTML(guide) {
  const authorAvatarUrl = guide.author_avatar
    ? `https://cdn.discordapp.com/avatars/${guide.author_id}/${guide.author_avatar}.png`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(guide.title)} - ZGRAD Help Guide</title>
    <meta name="description" content="${escapeHtml(guide.description || '')}">
    <meta property="og:title" content="${escapeHtml(guide.title)} - ZGRAD Help Guide">
    <meta property="og:description" content="${escapeHtml(guide.description || '')}">
    <meta property="og:image" content="${escapeHtml(guide.thumbnail || 'https://zgrad.gg/images/logos/zgrad-logo.png')}">
    <link rel="canonical" href="https://zgrad.gg/guides/${guide.slug}">
</head>
<body>
    <div class="guide-page">
        ${guide.thumbnail ? `<div class="guide-hero-bg" style="background-image: url('${escapeHtml(guide.thumbnail)}');"></div>` : ''}
        <div class="guide-header">
            <h1 class="guide-title">${escapeHtml(guide.title.toUpperCase())}</h1>
            ${guide.description ? `<p class="guide-subtitle">${escapeHtml(guide.description)}</p>` : ''}
            <div class="guide-author">
                <img src="${authorAvatarUrl}" alt="${escapeHtml(guide.author_name)}" class="guide-author-avatar">
                <div class="guide-author-info">
                    <span class="guide-author-label">Written by</span>
                    <span class="guide-author-name">${escapeHtml(guide.author_name)}</span>
                </div>
            </div>
        </div>
        <div class="guide-content">${guide.content}</div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script type="module" src="/src/guides.js"></script>
</body>
</html>`;
}

export default router;

