-- Add draft_content and visibility columns to guides table
-- This allows guides to have separate draft and published content
-- and allows delisting guides without deleting them

-- Add draft_content column (stores content saved as draft)
ALTER TABLE guides ADD COLUMN draft_content TEXT;

-- Add visibility column (public/unlisted - separate from draft/published status)
ALTER TABLE guides ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';

-- Add index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_guides_visibility ON guides(visibility);

-- Notes:
-- draft_content: When a user saves as draft on a published guide, content goes here
-- When null, there are no pending draft changes
-- When publishing, draft_content is merged into content and set back to null
--
-- visibility: Controls whether guide appears in listings/search
-- 'public' - visible to everyone (default)
-- 'unlisted' - not in listings but accessible via direct URL
-- This is separate from status (draft/published)
