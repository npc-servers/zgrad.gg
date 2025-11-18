// List all guides from database
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, slug, title, description, thumbnail, author_id, author_name, author_avatar, status, created_at, updated_at FROM guides ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({ guides: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch guides' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}




