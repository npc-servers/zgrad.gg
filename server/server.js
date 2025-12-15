/**
 * ZGRAD CMS - VPS Server
 * Express.js server that replaces Cloudflare Workers/Pages Functions
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import database (ensures it's created/initialized before routes)
import { initDatabase } from './lib/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import guidesRoutes from './routes/guides.js';
import newsRoutes from './routes/news.js';
import updatesRoutes from './routes/updates.js';
import imagesRoutes from './routes/images.js';
import locksRoutes from './routes/locks.js';
import salesRoutes from './routes/sales.js';

// Import middleware
import { addSecurityHeaders } from './lib/security-utils.js';
import { validateSession } from './middleware/auth.js';
import { serveGuide } from './routes/guides-page.js';
import { serveNews } from './routes/news-page.js';
import { serveImage } from './routes/images-serve.js';
import { serveAttachment } from './lib/attachment-cache.js';
import { startDiscordBot, stopDiscordBot } from './lib/discord-bot.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for reverse proxies like nginx)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Security headers middleware
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guides', guidesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/locks', locksRoutes);
app.use('/api/sales', salesRoutes);

// Dynamic guide pages - serve from database
app.get('/guides/:slug', serveGuide);

// Dynamic news pages - serve from database
app.get('/news/:slug', serveNews);

// Serve uploaded images
app.get('/images/guides/:filename', serveImage);

// Serve cached Discord attachments
app.get('/api/attachments/:filename', serveAttachment);

// Protect CMS routes - redirect to login if not authenticated
app.use('/cms', async (req, res, next) => {
  // Allow access to login page
  if (req.path === '/login.html' || req.path === '/login') {
    return next();
  }
  
  // Check if user has valid session
  const session = await validateSession(req);
  
  if (!session) {
    // Redirect to login page
    return res.redirect('/cms/login.html');
  }
  
  next();
});

// Serve static files from dist folder (for production)
app.use(express.static(path.join(__dirname, '../dist')));

// Handle extensionless URLs and fallback routing
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const distPath = path.join(__dirname, '../dist');
  const requestedPath = req.path;
  
  // Try to serve static file first
  const staticPath = path.join(distPath, requestedPath);
  res.sendFile(staticPath, (err) => {
    if (err) {
      // If the path doesn't have an extension and isn't a directory, try adding .html
      if (!path.extname(requestedPath)) {
        const htmlPath = path.join(distPath, requestedPath + '.html');
        res.sendFile(htmlPath, (htmlErr) => {
          if (htmlErr) {
            // Also try as a directory with index.html
            const indexPath = path.join(distPath, requestedPath, 'index.html');
            res.sendFile(indexPath, (indexErr) => {
              if (indexErr) {
                // Final fallback: serve 404 page or main index
                const notFoundPath = path.join(distPath, '404.html');
                res.status(404).sendFile(notFoundPath, (notFoundErr) => {
                  if (notFoundErr) {
                    res.status(404).send('Page not found');
                  }
                });
              }
            });
          }
        });
      } else {
        // Has extension but file not found - serve 404
        const notFoundPath = path.join(distPath, '404.html');
        res.status(404).sendFile(notFoundPath, (notFoundErr) => {
          if (notFoundErr) {
            res.status(404).send('Page not found');
          }
        });
      }
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, async () => {
  const dbInfo = initDatabase();
  
  console.log(`🚀 ZGRAD CMS server running on http://localhost:${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, '../dist')}`);
  console.log(`💾 Database: ${dbInfo.path}${dbInfo.isNew ? ' (newly created)' : ''}`);
  
  // Start Discord bot for real-time updates
  await startDiscordBot();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await stopDiscordBot();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await stopDiscordBot();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;

