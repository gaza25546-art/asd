/*
# AI News Automation System

1. New Tables
- `news_sources` — Configured RSS/API news sources (NSO, DVSC, NB1, CsakFoci, etc.)
  - `id` uuid PRIMARY KEY
  - `name` text — display name (e.g. "NSO")
  - `url` text — RSS feed or API endpoint URL
  - `source_type` text — 'rss', 'api', 'html_scrape'
  - `category_mapping` jsonb — mapping of source categories to our categories
  - `is_active` boolean — whether this source is enabled
  - `last_scraped_at` timestamptz
  - `created_at` timestamptz

- `scraped_articles` — Raw articles fetched from sources before AI processing
  - `id` uuid PRIMARY KEY
  - `source_id` uuid → news_sources
  - `original_url` text UNIQUE — original article URL (prevents duplicates)
  - `original_title` text
  - `original_content` text
  - `original_excerpt` text
  - `scraped_at` timestamptz
  - `status` text — 'pending_ai', 'ai_processing', 'pending_review', 'approved', 'rejected'
  - `ai_draft_id` uuid → ai_drafts (links to generated content)

- `ai_drafts` — AI-generated article drafts (extends existing table)
  - Added columns: `scraped_article_id`, `review_status`, `reviewed_by`, `reviewed_at`, `rejection_reason`

2. Modified Tables
- `news_articles` — no changes needed, AI drafts publish into this table

3. Security
- RLS on all new tables
- Admin-only write for news_sources, scraped_articles
- Admin-only for review workflow
*/

-- News Sources
CREATE TABLE IF NOT EXISTS news_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  source_type text NOT NULL DEFAULT 'rss',
  category_mapping jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  last_scraped_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_sources_select_all" ON news_sources;
CREATE POLICY "news_sources_select_all" ON news_sources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "news_sources_admin_insert" ON news_sources;
CREATE POLICY "news_sources_admin_insert" ON news_sources FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "news_sources_admin_update" ON news_sources;
CREATE POLICY "news_sources_admin_update" ON news_sources FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

DROP POLICY IF EXISTS "news_sources_admin_delete" ON news_sources;
CREATE POLICY "news_sources_admin_delete" ON news_sources FOR DELETE
  TO authenticated USING (role_check());

-- Scraped Articles
CREATE TABLE IF NOT EXISTS scraped_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES news_sources(id) ON DELETE CASCADE,
  original_url text UNIQUE NOT NULL,
  original_title text NOT NULL,
  original_content text,
  original_excerpt text,
  scraped_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending_ai',
  ai_draft_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scraped_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scraped_select_admin" ON scraped_articles;
CREATE POLICY "scraped_select_admin" ON scraped_articles FOR SELECT
  TO authenticated USING (role_check());

DROP POLICY IF EXISTS "scraped_admin_insert" ON scraped_articles;
CREATE POLICY "scraped_admin_insert" ON scraped_articles FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "scraped_admin_update" ON scraped_articles;
CREATE POLICY "scraped_admin_update" ON scraped_articles FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

-- Add columns to ai_drafts for review workflow
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS scraped_article_id uuid REFERENCES scraped_articles(id);
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending';
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add index for review status
CREATE INDEX IF NOT EXISTS idx_ai_drafts_review_status ON ai_drafts(review_status);
CREATE INDEX IF NOT EXISTS idx_scraped_status ON scraped_articles(status);
CREATE INDEX IF NOT EXISTS idx_scraped_source ON scraped_articles(source_id);

-- Seed default news sources
INSERT INTO news_sources (name, url, source_type, category_mapping, is_active) VALUES
('Nemzeti Sport Online (NSO)', 'https://www.nemzetisport.hu/rss/', 'rss', '{"football":"Match Report","transfer":"Transfer"}', true),
('DVSC Official', 'https://dvsc.hu/hirek/', 'html_scrape', '{"club":"Club News"}', true),
('NB1.hu', 'https://nb1.hu/rss/', 'rss', '{"match":"Match Report","news":"General"}', true),
('CsakFoci', 'https://www.csakfoci.hu/rss/', 'rss', '{"transfer":"Transfer","match":"Match Report"}', true),
('Transfermarkt Hungary', 'https://www.transfermarkt.hu/rss/', 'rss', '{"transfer":"Transfer"}', true)
ON CONFLICT DO NOTHING;
