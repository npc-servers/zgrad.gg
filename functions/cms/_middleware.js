/**
 * Middleware to protect CMS routes
 * Redirects to unauthorized page if not authenticated
 */

import { validateSession } from '../_middleware/auth.js';

export async function onRequest(context) {
  const { request, env, next } = context;

  // Allow unauthorized page to load without auth
  if (request.url.includes('/cms/unauthorized')) {
    return next();
  }

  // Validate session
  const session = await validateSession(request, env);

  if (!session) {
    // Not authenticated, redirect to unauthorized page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/cms/unauthorized.html'
      }
    });
  }

  // Authenticated, continue to CMS
  return next();
}

