/**
 * SQLite Database Module
 * Replaces Cloudflare D1 with better-sqlite3 for VPS
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'cms.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database schema
const initSchema = () => {
  db.exec(`
    -- Sessions table for authentication
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      discriminator TEXT NOT NULL,
      avatar TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    -- Guides table
    CREATE TABLE IF NOT EXISTS guides (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      draft_content TEXT,
      thumbnail TEXT,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      visibility TEXT NOT NULL DEFAULT 'public',
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides(slug);
    CREATE INDEX IF NOT EXISTS idx_guides_author_id ON guides(author_id);
    CREATE INDEX IF NOT EXISTS idx_guides_status ON guides(status);
    CREATE INDEX IF NOT EXISTS idx_guides_visibility ON guides(visibility);
    CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides(created_at);

    -- Contributors table
    CREATE TABLE IF NOT EXISTS guide_contributors (
      id TEXT PRIMARY KEY,
      guide_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT,
      contributed_at INTEGER NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_contributors_guide_id ON guide_contributors(guide_id);
    CREATE INDEX IF NOT EXISTS idx_contributors_user_id ON guide_contributors(user_id);

    -- Updates table
    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      discord_message_id TEXT NOT NULL UNIQUE,
      channel_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_username TEXT NOT NULL,
      author_avatar TEXT,
      author_id TEXT NOT NULL,
      message_url TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      attachments TEXT,
      embeds TEXT,
      reactions TEXT,
      grouped_message_ids TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_updates_timestamp ON updates(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_updates_channel_id ON updates(channel_id);
    CREATE INDEX IF NOT EXISTS idx_updates_discord_message_id ON updates(discord_message_id);

    -- Local images table
    CREATE TABLE IF NOT EXISTS local_images (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      hash TEXT NOT NULL UNIQUE,
      uploaded_by TEXT NOT NULL,
      uploaded_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_local_images_hash ON local_images(hash);
    CREATE INDEX IF NOT EXISTS idx_local_images_filename ON local_images(filename);

    -- News table
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      draft_content TEXT,
      cover_image TEXT,
      image_caption TEXT,
      category TEXT NOT NULL DEFAULT 'announcement',
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      visibility TEXT NOT NULL DEFAULT 'public',
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
    CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
    CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);

    -- Rate limiting table
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      timestamps TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- CSRF tokens table
    CREATE TABLE IF NOT EXISTS csrf_tokens (
      session_id TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
};

// Initialize schema on module load
initSchema();

// Helper function to prepare and bind statements (similar to D1 API)
export const query = {
  prepare: (sql) => {
    const stmt = db.prepare(sql);
    return {
      bind: (...params) => ({
        first: () => stmt.get(...params),
        all: () => ({ results: stmt.all(...params) }),
        run: () => stmt.run(...params),
      }),
      first: () => stmt.get(),
      all: () => ({ results: stmt.all() }),
      run: () => stmt.run(),
    };
  },
  exec: (sql) => db.exec(sql),
};

export default db;

