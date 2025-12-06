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

// Import middleware
import { addSecurityHeaders } from './lib/security-utils.js';
import { serveGuide } from './routes/guides-page.js';
import { serveImage } from './routes/images-serve.js';
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

// Dynamic guide pages - serve from database
app.get('/guides/:slug', serveGuide);

// Serve uploaded images
app.get('/images/guides/:filename', serveImage);

// Serve static files from dist folder (for production)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Try to serve static file first, then fallback to index.html
  const staticPath = path.join(__dirname, '../dist', req.path);
  res.sendFile(staticPath, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
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

