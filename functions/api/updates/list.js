// List all updates from database (public endpoint)
import { secureJsonResponse, checkRateLimit } from '../../_lib/security-utils.js';
import { processUpdateDiscordLinks } from '../../_lib/discord-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(request, env, 'updates_list', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch updates from database, ordered by timestamp (newest first)
    const { results } = await env.DB.prepare(
      `SELECT id, title, content, author_username, author_avatar, author_id, message_url, 
       timestamp, attachments, embeds, reactions
       FROM updates 
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    // Parse JSON fields
    let updates = results.map(update => ({
      ...update,
      attachments: update.attachments ? JSON.parse(update.attachments) : [],
      embeds: update.embeds ? JSON.parse(update.embeds) : [],
      reactions: update.reactions ? JSON.parse(update.reactions) : [],
    }));

    // Process Discord channel links if bot token is available
    if (env.DISCORD_BOT_TOKEN && env.DISCORD_GUILD_ID) {
      updates = await Promise.all(
        updates.map(update => 
          processUpdateDiscordLinks(update, env.DISCORD_BOT_TOKEN, env.DISCORD_GUILD_ID)
        )
      );
    }

    return secureJsonResponse({ 
      updates,
      limit,
      offset,
      hasMore: results.length === limit
    }, 200);
  } catch (error) {
    console.error('Error fetching updates:', error);
    return secureJsonResponse({ error: 'Failed to fetch updates' }, 500);
  }
}

