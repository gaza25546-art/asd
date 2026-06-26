/*
# Add Deduplication Fields to News Automation System

1. New Columns on `scraped_articles`
- `content_hash` text — SHA256 hash of normalized content for fast duplicate detection
- `keyword_signature` text — Extracted keywords from title/content for fuzzy matching
- `dedup_group_id` uuid — Groups articles about the same topic from different sources
- `is_duplicate` boolean — Flag for duplicate articles

2. New Columns on `ai_drafts`
- `related_sources` jsonb — Array of related source URLs/titles that were merged
- `dedup_group_id` uuid — Links to the deduplication group

3. New Table
- `article_dedup_groups` — Stores deduplication groups
  - `id` uuid PRIMARY KEY
  - `canonical_title` text — The best title from the group
  - `canonical_url` text — The best URL from the group
  - `sources_count` int — How many sources reported this
  - `created_at` timestamptz
  - `updated_at` timestamptz

4. Security
- RLS enabled on new table
- Admin-only access
*/

-- Add deduplication columns to scraped_articles
ALTER TABLE scraped_articles ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE scraped_articles ADD COLUMN IF NOT EXISTS keyword_signature text;
ALTER TABLE scraped_articles ADD COLUMN IF NOT EXISTS dedup_group_id uuid;
ALTER TABLE scraped_articles ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;

-- Add deduplication columns to ai_drafts
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS related_sources jsonb DEFAULT '[]';
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS dedup_group_id uuid;

-- Create dedup groups table
CREATE TABLE IF NOT EXISTS article_dedup_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title text,
  canonical_url text,
  sources_count int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE article_dedup_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dedup_select_admin" ON article_dedup_groups;
CREATE POLICY "dedup_select_admin" ON article_dedup_groups FOR SELECT
  TO authenticated USING (role_check());

DROP POLICY IF EXISTS "dedup_admin_insert" ON article_dedup_groups;
CREATE POLICY "dedup_admin_insert" ON article_dedup_groups FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "dedup_admin_update" ON article_dedup_groups;
CREATE POLICY "dedup_admin_update" ON article_dedup_groups FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

-- Add indexes for deduplication queries
CREATE INDEX IF NOT EXISTS idx_scraped_hash ON scraped_articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_scraped_dedup_group ON scraped_articles(dedup_group_id);
CREATE INDEX IF NOT EXISTS idx_scraped_created_at ON scraped_articles(created_at);
CREATE INDEX IF NOT EXISTS idx_drafts_dedup_group ON ai_drafts(dedup_group_id);
