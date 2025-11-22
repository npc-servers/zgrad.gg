// Refresh endpoint - Updates reactions for recent messages
import { secureJsonResponse, checkRateLimit } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting - lighter than full sync
  const rateLimit = await checkRateLimit(request, env, 'updates_refresh', 6, 60); // 6 per minute
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded', refreshed: false }, 429);
  }

  try {
    const botToken = env.DISCORD_BOT_TOKEN;
    const channelId = env.DISCORD_UPDATES_CHANNEL_ID;

    if (!botToken || !channelId) {
      return secureJsonResponse({ 
        refreshed: false,
        error: 'Discord not configured'
      }, 500);
    }

    // Get the 10 most recent updates from database
    const { results: recentUpdates } = await env.DB.prepare(
      `SELECT discord_message_id, id 
       FROM updates 
       ORDER BY timestamp DESC 
       LIMIT 10`
    ).all();

    if (!recentUpdates || recentUpdates.length === 0) {
      return secureJsonResponse({ 
        refreshed: false,
        message: 'No updates to refresh'
      }, 200);
    }

    let refreshedCount = 0;

    // Fetch and update each message's reactions
    for (const update of recentUpdates) {
      try {
        // Fetch fresh message data from Discord
        const messageResponse = await fetch(
          `https://discord.com/api/v10/channels/${channelId}/messages/${update.discord_message_id}`,
          {
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!messageResponse.ok) {
          console.warn(`[Refresh] Failed to fetch message ${update.discord_message_id}:`, messageResponse.status);
          continue;
        }

        const message = await messageResponse.json();

        // Process reactions
        const reactions = JSON.stringify(
          (message.reactions || []).map(r => ({
            emoji: r.emoji.id ? {
              id: r.emoji.id,
              name: r.emoji.name,
              animated: r.emoji.animated || false
            } : {
              name: r.emoji.name
            },
            count: r.count,
            me: r.me || false
          }))
        );

        // Update reactions in database
        await env.DB.prepare(
          'UPDATE updates SET reactions = ? WHERE id = ?'
        ).bind(reactions, update.id).run();

        refreshedCount++;
      } catch (error) {
        console.error(`[Refresh] Error updating message ${update.discord_message_id}:`, error);
      }
    }

    console.log(`[Refresh] Updated reactions for ${refreshedCount}/${recentUpdates.length} messages`);

    return secureJsonResponse({
      refreshed: true,
      count: refreshedCount,
      total: recentUpdates.length
    }, 200);
  } catch (error) {
    console.error('[Refresh] Error:', error);
    return secureJsonResponse({ 
      refreshed: false,
      error: 'Failed to refresh updates',
      details: error.message 
    }, 500);
  }
}
