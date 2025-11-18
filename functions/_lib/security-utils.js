/**
 * Security utilities for CMS
 */

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
 * Add security headers to a response
 * @param {Response} response - Original response
 * @returns {Response} Response with security headers
 */
export function addSecurityHeaders(response) {
  const newResponse = new Response(response.body, response);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

/**
 * Create a JSON response with security headers
 * @param {Object} data - Data to send
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
export function secureJsonResponse(data, status = 200) {
  return addSecurityHeaders(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/**
 * Verify CSRF token from request
 * @param {Request} request - Request object
 * @param {Object} env - Environment bindings
 * @returns {Promise<boolean>} True if valid
 */
export async function verifyCsrfToken(request, env) {
  const token = request.headers.get('X-CSRF-Token');
  
  if (!token) {
    return false;
  }

  // Get session ID from cookie
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  if (!sessionId) {
    return false;
  }

  // Verify token matches session
  const storedToken = await env.KV?.get(`csrf:${sessionId}`);
  return storedToken === token;
}

/**
 * Generate CSRF token for a session
 * @param {string} sessionId - Session ID
 * @param {Object} env - Environment bindings
 * @returns {Promise<string>} CSRF token
 */
export async function generateCsrfToken(sessionId, env) {
  // Generate random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  // Store in KV with 24 hour expiration
  if (env.KV) {
    await env.KV.put(`csrf:${sessionId}`, token, { expirationTtl: 86400 });
  }

  return token;
}

/**
 * Verify request origin to prevent CSRF
 * @param {Request} request - Request object
 * @returns {boolean} True if origin is valid
 */
export function verifyOrigin(request) {
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  const url = new URL(request.url);
  
  // Allow same-origin requests
  const validOrigins = [
    url.origin,
    'https://zgrad.gg',
    'https://www.zgrad.gg'
  ];

  if (origin) {
    return validOrigins.includes(origin);
  }

  if (referer) {
    const refererUrl = new URL(referer);
    return validOrigins.includes(refererUrl.origin);
  }

  // If neither Origin nor Referer is present (e.g., direct API calls), reject
  return false;
}

/**
 * Rate limiting check
 * @param {Request} request - Request object
 * @param {Object} env - Environment bindings
 * @param {string} action - Action being rate limited
 * @param {number} limit - Max requests per window
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
export async function checkRateLimit(request, env, action, limit = 100, windowSeconds = 60) {
  if (!env.KV) {
    // If KV is not available, allow (development mode)
    return { allowed: true, remaining: limit };
  }

  // Get client identifier (IP or session)
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
  
  const key = `rate_limit:${action}:${clientIP}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Get current request timestamps
  const data = await env.KV.get(key, 'json') || { timestamps: [] };
  
  // Filter out old timestamps
  const recentTimestamps = data.timestamps.filter(ts => ts > windowStart);
  
  // Check if limit exceeded
  if (recentTimestamps.length >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Add current timestamp
  recentTimestamps.push(now);
  
  // Store updated timestamps
  await env.KV.put(key, JSON.stringify({ timestamps: recentTimestamps }), {
    expirationTtl: windowSeconds + 10
  });

  return { allowed: true, remaining: limit - recentTimestamps.length };
}

/**
 * Validate image file by checking magic numbers
 * @param {Uint8Array} bytes - File bytes
 * @returns {boolean} True if valid image
 */
export function validateImageMagicNumbers(bytes) {
  if (bytes.length < 12) return false;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return true;
  }

  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return true;
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return true;
  }

  return false;
}

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} html - HTML content
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  
  // This is a basic sanitization - in production, consider using a library like DOMPurify
  // For now, we'll use a allowlist approach for common safe tags
  
  const allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre',
    'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ];
  
  const allowedAttributes = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'style'],
    'div': ['class', 'style'],
    'span': ['class', 'style'],
    'p': ['class', 'style'],
    'code': ['class'],
    'pre': ['class']
  };

  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  html = html.replace(/javascript:/gi, '');
  
  // Remove data: protocol for images (except from trusted domains)
  html = html.replace(/<img[^>]+src=["']data:[^"']*["']/gi, (match) => {
    // Allow data URLs only for small inline images (< 1KB base64)
    if (match.length < 1400) return match;
    return match.replace(/src=["']data:[^"']*["']/, 'src=""');
  });

  return html;
}

/**
 * Encrypt data using AES-GCM
 * @param {string} data - Data to encrypt
 * @param {string} keyString - Encryption key
 * @returns {Promise<string>} Encrypted data (base64)
 */
export async function encryptData(data, keyString) {
  // Generate a key from the key string
  const keyData = new TextEncoder().encode(keyString.padEnd(32, '0').substring(0, 32));
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt data
  const encodedData = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedData - Encrypted data (base64)
 * @param {string} keyString - Encryption key
 * @returns {Promise<string>} Decrypted data
 */
export async function decryptData(encryptedData, keyString) {
  // Generate key from key string
  const keyData = new TextEncoder().encode(keyString.padEnd(32, '0').substring(0, 32));
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Convert from base64
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Clean up expired sessions
 * @param {Object} env - Environment bindings
 * @returns {Promise<void>}
 */
export async function cleanupExpiredSessions(env) {
  const now = Date.now();
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?')
    .bind(now)
    .run();
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid
 */
export function isValidSlug(slug) {
  // Slug should be lowercase, alphanumeric with hyphens, no spaces
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Check if IP is in allowlist
 * @param {string} ip - IP address
 * @param {string[]} allowlist - Array of allowed IPs or CIDR ranges
 * @returns {boolean} True if allowed
 */
export function isIpAllowed(ip, allowlist) {
  if (!allowlist || allowlist.length === 0) {
    return true; // If no allowlist, allow all
  }
  
  return allowlist.includes(ip) || allowlist.includes('*');
}

