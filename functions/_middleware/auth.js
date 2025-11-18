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
    'SELECT id, user_id, username, discriminator, avatar, expires_at FROM sessions WHERE id = ?'
  )
    .bind(sessionId)
    .first();

  if (!session || session.expires_at < Date.now()) {
    // Clean up expired session
    if (session) {
      await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    }
    return null;
  }

  return session;
}

/**
 * Validate session with CSRF protection
 * @param {Request} request - Request object
 * @param {Object} env - Environment bindings
 * @returns {Promise<Object|null>} Session object or null
 */
export async function validateSessionWithCsrf(request, env) {
  const session = await validateSession(request, env);
  if (!session) {
    return null;
  }

  // For state-changing methods, verify CSRF token or origin
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    // Check origin first (simpler fallback)
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');
    const url = new URL(request.url);
    
    const validOrigins = [
      url.origin,
      'https://zgrad.gg',
      'https://www.zgrad.gg'
    ];

    let isValidOrigin = false;
    if (origin && validOrigins.includes(origin)) {
      isValidOrigin = true;
    } else if (referer) {
      try {
        const refererUrl = new URL(referer);
        isValidOrigin = validOrigins.includes(refererUrl.origin);
      } catch (e) {
        isValidOrigin = false;
      }
    }

    if (!isValidOrigin) {
      console.warn('CSRF protection: Invalid origin', { origin, referer });
      return null;
    }
  }

  return session;
}




