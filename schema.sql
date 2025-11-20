-- Cloudflare D1 Database Schema for CMS

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
  draft_content TEXT, -- Stores draft changes for published guides
  thumbnail TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published
  visibility TEXT NOT NULL DEFAULT 'public', -- public, unlisted
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_author_id ON guides(author_id);
CREATE INDEX IF NOT EXISTS idx_guides_status ON guides(status);
CREATE INDEX IF NOT EXISTS idx_guides_visibility ON guides(visibility);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides(created_at);

-- Contributors table to track who edited each guide
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
CREATE INDEX IF NOT EXISTS idx_contributors_contributed_at ON guide_contributors(contributed_at);

-- Migration: Add last_edited_by fields to guides table
-- ALTER TABLE guides ADD COLUMN last_edited_by_id TEXT;
-- ALTER TABLE guides ADD COLUMN last_edited_by_name TEXT;

-- Migration: Add view_count field to guides table
-- ALTER TABLE guides ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Updates table (caching Discord messages for performance)
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
  attachments TEXT, -- JSON array of attachment URLs
  embeds TEXT, -- JSON array of embeds
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_updates_timestamp ON updates(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_updates_channel_id ON updates(channel_id);
CREATE INDEX IF NOT EXISTS idx_updates_discord_message_id ON updates(discord_message_id);

-- Local development images table (for when R2 is not available)
CREATE TABLE IF NOT EXISTS local_images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  data TEXT NOT NULL, -- Base64 encoded image data
  size INTEGER NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  uploaded_by TEXT NOT NULL,
  uploaded_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_images_hash ON local_images(hash);
CREATE INDEX IF NOT EXISTS idx_local_images_filename ON local_images(filename);


