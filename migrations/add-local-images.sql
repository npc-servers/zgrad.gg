-- Migration: Add local images table for development mode
-- This allows images to persist locally when R2 is not available

CREATE TABLE IF NOT EXISTS local_images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  data BLOB NOT NULL,
  size INTEGER NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  uploaded_by TEXT NOT NULL,
  uploaded_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_images_hash ON local_images(hash);
CREATE INDEX IF NOT EXISTS idx_local_images_filename ON local_images(filename);

