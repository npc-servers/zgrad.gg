// Automatic Discord updates sync - runs on page load if no updates exist
// This ensures the first visit automatically populates updates without manual intervention
import { secureJsonResponse, checkRateLimit } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Lighter rate limiting for auto-sync (this runs on page visits)
  const rateLimit = await checkRateLimit(request, env, 'auto_sync', 10, 60); // 10 per minute
  if (!rateLimit.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded', synced: false }, 429);
  }

  try {
    // Check if we have any updates already
    const existingCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM updates'
    ).first();

    // If we already have updates, don't auto-sync (rely on webhook/polling instead)
    if (existingCount && existingCount.count > 0) {
      return secureJsonResponse({ 
        synced: false, 
        reason: 'Already initialized',
        count: existingCount.count 
      }, 200);
    }

    // Get Discord bot token and channel from environment
    const botToken = env.DISCORD_BOT_TOKEN;
    const channelId = env.DISCORD_UPDATES_CHANNEL_ID;

    if (!botToken || !channelId) {
      return secureJsonResponse({ 
        synced: false,
        error: 'Discord not configured',
        details: 'Set DISCORD_BOT_TOKEN and DISCORD_UPDATES_CHANNEL_ID environment variables'
      }, 500);
    }

    // Fetch recent messages from Discord
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=100`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!discordResponse.ok) {
      const error = await discordResponse.json().catch(() => ({}));
      console.error('[Auto-Sync] Discord API error:', error);
      return secureJsonResponse({ 
        synced: false,
        error: 'Failed to fetch Discord messages',
        details: error 
      }, discordResponse.status);
    }

    const messages = await discordResponse.json();
    let syncedCount = 0;

    // Group consecutive messages from same author within 1 minute
    const groupedMessages = [];
    let currentGroup = null;
    
    for (const message of messages.reverse()) { // Reverse to process oldest first
      if (!message.content && message.embeds.length === 0 && message.attachments.length === 0) continue;
      
      const messageTime = new Date(message.timestamp).getTime();
      
      if (currentGroup && 
          currentGroup.author.id === message.author.id && 
          messageTime - currentGroup.timestamp < 300000) { // Within 5 minutes
        // Merge into current group
        currentGroup.content += (currentGroup.content ? '\n\n' : '') + (message.content || '');
        currentGroup.attachments = currentGroup.attachments.concat(message.attachments);
        currentGroup.embeds = currentGroup.embeds.concat(message.embeds);
        
        // Track all message IDs in this group
        currentGroup.groupedMessageIds.push(message.id);
        
        // Merge reactions - combine counts for same emoji
        if (message.reactions && message.reactions.length > 0) {
          const currentReactions = currentGroup.reactions || [];
          
          for (const newReaction of message.reactions) {
            // Find if this emoji already exists in current reactions
            const existingIndex = currentReactions.findIndex(r => {
              // Compare custom emojis by ID, unicode by name
              if (newReaction.emoji.id && r.emoji.id) {
                return r.emoji.id === newReaction.emoji.id;
              } else if (!newReaction.emoji.id && !r.emoji.id) {
                return r.emoji.name === newReaction.emoji.name;
              }
              return false;
            });
            
            if (existingIndex !== -1) {
              // Emoji exists, add the counts
              currentReactions[existingIndex].count += newReaction.count;
              currentReactions[existingIndex].me = currentReactions[existingIndex].me || newReaction.me;
            } else {
              // New emoji, add it
              currentReactions.push({ ...newReaction });
            }
          }
          
          currentGroup.reactions = currentReactions;
        }
      } else {
        // Start new group
        if (currentGroup) groupedMessages.push(currentGroup);
        currentGroup = {
          ...message,
          timestamp: messageTime,
          attachments: [...message.attachments],
          embeds: [...message.embeds],
          reactions: message.reactions ? [...message.reactions] : [],
          groupedMessageIds: [message.id] // Track all message IDs in this group
        };
      }
    }
    if (currentGroup) groupedMessages.push(currentGroup);

    // Process and store grouped messages
    for (const message of groupedMessages) {
      
      // Extract title and content
      let title = 'Update';
      let content = message.content || '';
      
      const lines = content.split('\n');
      if (lines[0] && (lines[0].startsWith('#') || lines[0].startsWith('**'))) {
        title = lines[0].replace(/^[#*\s]+/, '').replace(/[*]+$/, '').trim();
        content = lines.slice(1).join('\n').trim();
      } else if (message.embeds.length > 0 && message.embeds[0].title) {
        title = message.embeds[0].title;
        if (message.embeds[0].description) {
          content = message.embeds[0].description + '\n\n' + content;
        }
      }

      const attachments = JSON.stringify(
        message.attachments.map(a => ({
          url: a.url,
          filename: a.filename,
          contentType: a.content_type,
        }))
      );

      const embeds = JSON.stringify(
        message.embeds.map(e => ({
          title: e.title,
          description: e.description,
          url: e.url,
          color: e.color,
          image: e.image?.url,
          thumbnail: e.thumbnail?.url,
        }))
      );

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

      const groupedMessageIds = JSON.stringify(message.groupedMessageIds || [message.id]);

      const messageUrl = `https://discord.com/channels/${env.DISCORD_GUILD_ID}/${channelId}/${message.id}`;
      const timestamp = typeof message.timestamp === 'number' ? message.timestamp : new Date(message.timestamp).getTime();
      const now = Date.now();

      // Insert new message (ignore if exists - no need to check since table is empty)
      const updateId = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT OR IGNORE INTO updates 
         (id, discord_message_id, channel_id, title, content, 
          author_username, author_avatar, author_id, message_url, timestamp, attachments, embeds, reactions, grouped_message_ids, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        updateId,
        message.id,
        channelId,
        title,
        content,
        message.author.username,
        message.author.avatar,
        message.author.id,
        messageUrl,
        timestamp,
        attachments,
        embeds,
        reactions,
        groupedMessageIds,
        now
      ).run();
      
      syncedCount++;
    }

    console.log(`[Auto-Sync] Initialized with ${syncedCount} updates`);

    return secureJsonResponse({
      synced: true,
      count: syncedCount,
      message: 'Updates initialized successfully'
    }, 200);
  } catch (error) {
    console.error('[Auto-Sync] Error:', error);
    return secureJsonResponse({ 
      synced: false,
      error: 'Failed to auto-sync',
      details: error.message 
    }, 500);
  }
}

