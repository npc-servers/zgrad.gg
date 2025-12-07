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
 * GET /api/news/loading-screen - Get active news/events for the loading screen
 * Returns up to 3 active events + 1 announcement that have show_on_loading_screen enabled
 */
router.get('/loading-screen', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'news_loading_screen', 120, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const now = Date.now();
    const items = [];
    
    // Get up to 3 active events
    // An event is active if: published, show_on_loading_screen = 1, and either no end_date or end_date is in the future
    const activeEvents = query.prepare(
      `SELECT id, slug, title, category, loading_screen_description, event_start_date, event_end_date, created_at 
       FROM news 
       WHERE status = 'published' 
         AND visibility = 'public' 
         AND show_on_loading_screen = 1 
         AND category = 'event'
         AND (event_end_date IS NULL OR event_end_date > ?)
       ORDER BY created_at DESC 
       LIMIT 3`
    ).bind(now).all().results;

    // Get 1 announcement
    const announcement = query.prepare(
      `SELECT id, slug, title, category, loading_screen_description, event_start_date, event_end_date, created_at 
       FROM news 
       WHERE status = 'published' 
         AND visibility = 'public' 
         AND show_on_loading_screen = 1 
         AND category = 'announcement'
       ORDER BY created_at DESC 
       LIMIT 1`
    ).first();

    // Add announcement first if exists
    if (announcement) {
      items.push({
        id: announcement.id,
        slug: announcement.slug,
        title: announcement.title,
        type: 'announcement',
        description: announcement.loading_screen_description || '',
        linkUrl: `zgrad.gg/news/${announcement.slug}`,
        startDate: null,
        endDate: null
      });
    }

    // Then add events
    for (const event of activeEvents) {
      items.push({
        id: event.id,
        slug: event.slug,
        title: event.title,
        type: 'event',
        description: event.loading_screen_description || '',
        linkUrl: `zgrad.gg/news/${event.slug}`,
        startDate: event.event_start_date,
        endDate: event.event_end_date
      });
    }

    return secureJsonResponse(res, { 
      active: items.length > 0,
      items: items
    });
  } catch (error) {
    console.error('Error fetching loading screen news:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch loading screen news' }, 500);
  }
});

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
        'SELECT id, slug, title, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at, draft_content, show_on_loading_screen, loading_screen_description, loading_screen_link_text, event_start_date, event_end_date FROM news ORDER BY created_at DESC'
      ).all().results;
    } else {
      results = query.prepare(
        'SELECT id, slug, title, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, view_count, created_at, updated_at, show_on_loading_screen, loading_screen_description, loading_screen_link_text, event_start_date, event_end_date FROM news WHERE status = ? AND visibility = ? ORDER BY created_at DESC'
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
    const { 
      title, content, cover_image, image_caption, slug, 
      status = 'draft', visibility = 'public', category = 'announcement',
      show_on_loading_screen = false, loading_screen_description = '',
      event_start_date = null, event_end_date = null
    } = req.body;

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
      `INSERT INTO news (id, slug, title, content, cover_image, image_caption, category, author_id, author_name, author_avatar, status, visibility, created_at, updated_at, show_on_loading_screen, loading_screen_description, event_start_date, event_end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, slug, title, content, cover_image || '', image_caption || '', category,
      session.user_id, session.username, session.avatar,
      status, visibility, now, now,
      show_on_loading_screen ? 1 : 0, loading_screen_description || '',
      event_start_date || null, event_end_date || null
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
    const { 
      title, content, cover_image, image_caption, slug, status, visibility, category,
      show_on_loading_screen, loading_screen_description,
      event_start_date, event_end_date
    } = req.body;

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
    const isSavingDraftForPublished = status === 'draft' && existingNews.status === 'published';
    const isPublishingDraft = status === 'published' && existingNews.draft_content;
    const isDraftBeingPublished = existingNews.status === 'draft' && status === 'published';

    let contentToSave = content || existingNews.content;
    let draftContent = existingNews.draft_content;
    let finalStatus = status || existingNews.status;

    if (isPublishingDraft) {
      // Publishing with existing draft - use draft content
      contentToSave = existingNews.draft_content;
      draftContent = null;
      finalStatus = 'published';
    } else if (isSavingDraftForPublished) {
      // Saving draft for already published item - keep status as published
      draftContent = content || existingNews.content;
      contentToSave = existingNews.content; // Keep published content unchanged
      finalStatus = 'published'; // Don't change status!
    }

    query.prepare(
      `UPDATE news 
       SET title = ?, content = ?, draft_content = ?, cover_image = ?, image_caption = ?, 
           slug = ?, status = ?, visibility = ?, category = ?, updated_at = ?,
           show_on_loading_screen = ?, loading_screen_description = ?,
           event_start_date = ?, event_end_date = ?
       WHERE id = ?`
    ).bind(
      title || existingNews.title,
      contentToSave,
      draftContent,
      cover_image !== undefined ? cover_image : existingNews.cover_image,
      image_caption !== undefined ? image_caption : existingNews.image_caption,
      finalSlug,
      finalStatus,
      finalVisibility,
      category || existingNews.category,
      now,
      show_on_loading_screen !== undefined ? (show_on_loading_screen ? 1 : 0) : existingNews.show_on_loading_screen,
      loading_screen_description !== undefined ? loading_screen_description : existingNews.loading_screen_description,
      event_start_date !== undefined ? event_start_date : existingNews.event_start_date,
      event_end_date !== undefined ? event_end_date : existingNews.event_end_date,
      newsId
    ).run();

    const updatedNews = query.prepare('SELECT * FROM news WHERE id = ?').bind(newsId).first();

    let actionMessage = 'News article updated successfully!';
    if (isSavingDraftForPublished) {
      actionMessage = 'Draft saved without affecting published article';
    } else if (isPublishingDraft) {
      actionMessage = 'Draft published successfully!';
    } else if (isDraftBeingPublished) {
      actionMessage = 'News article published successfully!';
    }

    return secureJsonResponse(res, {
      success: true,
      news: updatedNews,
      has_draft: isSavingDraftForPublished,
      action_message: actionMessage
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

