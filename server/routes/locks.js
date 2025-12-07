/**
 * Editing Locks API routes
 * Handles real-time content locking for the CMS
 */

import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../lib/database.js';
import { validateSession } from '../middleware/auth.js';
import { secureJsonResponse, checkRateLimit } from '../lib/security-utils.js';

const router = Router();

// Lock duration in milliseconds (60 seconds - requires heartbeat to maintain)
const LOCK_DURATION = 60 * 1000;

/**
 * Clean up expired locks
 */
const cleanExpiredLocks = () => {
  const now = Date.now();
  query.prepare('DELETE FROM editing_locks WHERE expires_at < ?').bind(now).run();
};

/**
 * GET /api/locks/status - Get all active locks
 */
router.get('/status', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'locks_status', 120, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    // Clean up expired locks first
    cleanExpiredLocks();

    // Get all active locks
    const locks = query.prepare(
      'SELECT content_type, content_id, user_id, username, avatar, locked_at, expires_at FROM editing_locks'
    ).all().results;

    return secureJsonResponse(res, { locks });
  } catch (error) {
    console.error('Error fetching locks:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch locks' }, 500);
  }
});

/**
 * POST /api/locks/acquire - Try to acquire a lock on content
 */
router.post('/acquire', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'locks_acquire', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const { content_type, content_id } = req.body;

    if (!content_type || !content_id) {
      return secureJsonResponse(res, { error: 'Missing content_type or content_id' }, 400);
    }

    // Clean up expired locks first
    cleanExpiredLocks();

    const now = Date.now();
    const expiresAt = now + LOCK_DURATION;

    // Check if there's an existing lock
    const existingLock = query.prepare(
      'SELECT * FROM editing_locks WHERE content_type = ? AND content_id = ?'
    ).bind(content_type, content_id).first();

    if (existingLock) {
      // If the lock belongs to the current user, refresh it
      if (existingLock.user_id === session.user_id) {
        query.prepare(
          'UPDATE editing_locks SET expires_at = ?, locked_at = ? WHERE content_type = ? AND content_id = ?'
        ).bind(expiresAt, now, content_type, content_id).run();

        return secureJsonResponse(res, {
          success: true,
          locked: true,
          lock: {
            content_type,
            content_id,
            user_id: session.user_id,
            username: session.username,
            avatar: session.avatar,
            locked_at: now,
            expires_at: expiresAt
          }
        });
      }

      // Lock belongs to someone else
      return secureJsonResponse(res, {
        success: false,
        locked: true,
        locked_by: {
          user_id: existingLock.user_id,
          username: existingLock.username,
          avatar: existingLock.avatar,
          locked_at: existingLock.locked_at
        }
      });
    }

    // No existing lock - create one
    const id = crypto.randomUUID();
    query.prepare(
      `INSERT INTO editing_locks (id, content_type, content_id, user_id, username, avatar, locked_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, content_type, content_id, session.user_id, session.username, session.avatar, now, expiresAt).run();

    return secureJsonResponse(res, {
      success: true,
      locked: true,
      lock: {
        content_type,
        content_id,
        user_id: session.user_id,
        username: session.username,
        avatar: session.avatar,
        locked_at: now,
        expires_at: expiresAt
      }
    });
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return secureJsonResponse(res, { error: 'Failed to acquire lock' }, 500);
  }
});

/**
 * POST /api/locks/heartbeat - Extend lock expiration
 */
router.post('/heartbeat', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'locks_heartbeat', 120, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const { content_type, content_id } = req.body;

    if (!content_type || !content_id) {
      return secureJsonResponse(res, { error: 'Missing content_type or content_id' }, 400);
    }

    const now = Date.now();
    const expiresAt = now + LOCK_DURATION;

    // Update expiration if the lock belongs to the current user
    const result = query.prepare(
      'UPDATE editing_locks SET expires_at = ? WHERE content_type = ? AND content_id = ? AND user_id = ?'
    ).bind(expiresAt, content_type, content_id, session.user_id).run();

    if (result.changes === 0) {
      return secureJsonResponse(res, { success: false, error: 'Lock not found or not owned by user' }, 404);
    }

    return secureJsonResponse(res, { success: true, expires_at: expiresAt });
  } catch (error) {
    console.error('Error extending lock:', error);
    return secureJsonResponse(res, { error: 'Failed to extend lock' }, 500);
  }
});

/**
 * POST /api/locks/release - Release a lock
 */
router.post('/release', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'locks_release', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const { content_type, content_id } = req.body;

    if (!content_type || !content_id) {
      return secureJsonResponse(res, { error: 'Missing content_type or content_id' }, 400);
    }

    // Only release if the lock belongs to the current user
    query.prepare(
      'DELETE FROM editing_locks WHERE content_type = ? AND content_id = ? AND user_id = ?'
    ).bind(content_type, content_id, session.user_id).run();

    return secureJsonResponse(res, { success: true });
  } catch (error) {
    console.error('Error releasing lock:', error);
    return secureJsonResponse(res, { error: 'Failed to release lock' }, 500);
  }
});

/**
 * POST /api/locks/force-release - Force release a lock (admin only, or own locks)
 */
router.post('/force-release', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'locks_force_release', 10, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const { content_type, content_id } = req.body;

    if (!content_type || !content_id) {
      return secureJsonResponse(res, { error: 'Missing content_type or content_id' }, 400);
    }

    // For now, anyone can force release (you could add admin check here)
    query.prepare(
      'DELETE FROM editing_locks WHERE content_type = ? AND content_id = ?'
    ).bind(content_type, content_id).run();

    return secureJsonResponse(res, { success: true });
  } catch (error) {
    console.error('Error force releasing lock:', error);
    return secureJsonResponse(res, { error: 'Failed to force release lock' }, 500);
  }
});

export default router;
