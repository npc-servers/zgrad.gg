/**
 * Discord Bot - Real-time message listener
 * Listens for messages in the updates channel and stores them in the database
 */

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import crypto from 'crypto';
import { query } from './database.js';
import { cacheAttachments } from './attachment-cache.js';

let client = null;
let isReady = false;

/**
 * Initialize and start the Discord bot
 */
export async function startDiscordBot() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const updatesChannelId = process.env.DISCORD_UPDATES_CHANNEL_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken) {
    console.log('⚠️  Discord bot not configured (missing DISCORD_BOT_TOKEN)');
    return null;
  }

  if (!updatesChannelId) {
    console.log('⚠️  Discord updates channel not configured (missing DISCORD_UPDATES_CHANNEL_ID)');
    return null;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
      Partials.Message,
      Partials.Reaction,
    ],
  });

  // Bot ready event
  client.once('clientReady', async () => {
    isReady = true;
    console.log(`🤖 Discord bot connected as ${client.user.tag}`);
    
    // Initial sync of recent messages on startup
    await syncRecentMessages(updatesChannelId, guildId);
  });

  // Listen for new messages in the updates channel
  client.on('messageCreate', async (message) => {
    // Only process messages from the updates channel
    if (message.channel.id !== updatesChannelId) return;
    
    // Ignore bot messages (optional - remove if you want bot announcements)
    if (message.author.bot) return;

    console.log(`📨 New update from ${message.author.username}`);
    await processMessage(message, guildId);
  });

  // Listen for message edits
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.channel.id !== updatesChannelId) return;
    
    console.log(`✏️  Update edited by ${newMessage.author?.username || 'unknown'}`);
    await updateExistingMessage(newMessage);
  });

  // Listen for message deletions
  client.on('messageDelete', async (message) => {
    if (message.channel.id !== updatesChannelId) return;
    
    console.log(`🗑️  Update deleted: ${message.id}`);
    await deleteMessage(message.id);
  });

  // Listen for reaction changes
  client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.channel.id !== updatesChannelId) return;
    await updateMessageReactions(reaction.message);
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.message.channel.id !== updatesChannelId) return;
    await updateMessageReactions(reaction.message);
  });

  // Error handling
  client.on('error', (error) => {
    console.error('Discord bot error:', error);
  });

  // Login
  try {
    await client.login(botToken);
    return client;
  } catch (error) {
    console.error('❌ Failed to start Discord bot:', error.message);
    return null;
  }
}

/**
 * Stop the Discord bot
 */
export async function stopDiscordBot() {
  if (client) {
    await client.destroy();
    client = null;
    isReady = false;
    console.log('🤖 Discord bot disconnected');
  }
}

/**
 * Check if bot is ready
 */
export function isBotReady() {
  return isReady;
}

/**
 * Sync recent messages on startup (with grouping)
 */
async function syncRecentMessages(channelId, guildId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error('Could not find updates channel');
      return;
    }

    // Fetch last 100 messages
    const messages = await channel.messages.fetch({ limit: 100 });
    console.log(`📥 Syncing ${messages.size} recent messages...`);

    // Process in chronological order (oldest first)
    const sortedMessages = [...messages.values()].reverse();
    
    // Group consecutive messages from same author within 5 minutes
    const groupedMessages = [];
    let currentGroup = null;
    
    for (const message of sortedMessages) {
      if (message.author.bot) continue;
      if (!message.content && message.embeds.length === 0 && message.attachments.size === 0) continue;
      
      const messageTime = message.createdTimestamp;
      
      if (currentGroup && 
          currentGroup.author.id === message.author.id && 
          messageTime - currentGroup.timestamp < GROUPING_WINDOW_MS) {
        // Merge into current group
        currentGroup.content = (currentGroup.content || '') + 
          (currentGroup.content && message.content ? '\n\n' : '') + 
          (message.content || '');
        currentGroup.attachments = currentGroup.attachments.concat([...message.attachments.values()]);
        currentGroup.embeds = currentGroup.embeds.concat([...message.embeds]);
        currentGroup.groupedMessageIds.push(message.id);
        
        // Merge reactions
        for (const [, reaction] of message.reactions.cache) {
          const existing = currentGroup.reactions.find(r => {
            if (reaction.emoji.id && r.emoji.id) return r.emoji.id === reaction.emoji.id;
            if (!reaction.emoji.id && !r.emoji.id) return r.emoji.name === reaction.emoji.name;
            return false;
          });
          if (existing) {
            existing.count += reaction.count;
          } else {
            currentGroup.reactions.push({
              emoji: reaction.emoji,
              count: reaction.count,
            });
          }
        }
      } else {
        // Start new group
        if (currentGroup) groupedMessages.push(currentGroup);
        currentGroup = {
          id: message.id,
          author: message.author,
          content: message.content || '',
          timestamp: messageTime,
          channel: message.channel,
          attachments: [...message.attachments.values()],
          embeds: [...message.embeds],
          reactions: [...message.reactions.cache.values()].map(r => ({
            emoji: r.emoji,
            count: r.count,
          })),
          groupedMessageIds: [message.id],
        };
      }
    }
    if (currentGroup) groupedMessages.push(currentGroup);

    console.log(`📦 Grouped into ${groupedMessages.length} updates`);

    // Store grouped messages
    let newCount = 0;
    let updatedCount = 0;
    
    for (const group of groupedMessages) {
      // Check if the primary message already exists
      const existing = query.prepare(
        'SELECT id FROM updates WHERE discord_message_id = ?'
      ).bind(group.id).first();
      
      if (!existing) {
        await storeGroupedUpdate(group, guildId);
        newCount++;
      } else {
        // Update reactions for existing
        await updateGroupedReactions(group);
        updatedCount++;
      }
    }

    console.log(`✅ Initial sync complete: ${newCount} new, ${updatedCount} updated`);
  } catch (error) {
    console.error('Error syncing messages:', error);
  }
}

