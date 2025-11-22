// Discord utility functions for fetching channel/user information

/**
 * Fetch Discord channel information by ID
 * @param {string} channelId - Discord channel ID
 * @param {string} botToken - Discord bot token
 * @returns {Promise<{id: string, name: string, type: number}|null>}
 */
export async function getChannelInfo(channelId, botToken) {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch channel ${channelId}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Replace Discord channel URLs with formatted channel names
 * @param {string} content - Text content with Discord URLs
 * @param {string} botToken - Discord bot token
 * @param {string} guildId - Discord guild/server ID
 * @returns {Promise<string>} Content with replaced channel links
 */
export async function replaceDiscordChannelLinks(content, botToken, guildId) {
  if (!content || !botToken || !guildId) return content;

  // Match Discord channel URLs: https://discord.com/channels/GUILD_ID/CHANNEL_ID or /CHANNEL_ID/MESSAGE_ID
  const channelUrlPattern = new RegExp(
    `https://discord\\.com/channels/${guildId}/(\\d+)(?:/(\\d+))?`,
    'g'
  );

  const matches = [...content.matchAll(channelUrlPattern)];
  
  if (matches.length === 0) return content;

  // Fetch all unique channel IDs
  const channelIds = [...new Set(matches.map(m => m[1]))];
  const channelCache = new Map();

  // Fetch all channel info in parallel
  await Promise.all(
    channelIds.map(async (channelId) => {
      const info = await getChannelInfo(channelId, botToken);
      if (info) {
        channelCache.set(channelId, info.name);
      }
    })
  );

  // Replace URLs with formatted channel names (always as clickable links)
  let processedContent = content;
  
  for (const match of matches) {
    const [fullUrl, channelId, messageId] = match;
    const channelName = channelCache.get(channelId);
    
    if (channelName) {
      // Check if URL is already inside markdown link syntax [text](url)
      const urlIndex = processedContent.indexOf(fullUrl);
      if (urlIndex > 0) {
        // Look back to see if there's a ]( before this URL
        const beforeUrl = processedContent.substring(Math.max(0, urlIndex - 2), urlIndex);
        if (beforeUrl === '](') {
          // URL is already in a markdown link, keep the existing link text as-is
          continue;
        }
      }
      
      // URL is standalone (not in markdown link), create a new link with channel name
      const replacement = `[#${channelName}](${fullUrl})`;
      processedContent = processedContent.replace(fullUrl, replacement);
    }
  }

  return processedContent;
}

/**
 * Process update content to replace Discord links
 * @param {Object} update - Update object with content and embeds
 * @param {string} botToken - Discord bot token
 * @param {string} guildId - Discord guild/server ID
 * @returns {Promise<Object>} Processed update object
 */
export async function processUpdateDiscordLinks(update, botToken, guildId) {
  if (!botToken || !guildId) return update;

  const processed = { ...update };

  // Process main content
  if (processed.content) {
    processed.content = await replaceDiscordChannelLinks(
      processed.content,
      botToken,
      guildId
    );
  }

  // Process embeds
  if (processed.embeds && Array.isArray(processed.embeds)) {
    processed.embeds = await Promise.all(
      processed.embeds.map(async (embed) => {
        const processedEmbed = { ...embed };
        
        if (processedEmbed.description) {
          processedEmbed.description = await replaceDiscordChannelLinks(
            processedEmbed.description,
            botToken,
            guildId
          );
        }
        
        if (processedEmbed.title) {
          processedEmbed.title = await replaceDiscordChannelLinks(
            processedEmbed.title,
            botToken,
            guildId
          );
        }
        
        return processedEmbed;
      })
    );
  }

  return processed;
}
