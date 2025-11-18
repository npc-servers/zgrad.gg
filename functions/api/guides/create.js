// Create a new guide
import { validateSession } from '../../_middleware/auth.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

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
    const { title, description, content, thumbnail, slug, status = 'draft' } = data;

    if (!title || !content || !slug) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, content, slug' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
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

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating guide:', error);
    return new Response(JSON.stringify({ error: 'Failed to create guide' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}




