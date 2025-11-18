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

    // Check if R2 is available (production) or if we're in dev mode
    if (!env.R2_BUCKET) {
      // Development mode - convert to data URL for preview
      console.log('R2_BUCKET not available, using data URL for development');
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      return secureJsonResponse({
        success: true,
        url: dataUrl,
        filename: sanitizedFilename,
        dev_mode: true,
        warning: 'Using data URL - image will not persist on page reload. Upload to production for permanent storage.',
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




