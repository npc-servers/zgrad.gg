// Authentication middleware helper
export async function validateSession(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  if (!sessionId) {
    return null;
  }

  // Get session from database
  const session = await env.DB.prepare(
    'SELECT user_id, username, discriminator, avatar, expires_at FROM sessions WHERE id = ?'
  )
    .bind(sessionId)
    .first();

  if (!session || session.expires_at < Date.now()) {
    return null;
  }

  return session;
}




