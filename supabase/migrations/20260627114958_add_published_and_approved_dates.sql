/*
# Add Published and Approved Date Fields

1. Modified Tables
- `scraped_articles`
  - `published_at` timestamptz — The original publication date from the source (sent by Make.com)
  - `cover_image_url` text — Extracted cover image from the scraped article

- `news_articles`
  - `approved_at` timestamptz — When the admin approved the article
  - `approved_by` uuid — Which admin approved it

- `ai_drafts`
  - `published_at` timestamptz — Original publication date passed through from scraped_articles
  - `cover_image_url` text — Cover image URL

2. Security
- No new RLS needed, existing policies cover these columns
*/

ALTER TABLE scraped_articles ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE scraped_articles ADD COLUMN IF NOT EXISTS cover_image_url text;

ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE ai_drafts ADD COLUMN IF NOT EXISTS cover_image_url text;
