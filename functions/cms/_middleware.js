/**
 * Middleware to protect CMS routes
 * Redirects to login page if not authenticated or missing required Discord roles
 */

import { validateSession } from '../_middleware/auth.js';

export async function onRequest(context) {
  const { request, env, next } = context;

  // Allow login page to load without auth
  if (request.url.includes('/cms/login')) {
    return next();
  }

  // Validate session and verify Discord roles on every page access
  const session = await validateSession(request, env, true);

  if (!session) {
    // Not authenticated or role check failed, redirect to login page
    const url = new URL(request.url);
    const loginUrl = '/cms/login.html';
    
    // Add error message if user was previously logged in but lost access
    const cookies = request.headers.get('Cookie') || '';
    const hadSession = cookies.includes('session_id=');
    
    if (hadSession) {
      // Clear the invalid cookie
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${loginUrl}?error=role_required`,
          'Set-Cookie': 'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
        }
      });
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': loginUrl
      }
    });
  }

  // Authenticated and has required role, continue to CMS
  return next();
}

