// Get, update, or delete a specific guide
import { validateSession } from '../../_middleware/auth.js';

export async function onRequestGet(context) {
  const { params, env } = context;
  const guideId = params.id;

  try {
    const guide = await env.DB.prepare('SELECT * FROM guides WHERE id = ?')
      .bind(guideId)
      .first();

    if (!guide) {
      return new Response(JSON.stringify({ error: 'Guide not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get contributors for this guide
    const contributors = await env.DB.prepare(
      'SELECT user_id, username, avatar, contributed_at FROM guide_contributors WHERE guide_id = ? ORDER BY contributed_at DESC'
    )
      .bind(guideId)
      .all();

    return new Response(
      JSON.stringify({ 
        guide,
        contributors: contributors.results || []
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching guide:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch guide' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context) {
  const { request, params, env } = context;
  const guideId = params.id;

  // Validate session
  const session = await validateSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();
    const { title, description, content, thumbnail, slug, status } = data;

    // Check if guide exists
    const existingGuide = await env.DB.prepare('SELECT * FROM guides WHERE id = ?')
      .bind(guideId)
      .first();

    if (!existingGuide) {
      return new Response(JSON.stringify({ error: 'Guide not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if editor is not the original author
    const isContributor = existingGuide.author_id !== session.user_id;
    
    // Update guide
    const now = Date.now();
    await env.DB.prepare(
      'UPDATE guides SET title = ?, description = ?, content = ?, thumbnail = ?, slug = ?, status = ?, updated_at = ? WHERE id = ?'
    )
      .bind(title, description, content, thumbnail, slug, status, now, guideId)
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

    return new Response(
      JSON.stringify({
        success: true,
        is_contributor: isContributor,
        guide: {
          id: guideId,
          title,
          description,
          slug,
          thumbnail,
          status,
          updated_at: now,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating guide:', error);
    return new Response(JSON.stringify({ error: 'Failed to update guide' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const guideId = params.id;

  // Validate session
  const session = await validateSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check if guide exists
    const existingGuide = await env.DB.prepare('SELECT * FROM guides WHERE id = ?')
      .bind(guideId)
      .first();

    if (!existingGuide) {
      return new Response(JSON.stringify({ error: 'Guide not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete guide
    await env.DB.prepare('DELETE FROM guides WHERE id = ?').bind(guideId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting guide:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete guide' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}




