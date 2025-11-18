// Get current user session information
import { validateSession } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Rate limiting
  const rateLimit = await checkRateLimit(request, env, 'auth_me', 120, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  // Validate session
  const session = await validateSession(request, env);
  
  if (!session) {
    return secureJsonResponse({ error: 'Not authenticated' }, 401);
  }

  return secureJsonResponse({
    id: session.user_id,
    username: session.username,
    discriminator: session.discriminator,
    avatar: session.avatar,
  }, 200);
}




