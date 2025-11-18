/**
 * Middleware to protect CMS routes
 * Redirects to login page if not authenticated
 */

import { validateSession } from '../_middleware/auth.js';

export async function onRequest(context) {
  const { request, env, next } = context;

  // Allow login page to load without auth
  if (request.url.includes('/cms/login')) {
    return next();
  }

  // Validate session
  const session = await validateSession(request, env);

  if (!session) {
    // Not authenticated, redirect to login page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/cms/login.html'
      }
    });
  }

  // Authenticated, continue to CMS
  return next();
}

