/**
 * Attachment Caching Module
 * Downloads and caches Discord CDN attachments locally to prevent expiration issues
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from './database.js';
import { isR2Configured, uploadToR2, getPublicUrl, existsInR2 } from './r2-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure attachments directory exists
const attachmentsDir = path.join(__dirname, '../data/uploads/attachments');
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
  console.log('📁 Created attachments cache directory:', attachmentsDir);
}

// Supported content types for caching
const SUPPORTED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

/**
 * Generate a hash of the Discord URL (without query params, which contain expiration info)
 */
function getUrlHash(discordUrl) {
  // Remove query parameters as they contain expiration tokens
  const baseUrl = discordUrl.split('?')[0];
  return crypto.createHash('sha256').update(baseUrl).digest('hex').substring(0, 32);
}

/**
 * Extract filename from Discord URL
 */
function extractFilename(discordUrl) {
  const urlPath = discordUrl.split('?')[0];
  const parts = urlPath.split('/');
  return parts[parts.length - 1] || 'attachment';
}

/**
 * Get content type from filename extension
 */
function getContentTypeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const typeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  };
  return typeMap[ext] || 'application/octet-stream';
}

/**
 * Check if an attachment is already cached
 */
export function getCachedAttachment(discordUrl) {
  const urlHash = getUrlHash(discordUrl);
  
  const cached = query.prepare(
    'SELECT local_path, filename, content_type FROM cached_attachments WHERE discord_url_hash = ?'
  ).bind(urlHash).first();
  
  return cached || null;
}

/**
 * Get the serve URL for a cached attachment
 */
export function getCachedAttachmentUrl(filename) {
  if (isR2Configured() && process.env.R2_PUBLIC_URL) {
    return getPublicUrl(`attachments/${filename}`);
  }
  return `/api/attachments/${filename}`;
}

/**
 * Download and cache a Discord attachment
 * @param {string} discordUrl - The Discord CDN URL
 * @param {string} contentType - The content type (optional, will be detected from filename)
 * @returns {Promise<{success: boolean, localUrl?: string, error?: string}>}
 */
export async function cacheAttachment(discordUrl, contentType = null) {
  // Skip non-Discord URLs
  if (!discordUrl.includes('cdn.discordapp.com')) {
    return { success: false, error: 'Not a Discord CDN URL' };
  }

  const urlHash = getUrlHash(discordUrl);
  const originalFilename = extractFilename(discordUrl);
  
  // Check if already cached
  const existing = getCachedAttachment(discordUrl);
  if (existing) {
    // Verify the file still exists
    if (isR2Configured()) {
      const existsR2 = await existsInR2(`attachments/${existing.filename}`);
      if (existsR2) {
        return { 
          success: true, 
          localUrl: getCachedAttachmentUrl(existing.filename),
          filename: existing.filename,
          cached: true 
        };
      }
    } else if (fs.existsSync(existing.local_path)) {
      return { 
        success: true, 
        localUrl: getCachedAttachmentUrl(existing.filename),
        filename: existing.filename,
        cached: true 
      };
    }
    // File doesn't exist anymore, will re-download
  }

  // Detect content type
  if (!contentType) {
    contentType = getContentTypeFromFilename(originalFilename);
  }

  // Check if content type is supported
  const extension = SUPPORTED_TYPES[contentType];
  if (!extension) {
    console.log(`[AttachmentCache] Unsupported content type: ${contentType} for ${originalFilename}`);
    return { success: false, error: `Unsupported content type: ${contentType}` };
  }

  // Generate cached filename
  const cachedFilename = `${urlHash}${extension}`;

  try {
    // Download the attachment
    console.log(`[AttachmentCache] Downloading: ${originalFilename}`);
    const response = await fetch(discordUrl);
    
    if (!response.ok) {
      // If the Discord URL already expired, we can't cache it
      console.warn(`[AttachmentCache] Failed to download (${response.status}): ${originalFilename}`);
      return { success: false, error: `Download failed: ${response.status}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileSize = buffer.length;

    // Limit file size (50MB max)
    if (fileSize > 50 * 1024 * 1024) {
      return { success: false, error: 'File too large (>50MB)' };
    }

    let localPath = '';
    let localUrl = '';

    // Try R2 first if configured
    if (isR2Configured()) {
      const key = `attachments/${cachedFilename}`;
      const result = await uploadToR2(key, buffer, contentType, {
        originalUrl: discordUrl.split('?')[0],
        cachedAt: Date.now().toString(),
      });

      if (result.success) {
        localPath = key;
        localUrl = result.url;
      } else {
        console.warn('[AttachmentCache] R2 upload failed, using local storage');
      }
    }

    // Fall back to local storage
    if (!localUrl) {
      localPath = path.join(attachmentsDir, cachedFilename);
      fs.writeFileSync(localPath, buffer);
      localUrl = getCachedAttachmentUrl(cachedFilename);
    }

    // Store in database
    const id = crypto.randomUUID();
    
    // Use INSERT OR REPLACE to handle duplicates
    query.prepare(
      `INSERT OR REPLACE INTO cached_attachments 
       (id, discord_url, discord_url_hash, local_path, filename, content_type, size, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      discordUrl.split('?')[0], // Store URL without query params
      urlHash,
      localPath,
      cachedFilename,
      contentType,
      fileSize,
      Date.now()
    ).run();

    console.log(`[AttachmentCache] Cached: ${originalFilename} -> ${cachedFilename}`);

    return {
      success: true,
      localUrl,
      filename: cachedFilename,
      cached: false,
    };
  } catch (error) {
    console.error('[AttachmentCache] Error caching attachment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cache multiple attachments in parallel
 * @param {Array<{url: string, contentType?: string}>} attachments
 * @returns {Promise<Array<{originalUrl: string, localUrl: string, success: boolean}>>}
 */
export async function cacheAttachments(attachments) {
  const results = await Promise.all(
    attachments.map(async (att) => {
      const result = await cacheAttachment(att.url, att.contentType);
      return {
        originalUrl: att.url,
        localUrl: result.success ? result.localUrl : att.url, // Fall back to original if caching fails
        filename: result.filename,
        success: result.success,
      };
    })
  );
  return results;
}

/**
 * Serve a cached attachment file
 */
export async function serveAttachment(req, res) {
  try {
    const filename = req.params.filename;
    
    if (!filename) {
      return res.status(404).send('Not found');
    }

    // Security: only allow expected filename format (hash + extension)
    if (!/^[a-f0-9]{32}\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(filename)) {
      return res.status(400).send('Invalid filename');
    }

    // Check R2 first
    if (isR2Configured() && process.env.R2_PUBLIC_URL) {
      const publicUrl = getPublicUrl(`attachments/${filename}`);
      return res.redirect(301, publicUrl);
    }

    // Serve from local storage
    const filePath = path.join(attachmentsDir, filename);
    
    if (fs.existsSync(filePath)) {
      const contentType = getContentTypeFromFilename(filename);
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.sendFile(filePath);
    }

    // Check database for metadata
    const cached = query.prepare(
      'SELECT local_path, content_type FROM cached_attachments WHERE filename = ?'
    ).bind(filename).first();

    if (cached && fs.existsSync(cached.local_path)) {
      res.set({
        'Content-Type': cached.content_type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.sendFile(cached.local_path);
    }

    res.status(404).send('Attachment not found');
  } catch (error) {
    console.error('[AttachmentCache] Error serving attachment:', error);
    res.status(500).send('Error serving attachment');
  }
}

