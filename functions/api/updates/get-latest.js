// Get the latest update (for quick preview/checking)
import { secureJsonResponse, checkRateLimit } from '../../_lib/security-utils.js';
import { processUpdateDiscordLinks } from '../../_lib/discord-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(request, env, 'updates_latest', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  try {
    // Fetch the most recent update
    const update = await env.DB.prepare(
      `SELECT id, title, content, author_username, author_avatar, author_id, message_url, 
       timestamp, attachments, embeds, reactions
       FROM updates 
       ORDER BY timestamp DESC
       LIMIT 1`
    ).first();

    if (!update) {
      return secureJsonResponse({ update: null }, 200);
    }

    // Parse JSON fields
    let parsedUpdate = {
      ...update,
      attachments: update.attachments ? JSON.parse(update.attachments) : [],
      embeds: update.embeds ? JSON.parse(update.embeds) : [],
      reactions: update.reactions ? JSON.parse(update.reactions) : [],
    };

    // Process Discord channel links if bot token is available
    if (env.DISCORD_BOT_TOKEN && env.DISCORD_GUILD_ID) {
      parsedUpdate = await processUpdateDiscordLinks(
        parsedUpdate,
        env.DISCORD_BOT_TOKEN,
        env.DISCORD_GUILD_ID
      );
    }

    return secureJsonResponse({ update: parsedUpdate }, 200);
  } catch (error) {
    console.error('Error fetching latest update:', error);
    return secureJsonResponse({ error: 'Failed to fetch latest update' }, 500);
  }
}

