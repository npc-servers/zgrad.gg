/**
 * Discord utility functions for VPS
 */

/**
 * Fetch Discord channel information by ID
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
 */
export async function replaceDiscordChannelLinks(content, botToken, guildId) {
  if (!content || !botToken || !guildId) return content;

  const channelUrlPattern = new RegExp(
    `https://discord\\.com/channels/${guildId}/(\\d+)(?:/(\\d+))?`,
    'g'
  );

  const matches = [...content.matchAll(channelUrlPattern)];
  
  if (matches.length === 0) return content;

  const channelIds = [...new Set(matches.map(m => m[1]))];
  const channelCache = new Map();

  await Promise.all(
    channelIds.map(async (channelId) => {
      const info = await getChannelInfo(channelId, botToken);
      if (info) {
        channelCache.set(channelId, info.name);
      }
    })
  );

  let processedContent = content;
  
  for (const match of matches) {
    const [fullUrl, channelId] = match;
    const channelName = channelCache.get(channelId);
    
    if (channelName) {
      const urlIndex = processedContent.indexOf(fullUrl);
      if (urlIndex > 0) {
        const beforeUrl = processedContent.substring(Math.max(0, urlIndex - 2), urlIndex);
        if (beforeUrl === '](') {
          continue;
        }
      }
      
      const replacement = `[#${channelName}](${fullUrl})`;
      processedContent = processedContent.replace(fullUrl, replacement);
    }
  }

  return processedContent;
}

/**
 * Process update content to replace Discord links
 */
export async function processUpdateDiscordLinks(update, botToken, guildId) {
  if (!botToken || !guildId) return update;

  const processed = { ...update };

  if (processed.content) {
    processed.content = await replaceDiscordChannelLinks(
      processed.content,
      botToken,
      guildId
    );
  }

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

