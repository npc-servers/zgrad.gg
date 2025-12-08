/**
 * Authentication middleware for VPS
 */

import { query } from '../lib/database.js';
import { verifyDiscordRoles, verifyAdminRole, verifyOrigin } from '../lib/security-utils.js';

/**
 * Validate session from cookies
 */
export async function validateSession(req, verifyRoles = false) {
  const sessionId = req.cookies?.session_id;

  if (!sessionId) {
    return null;
  }

  // Get session from database
  const session = query.prepare(
    'SELECT id, user_id, username, discriminator, avatar, expires_at FROM sessions WHERE id = ?'
  ).bind(sessionId).first();

  if (!session || session.expires_at < Date.now()) {
    // Clean up expired session
    if (session) {
      query.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    }
    return null;
  }

  // Verify Discord roles if requested
  if (verifyRoles) {
    const roleCheck = await verifyDiscordRoles(session.user_id);
    
    if (!roleCheck.hasRole) {
      console.warn(`User ${session.user_id} failed role check: ${roleCheck.error}`);
      query.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
      return null;
    }
  }

  return session;
}

/**
 * Validate session with CSRF protection and Discord role verification
 */
export async function validateSessionWithCsrf(req, verifyRoles = true) {
  const session = await validateSession(req, verifyRoles);
  if (!session) {
    return null;
  }

  // For state-changing methods, verify origin
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (!verifyOrigin(req)) {
      console.warn('CSRF protection: Invalid origin', {
        origin: req.headers.origin,
        referer: req.headers.referer
      });
      return null;
    }
  }

  return session;
}

/**
 * Express middleware to require authentication
 */
export function requireAuth(verifyRoles = false) {
  return async (req, res, next) => {
    const session = await validateSession(req, verifyRoles);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.session = session;
    next();
  };
}

/**
 * Express middleware to require authentication with CSRF
 */
export function requireAuthWithCsrf(verifyRoles = true) {
  return async (req, res, next) => {
    const session = await validateSessionWithCsrf(req, verifyRoles);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.session = session;
    next();
  };
}

/**
 * Express middleware to optionally load session
 */
export function optionalAuth(verifyRoles = false) {
  return async (req, res, next) => {
    req.session = await validateSession(req, verifyRoles);
    next();
  };
}

/**
 * Express middleware to require admin authentication
 */
export function requireAdmin() {
  return async (req, res, next) => {
    const session = await validateSessionWithCsrf(req, true);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin role
    const adminCheck = await verifyAdminRole(session.user_id);
    if (!adminCheck.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.session = session;
    req.isAdmin = true;
    next();
  };
}

