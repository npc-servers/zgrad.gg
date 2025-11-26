-- Drop news table if it exists (development only)
DROP TABLE IF EXISTS news;

-- Create news table with all fields
CREATE TABLE news (
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

-- Create indexes
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_news_author_id ON news(author_id);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_visibility ON news(visibility);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_created_at ON news(created_at);

