/**
 * Image serving route for VPS
 * Supports R2 (redirect/proxy) and local storage
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../lib/database.js';
import { isR2Configured, getFromR2, getPublicUrl } from '../lib/r2-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../data/uploads/guides');

/**
 * Serve uploaded images
 * Priority: R2 public URL redirect → R2 proxy → Local DB → Local file → Static assets
 */
export async function serveImage(req, res) {
  try {
    const filename = req.params.filename;

    if (!filename) {
      return res.status(404).send('Not found');
    }

    const key = `guides/${filename}`;

    // If R2 is configured and we have a public URL, redirect to it
    if (isR2Configured() && process.env.R2_PUBLIC_URL) {
      const publicUrl = getPublicUrl(key);
      return res.redirect(301, publicUrl);
    }

    // If R2 is configured but no public URL, proxy the request
    if (isR2Configured()) {
      const r2Object = await getFromR2(key);
      if (r2Object) {
        res.set({
          'Content-Type': r2Object.contentType || 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': r2Object.etag,
        });
        
        // Stream the body to response
        const chunks = [];
        for await (const chunk of r2Object.body) {
          chunks.push(chunk);
        }
        return res.send(Buffer.concat(chunks));
      }
    }

    // Check database for local image metadata
    const image = query.prepare(
      'SELECT content_type, file_path FROM local_images WHERE filename = ?'
    ).bind(filename).first();

    if (image && fs.existsSync(image.file_path)) {
      res.set({
        'Content-Type': image.content_type || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.sendFile(image.file_path);
    }

    // Try direct file path in uploads
    const directPath = path.join(uploadsDir, filename);
    if (fs.existsSync(directPath)) {
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.sendFile(directPath);
    }

    // Fall back to static assets
    const staticPath = path.join(__dirname, '../../dist/images/guides', filename);
    if (fs.existsSync(staticPath)) {
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.sendFile(staticPath);
    }

    res.status(404).send('Image not found');
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error serving image');
  }
}