/**
 * Store a grouped update from initial sync
 */
async function storeGroupedUpdate(group, guildId) {
  let title = 'Update';
  let content = group.content || '';
  
  const lines = content.split('\n');
  if (lines[0] && (lines[0].startsWith('#') || lines[0].startsWith('**'))) {
    title = lines[0].replace(/^[#*\s]+/, '').replace(/[*]+$/, '').trim();
    content = lines.slice(1).join('\n').trim();
  } else if (group.embeds.length > 0 && group.embeds[0].title) {
    title = group.embeds[0].title;
  }

  // Cache attachments to prevent Discord CDN expiration
  const attachmentsList = group.attachments.map(a => ({
    url: a.url,
    filename: a.name,
    contentType: a.contentType,
  }));
  
  const cachedResults = await cacheAttachments(attachmentsList);
  
  // Build attachments with cached URLs
  const attachments = JSON.stringify(
    attachmentsList.map((att, index) => ({
      url: cachedResults[index]?.localUrl || att.url,
      originalUrl: att.url,
      filename: att.filename,
      contentType: att.contentType,
      cached: cachedResults[index]?.success || false,
    }))
  );

  const embeds = JSON.stringify(
    group.embeds.map(e => ({
      title: e.title,
      description: e.description,
      url: e.url,
      color: e.color,
      image: e.image?.url,
      thumbnail: e.thumbnail?.url,
    }))
  );

  const reactions = JSON.stringify(
    group.reactions.map(r => ({
      emoji: r.emoji.id ? {
        id: r.emoji.id,
        name: r.emoji.name,
        animated: r.emoji.animated || false
      } : { name: r.emoji.name },
      count: r.count,
    }))
  );

  const messageUrl = `https://discord.com/channels/${guildId}/${group.channel.id}/${group.id}`;
  const updateId = crypto.randomUUID();

  query.prepare(
    `INSERT INTO updates 
     (id, discord_message_id, channel_id, title, content, author_username, author_avatar, 
      author_id, message_url, timestamp, attachments, embeds, reactions, grouped_message_ids, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    updateId,
    group.id,
    group.channel.id,
    title,
    content,
    group.author.username,
    group.author.avatar,
    group.author.id,
    messageUrl,
    group.timestamp,
    attachments,
    embeds,
    reactions,
    JSON.stringify(group.groupedMessageIds),
    Date.now()
  ).run();
}

/**
 * Update reactions for a grouped update
 */
async function updateGroupedReactions(group) {
  const reactions = JSON.stringify(
    group.reactions.map(r => ({
      emoji: r.emoji.id ? {
        id: r.emoji.id,
        name: r.emoji.name,
        animated: r.emoji.animated || false
      } : { name: r.emoji.name },
      count: r.count,
    }))
  );

  query.prepare(
    'UPDATE updates SET reactions = ?, grouped_message_ids = ? WHERE discord_message_id = ?'
  ).bind(reactions, JSON.stringify(group.groupedMessageIds), group.id).run();
}

// Grouping window: 5 minutes (same as original)
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

/**
 * Process a new message and store it (with grouping support)
 * Groups consecutive messages from the same author within 5 minutes
 */
async function processMessage(message, guildId) {
  try {
    const messageTimestamp = message.createdTimestamp;
    
    // Check if there's a recent message from the same author to group with
    const recentUpdate = query.prepare(
      `SELECT id, discord_message_id, title, content, attachments, embeds, reactions, 
              grouped_message_ids, timestamp, author_id
       FROM updates 
       WHERE author_id = ? AND timestamp > ?
       ORDER BY timestamp DESC 
       LIMIT 1`
    ).bind(message.author.id, messageTimestamp - GROUPING_WINDOW_MS).first();

    // If we found a recent message from the same author, merge into it
    if (recentUpdate) {
      await mergeIntoExistingUpdate(recentUpdate, message);
      return;
    }

    // No recent message to group with - create a new update
    await createNewUpdate(message, guildId);
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

/**
 * Merge a new message into an existing update (grouping)
 */
async function mergeIntoExistingUpdate(existingUpdate, message) {
  try {
    // Parse existing data
    let existingContent = existingUpdate.content || '';
    let existingAttachments = JSON.parse(existingUpdate.attachments || '[]');
    let existingEmbeds = JSON.parse(existingUpdate.embeds || '[]');
    let existingReactions = JSON.parse(existingUpdate.reactions || '[]');
    let groupedMessageIds = JSON.parse(existingUpdate.grouped_message_ids || '[]');

    // Merge content
    const newContent = message.content || '';
    if (newContent) {
      existingContent = existingContent 
        ? existingContent + '\n\n' + newContent 
        : newContent;
    }

    // Merge attachments - cache new ones first
    const newAttachmentsList = [...message.attachments.values()].map(a => ({
      url: a.url,
      filename: a.name,
      contentType: a.contentType,
    }));
    
    // Cache new attachments
    const cachedResults = await cacheAttachments(newAttachmentsList);
    
    const newAttachments = newAttachmentsList.map((att, index) => ({
      url: cachedResults[index]?.localUrl || att.url,
      originalUrl: att.url,
      filename: att.filename,
      contentType: att.contentType,
      cached: cachedResults[index]?.success || false,
    }));
    existingAttachments = existingAttachments.concat(newAttachments);

    // Merge embeds
    const newEmbeds = message.embeds.map(e => ({
      title: e.title,
      description: e.description,
      url: e.url,
      color: e.color,
      image: e.image?.url,
      thumbnail: e.thumbnail?.url,
    }));
    existingEmbeds = existingEmbeds.concat(newEmbeds);

    // Merge reactions (combine counts for same emoji)
    const newReactions = [...message.reactions.cache.values()];
    for (const reaction of newReactions) {
      const emoji = reaction.emoji;
      const existingReaction = existingReactions.find(r => {
        if (emoji.id && r.emoji.id) return r.emoji.id === emoji.id;
        if (!emoji.id && !r.emoji.id) return r.emoji.name === emoji.name;
        return false;
      });

      if (existingReaction) {
        existingReaction.count += reaction.count;
      } else {
        existingReactions.push({
          emoji: emoji.id ? {
            id: emoji.id,
            name: emoji.name,
            animated: emoji.animated || false
          } : { name: emoji.name },
          count: reaction.count,
        });
      }
    }

    // Add this message ID to the group
    groupedMessageIds.push(message.id);

    // Re-extract title from combined content
    let title = existingUpdate.title;
    const lines = existingContent.split('\n');
    if (lines[0] && (lines[0].startsWith('#') || lines[0].startsWith('**'))) {
      title = lines[0].replace(/^[#*\s]+/, '').replace(/[*]+$/, '').trim();
      existingContent = lines.slice(1).join('\n').trim();
    }

    // Update the database
    query.prepare(
      `UPDATE updates SET 
         title = ?, content = ?, attachments = ?, embeds = ?, 
         reactions = ?, grouped_message_ids = ?
       WHERE id = ?`
    ).bind(
      title,
      existingContent,
      JSON.stringify(existingAttachments),
      JSON.stringify(existingEmbeds),
      JSON.stringify(existingReactions),
      JSON.stringify(groupedMessageIds),
      existingUpdate.id
    ).run();

    console.log(`📎 Grouped message into existing update (${groupedMessageIds.length} messages)`);
  } catch (error) {
    console.error('Error merging message:', error);
  }
}

/**
 * Create a new update entry
 */
async function createNewUpdate(message, guildId) {
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
      content = message.embeds[0].description + (content ? '\n\n' + content : '');
    }
  }

  // Process attachments - cache them to prevent Discord CDN expiration
  const attachmentsList = [...message.attachments.values()].map(a => ({
    url: a.url,
    filename: a.name,
    contentType: a.contentType,
  }));
  
  const cachedResults = await cacheAttachments(attachmentsList);
  
  const attachments = JSON.stringify(
    attachmentsList.map((att, index) => ({
      url: cachedResults[index]?.localUrl || att.url,
      originalUrl: att.url,
      filename: att.filename,
      contentType: att.contentType,
      cached: cachedResults[index]?.success || false,
    }))
  );

  // Process embeds
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

  // Process reactions
  const reactions = JSON.stringify(
    [...message.reactions.cache.values()].map(r => ({
      emoji: r.emoji.id ? {
        id: r.emoji.id,
        name: r.emoji.name,
        animated: r.emoji.animated || false
      } : { name: r.emoji.name },
      count: r.count,
    }))
  );

  const messageUrl = `https://discord.com/channels/${guildId}/${message.channel.id}/${message.id}`;
  const timestamp = message.createdTimestamp;
  const now = Date.now();
  const updateId = crypto.randomUUID();

  query.prepare(
    `INSERT INTO updates 
     (id, discord_message_id, channel_id, title, content, author_username, author_avatar, 
      author_id, message_url, timestamp, attachments, embeds, reactions, grouped_message_ids, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    updateId,
    message.id,
    message.channel.id,
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
    JSON.stringify([message.id]),
    now
  ).run();

  console.log(`✅ Stored new update: "${title.substring(0, 50)}..."`);
}

/**
 * Update an existing message (after edit)
 */
async function updateExistingMessage(message) {
  try {
    // Fetch full message if partial
    if (message.partial) {
      message = await message.fetch();
    }

    let title = 'Update';
    let content = message.content || '';
    
    const lines = content.split('\n');
    if (lines[0] && (lines[0].startsWith('#') || lines[0].startsWith('**'))) {
      title = lines[0].replace(/^[#*\s]+/, '').replace(/[*]+$/, '').trim();
      content = lines.slice(1).join('\n').trim();
    }

    // Cache attachments to prevent Discord CDN expiration
    const attachmentsList = [...message.attachments.values()].map(a => ({
      url: a.url,
      filename: a.name,
      contentType: a.contentType,
    }));
    
    const cachedResults = await cacheAttachments(attachmentsList);
    
    const attachments = JSON.stringify(
      attachmentsList.map((att, index) => ({
        url: cachedResults[index]?.localUrl || att.url,
        originalUrl: att.url,
        filename: att.filename,
        contentType: att.contentType,
        cached: cachedResults[index]?.success || false,
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

    query.prepare(
      `UPDATE updates SET title = ?, content = ?, attachments = ?, embeds = ? 
       WHERE discord_message_id = ?`
    ).bind(title, content, attachments, embeds, message.id).run();

    console.log(`✅ Updated message: ${message.id}`);
  } catch (error) {
    console.error('Error updating message:', error);
  }
}

/**
 * Delete a message from the database
 */
async function deleteMessage(messageId) {
  try {
    query.prepare('DELETE FROM updates WHERE discord_message_id = ?').bind(messageId).run();
    console.log(`✅ Deleted message: ${messageId}`);
  } catch (error) {
    console.error('Error deleting message:', error);
  }
}

/**
 * Update reactions for a message
 */
async function updateMessageReactions(message) {
  try {
    // Fetch full message if partial
    if (message.partial) {
      message = await message.fetch();
    }

    const reactions = JSON.stringify(
      [...message.reactions.cache.values()].map(r => ({
        emoji: r.emoji.id ? {
          id: r.emoji.id,
          name: r.emoji.name,
          animated: r.emoji.animated || false
        } : { name: r.emoji.name },
        count: r.count,
      }))
    );

    query.prepare(
      'UPDATE updates SET reactions = ? WHERE discord_message_id = ?'
    ).bind(reactions, message.id).run();
  } catch (error) {
    console.error('Error updating reactions:', error);
  }
}

/**
 * Get bot status
 */
export function getBotStatus() {
  return {
    connected: isReady,
    username: client?.user?.tag || null,
    guilds: client?.guilds.cache.size || 0,
  };
}

