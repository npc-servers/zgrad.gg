/**
 * Security utilities for CMS (VPS version)
 */

import crypto from 'crypto';
import { query } from './database.js';

/**
 * Security headers to add to all responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

/**
 * Add security headers to Express response
 */
export function addSecurityHeaders(res) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.set(key, value);
  });
}

/**
 * Create a secure JSON response
 */
export function secureJsonResponse(res, data, status = 200) {
  addSecurityHeaders(res);
  return res.status(status).json(data);
}

/**
 * Create an error response
 */
export function errorResponse(res, message, status = 500) {
  return secureJsonResponse(res, { error: message }, status);
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfToken(req) {
  const token = req.headers['x-csrf-token'];
  
  if (!token) {
    return false;
  }

  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    return false;
  }

  const stored = query.prepare(
    'SELECT token FROM csrf_tokens WHERE session_id = ? AND expires_at > ?'
  ).bind(sessionId, Date.now()).first();

  return stored?.token === token;
}

/**
 * Generate CSRF token for a session
 */
export async function generateCsrfToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');

  // Store with 24 hour expiration
  const expiresAt = Date.now() + 86400000;
  
  query.prepare(
    'INSERT OR REPLACE INTO csrf_tokens (session_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, token, expiresAt).run();

  return token;
}

/**
 * Verify request origin to prevent CSRF
 */
export function verifyOrigin(req) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  const validOrigins = [
    `http://localhost:${process.env.PORT || 3000}`,
    'http://localhost:5173',
    process.env.SITE_URL,
    'https://zgrad.gg',
    'https://www.zgrad.gg'
  ].filter(Boolean);

  if (origin) {
    return validOrigins.includes(origin);
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return validOrigins.includes(refererUrl.origin);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Rate limiting check using SQLite
 */
export async function checkRateLimit(req, action, limit = 100, windowSeconds = 60) {
  const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const key = `rate_limit:${action}:${clientIP}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Get current timestamps
  const data = query.prepare('SELECT timestamps FROM rate_limits WHERE key = ?').bind(key).first();
  let timestamps = data ? JSON.parse(data.timestamps) : [];
  
  // Filter out old timestamps
  timestamps = timestamps.filter(ts => ts > windowStart);
  
  // Check if limit exceeded
  if (timestamps.length >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Add current timestamp
  timestamps.push(now);
  
  // Store updated timestamps
  query.prepare(
    'INSERT OR REPLACE INTO rate_limits (key, timestamps, updated_at) VALUES (?, ?, ?)'
  ).bind(key, JSON.stringify(timestamps), now).run();

  return { allowed: true, remaining: limit - timestamps.length };
}

/**
 * Validate image file by checking magic numbers
 */
export function validateImageMagicNumbers(buffer) {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return true;
  }

  return false;
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  html = html.replace(/javascript:/gi, '');

  return html;
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptData(data, keyString) {
  const key = Buffer.from(keyString.padEnd(32, '0').substring(0, 32));
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(encryptedData, keyString) {
  const key = Buffer.from(keyString.padEnd(32, '0').substring(0, 32));
  const combined = Buffer.from(encryptedData, 'base64');
  
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const encrypted = combined.subarray(28);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions() {
  query.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run();
  query.prepare('DELETE FROM csrf_tokens WHERE expires_at < ?').bind(Date.now()).run();
}

/**
 * Validate slug format
 */
export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Check if IP is in allowlist
 */
export function isIpAllowed(ip, allowlist) {
  if (!allowlist || allowlist.length === 0) {
    return true;
  }
  return allowlist.includes(ip) || allowlist.includes('*');
}

/**
 * Verify user has required Discord roles using the bot token
 */
export async function verifyDiscordRoles(userId) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    const requiredRolesStr = process.env.DISCORD_REQUIRED_ROLES;

    if (!botToken || !guildId || !requiredRolesStr) {
      console.warn('Discord verification skipped: Missing configuration');
      return { hasRole: true };
    }

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { hasRole: false, error: 'not_in_guild' };
      }
      console.error('Discord API error:', response.status);
      return { hasRole: false, error: 'api_error' };
    }

    const memberData = await response.json();
    const requiredRoles = requiredRolesStr.split(',').map(r => r.trim());
    const hasRequiredRole = memberData.roles.some(role => requiredRoles.includes(role));

    return { hasRole: hasRequiredRole, error: hasRequiredRole ? undefined : 'no_required_role' };
  } catch (error) {
    console.error('Error verifying Discord roles:', error);
    return { hasRole: false, error: 'verification_failed' };
  }
}

/**
 * Verify user has admin Discord roles using the bot token
 * Admin roles are defined in DISCORD_ADMIN_ROLES environment variable
 */
export async function verifyAdminRole(userId) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    const adminRolesStr = process.env.DISCORD_ADMIN_ROLES;

    if (!botToken || !guildId) {
      console.warn('Admin verification skipped: Missing configuration');
      return { isAdmin: false, error: 'missing_config' };
    }

    // If no admin roles are configured, no one is an admin
    if (!adminRolesStr) {
      return { isAdmin: false, error: 'no_admin_roles_configured' };
    }

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { isAdmin: false, error: 'not_in_guild' };
      }
      console.error('Discord API error:', response.status);
      return { isAdmin: false, error: 'api_error' };
    }

    const memberData = await response.json();
    const adminRoles = adminRolesStr.split(',').map(r => r.trim());
    const isAdmin = memberData.roles.some(role => adminRoles.includes(role));

    return { isAdmin, userRoles: memberData.roles };
  } catch (error) {
    console.error('Error verifying admin roles:', error);
    return { isAdmin: false, error: 'verification_failed' };
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 3600000);

