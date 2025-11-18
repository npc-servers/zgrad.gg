// Logout endpoint for CMS
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Get session from cookie
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  if (sessionId) {
    // Delete session from database
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  // Clear session cookie and redirect
  const response = Response.redirect(new URL('/', url.origin), 302);
  response.headers.append(
    'Set-Cookie',
    'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );

  return response;
}




