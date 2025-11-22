// Image upload endpoint with compression
import { validateSessionWithCsrf } from '../../_middleware/auth.js';
import { secureJsonResponse, checkRateLimit, validateImageMagicNumbers } from '../../_lib/security-utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting - 20 uploads per hour
  const rateLimit = await checkRateLimit(request, env, 'image_upload', 20, 3600);
  if (!rateLimit.allowed) {
    return secureJsonResponse({ 
      error: 'Upload rate limit exceeded. Please try again later.' 
    }, 429);
  }

  // Validate session with CSRF protection
  const session = await validateSessionWithCsrf(request, env);
  if (!session) {
    return secureJsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return secureJsonResponse({ error: 'No image provided' }, 400);
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return secureJsonResponse({ error: 'File too large. Maximum size: 10MB' }, 400);
    }

    // Read file bytes for validation
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Validate actual file content by checking magic numbers (file signatures)
    if (!validateImageMagicNumbers(uint8Array)) {
      return secureJsonResponse({
        error: 'Invalid image file. File content does not match expected image format.'
      }, 400);
    }

    // Validate MIME type as secondary check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return secureJsonResponse({
        error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'
      }, 400);
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Detect development mode - check if we're using local R2 or if request is from localhost
    const isDevMode = request.url.includes('localhost') || request.url.includes('127.0.0.1');
    
    // Check if R2 is available (production) or if we're in dev mode
    if (!env.R2_BUCKET || isDevMode) {
      // Development mode - store in D1 for persistence
      console.log('Development mode detected, using D1 local storage');
      
      // Generate content-based hash for deduplication (same as production)
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const extension = sanitizedFilename.split('.').pop() || 'png';
      const filename = `${hashHex.substring(0, 16)}.${extension}`;
      const imageId = `local-${hashHex.substring(0, 16)}`;
      
      // Check if image already exists (deduplication)
      const existing = await env.DB.prepare(
        'SELECT filename FROM local_images WHERE hash = ?'
      ).bind(hashHex).first();
      
      if (!existing) {
        // Convert binary data to base64 for D1 storage
        // Process in chunks to avoid stack overflow with large files
        let binaryString = '';
        const chunkSize = 8192; // 8KB chunks
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          binaryString += String.fromCharCode(...chunk);
        }
        const base64Data = btoa(binaryString);
        
        // Store in D1
        await env.DB.prepare(
          'INSERT INTO local_images (id, filename, content_type, data, size, hash, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          imageId,
          filename,
          file.type,
          base64Data,
          file.size,
          hashHex,
          session.user_id,
          Date.now()
        ).run();
      }
      
      // Return local URL path
      const localUrl = `/images/guides/${filename}`;
      
      return secureJsonResponse({
        success: true,
        url: localUrl,
        filename: filename,
        dev_mode: true,
        deduplicated: !!existing,
        warning: 'Using local D1 storage. Images will persist across reloads.',
      }, 200);
    }

    // Production mode - upload to R2
    // Generate content-based hash for deduplication
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Use hash-based filename to enable deduplication
    const extension = sanitizedFilename.split('.').pop() || 'png';
    const filename = `${hashHex.substring(0, 16)}.${extension}`;
    const key = `guides/${filename}`;

    // Check if file already exists (deduplication)
    const existingFile = await env.R2_BUCKET.head(key);
    
    if (!existingFile) {
      // Upload to Cloudflare R2 only if it doesn't exist
      await env.R2_BUCKET.put(key, uint8Array, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          uploadedBy: session.user_id,
          uploadedAt: Date.now().toString(),
          originalFilename: sanitizedFilename,
        },
      });
    }

    // Return public URL
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return secureJsonResponse({
      success: true,
      url: publicUrl,
      filename: filename,
      deduplicated: !!existingFile,
    }, 200);
  } catch (error) {
    console.error('Error uploading image:', error);
    return secureJsonResponse({ 
      error: 'Failed to upload image',
      details: error.message 
    }, 500);
  }
}




