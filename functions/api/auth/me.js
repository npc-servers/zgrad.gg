// Get current user session information
export async function onRequest(context) {
  const { request, env } = context;

  // Get session from cookie
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get session from database
  const session = await env.DB.prepare(
    'SELECT user_id, username, discriminator, avatar, expires_at FROM sessions WHERE id = ?'
  )
    .bind(sessionId)
    .first();

  if (!session || session.expires_at < Date.now()) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      id: session.user_id,
      username: session.username,
      discriminator: session.discriminator,
      avatar: session.avatar,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}




