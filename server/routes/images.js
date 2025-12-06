/**
 * Image upload API routes for VPS
 * Supports both R2 (production) and local storage (fallback)
 */

import { Router } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { query } from '../lib/database.js';
import { validateSessionWithCsrf } from '../middleware/auth.js';
import { 
  secureJsonResponse, 
  checkRateLimit, 
  validateImageMagicNumbers 
} from '../lib/security-utils.js';
import { 
  isR2Configured, 
  uploadToR2, 
  existsInR2, 
  getPublicUrl 
} from '../lib/r2-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Ensure uploads directory exists (for local fallback)
const uploadsDir = path.join(__dirname, '../data/uploads/guides');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP'));
    }
  }
});

/**
 * POST /api/images/upload - Upload an image
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  // Rate limiting
  const rateLimit = await checkRateLimit(req, 'image_upload', 20, 3600);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Upload rate limit exceeded. Please try again later.' }, 429);
  }

  // Validate session with CSRF protection
  const session = await validateSessionWithCsrf(req);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const file = req.file;

    if (!file) {
      return secureJsonResponse(res, { error: 'No image provided' }, 400);
    }

    // Validate file content by checking magic numbers
    if (!validateImageMagicNumbers(file.buffer)) {
      return secureJsonResponse(res, {
        error: 'Invalid image file. File content does not match expected image format.'
      }, 400);
    }

    // Generate content-based hash for deduplication
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    
    // Sanitize filename
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = path.extname(sanitizedFilename) || '.png';
    const filename = `${hash.substring(0, 16)}${extension}`;
    const key = `guides/${filename}`;

    // Try R2 first if configured
    if (isR2Configured()) {
      // Check if already exists in R2 (deduplication)
      const exists = await existsInR2(key);
      
      if (!exists) {
        // Upload to R2
        const result = await uploadToR2(key, file.buffer, file.mimetype, {
          uploadedBy: session.user_id,
          uploadedAt: Date.now().toString(),
          originalFilename: sanitizedFilename,
        });

        if (!result.success) {
          console.error('R2 upload failed, falling back to local:', result.error);
          // Fall through to local storage
        } else {
          return secureJsonResponse(res, {
            success: true,
            url: result.url,
            filename: filename,
            storage: 'r2',
            deduplicated: false,
          });
        }
      } else {
        // File already exists in R2
        return secureJsonResponse(res, {
          success: true,
          url: getPublicUrl(key),
          filename: filename,
          storage: 'r2',
          deduplicated: true,
        });
      }
    }

    // Local storage fallback
    const filePath = path.join(uploadsDir, filename);

    // Check if image already exists locally (deduplication)
    const existing = query.prepare('SELECT filename FROM local_images WHERE hash = ?').bind(hash).first();

    if (!existing) {
      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Store metadata in database
      const imageId = `local-${hash.substring(0, 16)}`;
      query.prepare(
        'INSERT INTO local_images (id, filename, content_type, file_path, size, hash, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        imageId,
        filename,
        file.mimetype,
        filePath,
        file.size,
        hash,
        session.user_id,
        Date.now()
      ).run();
    }

    // Return URL path
    const imageUrl = `/images/guides/${filename}`;

    return secureJsonResponse(res, {
      success: true,
      url: imageUrl,
      filename: filename,
      storage: 'local',
      deduplicated: !!existing,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return secureJsonResponse(res, { 
      error: 'Failed to upload image',
      details: error.message 
    }, 500);
  }
});

export default router;
