/**
 * Updates API routes for VPS
 * Note: Updates are synced in real-time via Discord bot (see lib/discord-bot.js)
 * These endpoints are for reading/querying updates
 */

import { Router } from 'express';
import { query } from '../lib/database.js';
import { secureJsonResponse, checkRateLimit } from '../lib/security-utils.js';
import { processUpdateDiscordLinks } from '../lib/discord-utils.js';
import { getBotStatus } from '../lib/discord-bot.js';

const router = Router();

/**
 * GET /api/updates/list - List all updates
 */
router.get('/list', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'updates_list', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const { results } = query.prepare(
      `SELECT id, title, content, author_username, author_avatar, author_id, message_url, 
       timestamp, attachments, embeds, reactions
       FROM updates 
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    let updates = results.map(update => ({
      ...update,
      attachments: update.attachments ? JSON.parse(update.attachments) : [],
      embeds: update.embeds ? JSON.parse(update.embeds) : [],
      reactions: update.reactions ? JSON.parse(update.reactions) : [],
    }));

    // Process Discord channel links if configured
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    
    if (botToken && guildId) {
      updates = await Promise.all(
        updates.map(update => processUpdateDiscordLinks(update, botToken, guildId))
      );
    }

    return secureJsonResponse(res, { 
      updates,
      limit,
      offset,
      hasMore: results.length === limit
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch updates' }, 500);
  }
});

/**
 * GET /api/updates/get-latest - Get latest update
 */
router.get('/get-latest', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'updates_latest', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const update = query.prepare(
      'SELECT id, title, timestamp FROM updates ORDER BY timestamp DESC LIMIT 1'
    ).first();

    return secureJsonResponse(res, { update });
  } catch (error) {
    console.error('Error fetching latest update:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch latest update' }, 500);
  }
});

/**
 * GET /api/updates/status - Get Discord bot status
 */
router.get('/status', async (req, res) => {
  const status = getBotStatus();
  const updateCount = query.prepare('SELECT COUNT(*) as count FROM updates').first();
  
  return secureJsonResponse(res, {
    bot: status,
    updates: {
      count: updateCount?.count || 0,
    }
  });
});

/**
 * GET /api/updates/auto-sync - Legacy endpoint (now handled by bot)
 * Kept for backwards compatibility - returns status instead
 */
router.get('/auto-sync', async (req, res) => {
  const status = getBotStatus();
  const updateCount = query.prepare('SELECT COUNT(*) as count FROM updates').first();
  
  return secureJsonResponse(res, { 
    synced: status.connected,
    reason: status.connected ? 'Real-time sync via Discord bot' : 'Bot not connected',
    count: updateCount?.count || 0,
    bot_status: status
  });
});

/**
 * POST /api/updates/refresh - Legacy endpoint (now handled by bot)
 * Kept for backwards compatibility - reactions are updated in real-time
 */
router.post('/refresh', async (req, res) => {
  const status = getBotStatus();
  
  return secureJsonResponse(res, {
    refreshed: status.connected,
    message: status.connected 
      ? 'Reactions are synced in real-time via Discord bot' 
      : 'Bot not connected - reactions may be stale'
  });
});

export default router;
