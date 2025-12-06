/**
 * News API routes for VPS
 */

import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../lib/database.js';
import { validateSession, validateSessionWithCsrf } from '../middleware/auth.js';
import { 
  secureJsonResponse, 
  checkRateLimit, 
  isValidSlug 
} from '../lib/security-utils.js';

const router = Router();

/**
 * GET /api/news/list - List all news articles
 */
router.get('/list', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'news_list', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);

  try {
    let results;
    
    if (session) {
      results = query.prepare(
        'SELECT id, slug, title, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at FROM news ORDER BY created_at DESC'
      ).all().results;
    } else {
      results = query.prepare(
        'SELECT id, slug, title, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at FROM news WHERE status = ? AND visibility = ? ORDER BY created_at DESC'
      ).bind('published', 'public').all().results;
    }

    return secureJsonResponse(res, { 
      news: results,
      is_authenticated: !!session 
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch news' }, 500);
  }
});

/**
 * POST /api/news/create - Create a new news article
 */
router.post('/create', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'news_create', 10, 3600);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded. Please try again later.' }, 429);
  }

  const session = await validateSessionWithCsrf(req);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const { title, content, cover_image, image_caption, slug, status = 'draft', visibility = 'public', category = 'announcement' } = req.body;

    if (!title || !content || !slug) {
      return secureJsonResponse(res, { error: 'Missing required fields: title, content, slug' }, 400);
    }

    if (!isValidSlug(slug)) {
      return secureJsonResponse(res, { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' }, 400);
    }

    const existingSlug = query.prepare('SELECT id FROM news WHERE slug = ?').bind(slug).first();
    if (existingSlug) {
      return secureJsonResponse(res, { error: 'Slug already exists. Please choose a different slug.' }, 409);
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    query.prepare(
      'INSERT INTO news (id, slug, title, content, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, slug, title, content, cover_image || '', image_caption || '', category,
      session.user_id, session.username, session.avatar,
      status, visibility, now, now
    ).run();

    return secureJsonResponse(res, {
      success: true,
      news: { id, slug, title, cover_image, image_caption, category, status, visibility, created_at: now },
    }, 201);
  } catch (error) {
    console.error('Error creating news:', error);
    return secureJsonResponse(res, { error: 'Failed to create news article', details: error.message }, 500);
  }
});

/**
 * GET /api/news/:id - Get a specific news article
 */
router.get('/:id', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'news_get', 100, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const news = query.prepare('SELECT * FROM news WHERE id = ?').bind(req.params.id).first();

    if (!news) {
      return secureJsonResponse(res, { error: 'News article not found' }, 404);
    }

    return secureJsonResponse(res, { news });
  } catch (error) {
    console.error('Error fetching news:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch news article' }, 500);
  }
});

/**
 * PUT /api/news/:id - Update a news article
 */
router.put('/:id', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'news_update', 30, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSessionWithCsrf(req);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const newsId = req.params.id;
    const { title, content, cover_image, image_caption, slug, status, visibility, category } = req.body;

    const existingNews = query.prepare('SELECT * FROM news WHERE id = ?').bind(newsId).first();
    if (!existingNews) {
      return secureJsonResponse(res, { error: 'News article not found' }, 404);
    }

    const finalSlug = (slug && slug.trim()) ? slug.trim() : existingNews.slug;

    if (finalSlug !== existingNews.slug && !isValidSlug(finalSlug)) {
      return secureJsonResponse(res, { error: `Invalid slug format: "${finalSlug}". Use lowercase letters, numbers, and hyphens only.` }, 400);
    }

    if (finalSlug !== existingNews.slug) {
      const slugInUse = query.prepare('SELECT id FROM news WHERE slug = ? AND id != ?').bind(finalSlug, newsId).first();
      if (slugInUse) {
        return secureJsonResponse(res, { error: 'Slug already exists. Please choose a different slug.' }, 409);
      }
    }

    const now = Date.now();
    const finalVisibility = visibility || existingNews.visibility || 'public';
    const isDraftBeingPublished = existingNews.status === 'draft' && status === 'published';

    let contentToSave = content || existingNews.content;
    let draftContent = existingNews.draft_content;

    if (status === 'published' && draftContent) {
      contentToSave = draftContent;
      draftContent = null;
    } else if (status === 'draft' && existingNews.status === 'published') {
      draftContent = content || existingNews.content;
      contentToSave = existingNews.content;
    }

    query.prepare(
      `UPDATE news 
       SET title = ?, content = ?, draft_content = ?, cover_image = ?, image_caption = ?, 
           slug = ?, status = ?, visibility = ?, category = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      title || existingNews.title,
      contentToSave,
      draftContent,
      cover_image !== undefined ? cover_image : existingNews.cover_image,
      image_caption !== undefined ? image_caption : existingNews.image_caption,
      finalSlug,
      status || existingNews.status,
      finalVisibility,
      category || existingNews.category,
      now,
      newsId
    ).run();

    const updatedNews = query.prepare('SELECT * FROM news WHERE id = ?').bind(newsId).first();

    return secureJsonResponse(res, {
      success: true,
      news: updatedNews,
      action_message: isDraftBeingPublished ? 'News article published successfully!' : 'News article updated successfully!'
    });
  } catch (error) {
    console.error('Error updating news:', error);
    return secureJsonResponse(res, { error: 'Failed to update news article', details: error.message }, 500);
  }
});

/**
 * DELETE /api/news/:id - Delete a news article
 */
router.delete('/:id', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'news_delete', 10, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSessionWithCsrf(req);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const news = query.prepare('SELECT author_id FROM news WHERE id = ?').bind(req.params.id).first();

    if (!news) {
      return secureJsonResponse(res, { error: 'News article not found' }, 404);
    }

    if (news.author_id !== session.user_id) {
      return secureJsonResponse(res, { error: 'Forbidden: Only the author can delete this news article' }, 403);
    }

    query.prepare('DELETE FROM news WHERE id = ?').bind(req.params.id).run();

    return secureJsonResponse(res, { 
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    return secureJsonResponse(res, { error: 'Failed to delete news article', details: error.message }, 500);
  }
});

export default router;

