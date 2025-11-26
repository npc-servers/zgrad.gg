// Get, update, or delete a specific news article
import { validateSession, validateSessionWithCsrf } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit, isValidSlug } from '../../_lib/security-utils.js';

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const newsId = params.id;

  // Rate limiting for GET requests
  const rateLimit = await checkRateLimit(request, env, 'news_get', 100, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  try {
    const news = await env.DB.prepare('SELECT * FROM news WHERE id = ?')
      .bind(newsId)
      .first();

    if (!news) {
      return secureJsonResponse({ error: 'News article not found' }, 404);
    }

    return secureJsonResponse({ news }, 200);
  } catch (error) {
    console.error('Error fetching news:', error);
    return secureJsonResponse({ error: 'Failed to fetch news article' }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, params, env } = context;
  const newsId = params.id;

  // Rate limiting for PUT requests
  const rateLimit = await checkRateLimit(request, env, 'news_update', 30, 60);
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
    const { title, content, cover_image, image_caption, slug, status, visibility, category } = data;

    // Check if news exists first
    const existingNews = await env.DB.prepare('SELECT * FROM news WHERE id = ?')
      .bind(newsId)
      .first();

    if (!existingNews) {
      return secureJsonResponse({ error: 'News article not found' }, 404);
    }

    // Use existing slug if not provided or empty
    const finalSlug = (slug && slug.trim()) ? slug.trim() : existingNews.slug;

    // Validate slug format only if it's being changed
    if (finalSlug !== existingNews.slug && !isValidSlug(finalSlug)) {
      return secureJsonResponse(
        { error: `Invalid slug format: "${finalSlug}". Use lowercase letters, numbers, and hyphens only.` },
        400
      );
    }

    // Check if slug is being changed and if the new slug already exists
    if (finalSlug !== existingNews.slug) {
      const slugInUse = await env.DB.prepare('SELECT id FROM news WHERE slug = ? AND id != ?')
        .bind(finalSlug, newsId)
        .first();
      
      if (slugInUse) {
        return secureJsonResponse(
          { error: 'Slug already exists. Please choose a different slug.' },
          409
        );
      }
    }

    const now = Date.now();
    const finalVisibility = visibility || existingNews.visibility || 'public';
    
    // Determine if this is publishing a draft
    const isDraftBeingPublished = existingNews.status === 'draft' && status === 'published';
    
    // Handle draft content logic
    let contentToSave = content || existingNews.content;
    let draftContent = existingNews.draft_content;
    
    // If publishing and there's draft content, use it as the main content
    if (status === 'published' && draftContent) {
      contentToSave = draftContent;
      draftContent = null; // Clear draft content after publishing
    } else if (status === 'draft') {
      // If saving as draft on a published article, store in draft_content
      if (existingNews.status === 'published') {
        draftContent = content || existingNews.content;
        contentToSave = existingNews.content; // Keep the published content
      }
    }

    // Update the news article
    await env.DB.prepare(
      `UPDATE news 
       SET title = ?, content = ?, draft_content = ?, cover_image = ?, image_caption = ?, 
           slug = ?, status = ?, visibility = ?, category = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
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
      )
      .run();

    // Get updated news article
    const updatedNews = await env.DB.prepare('SELECT * FROM news WHERE id = ?')
      .bind(newsId)
      .first();

    return secureJsonResponse({
      success: true,
      news: updatedNews,
      action_message: isDraftBeingPublished ? 'News article published successfully!' : 'News article updated successfully!'
    }, 200);
  } catch (error) {
    console.error('Error updating news:', error);
    return secureJsonResponse({ 
      error: 'Failed to update news article',
      details: error.message 
    }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const newsId = params.id;

  // Rate limiting for DELETE requests
  const rateLimit = await checkRateLimit(request, env, 'news_delete', 10, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  // Validate session with CSRF protection
  const session = await validateSessionWithCsrf(request, env);
  if (!session) {
    return secureJsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    // Check if news exists and user is the author
    const news = await env.DB.prepare('SELECT author_id FROM news WHERE id = ?')
      .bind(newsId)
      .first();

    if (!news) {
      return secureJsonResponse({ error: 'News article not found' }, 404);
    }

    // Only allow author to delete (no contributors for news)
    if (news.author_id !== session.user_id) {
      return secureJsonResponse({ error: 'Forbidden: Only the author can delete this news article' }, 403);
    }

    // Delete the news article
    await env.DB.prepare('DELETE FROM news WHERE id = ?')
      .bind(newsId)
      .run();

    return secureJsonResponse({ 
      success: true,
      message: 'News article deleted successfully'
    }, 200);
  } catch (error) {
    console.error('Error deleting news:', error);
    return secureJsonResponse({ 
      error: 'Failed to delete news article',
      details: error.message 
    }, 500);
  }
}

