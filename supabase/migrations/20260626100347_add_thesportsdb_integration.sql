/*
# TheSportsDB API Integration

1. New Columns on Existing Tables
- `fixtures` — add `api_event_id` (text) to link to TheSportsDB events, `api_synced_at` (timestamptz)
- `squad_players` — add `api_player_id` (text) to link to TheSportsDB players, `api_synced_at` (timestamptz)
- `fixtures` — add `opponent_badge_url` (text) for opponent team badge images

2. New Table
- `league_standings` — stores live league table data from TheSportsDB
  - `id` uuid PRIMARY KEY
  - `api_standing_id` text UNIQUE (TheSportsDB standing ID)
  - `team_id` text (TheSportsDB team ID)
  - `team_name` text
  - `team_badge_url` text
  - `position` int
  - `played` int
  - `won` int
  - `drawn` int
  - `lost` int
  - `goals_for` int
  - `goals_against` int
  - `goal_difference` int
  - `points` int
  - `form` text
  - `description` text
  - `season` text
  - `synced_at` timestamptz

3. Security
- RLS enabled on new table
- Public read for standings (anon+authenticated)
- Admin-only write (via role_check())
*/

-- Add columns to fixtures
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS api_event_id text;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS api_synced_at timestamptz;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS opponent_badge_url text;

-- Add columns to squad_players
ALTER TABLE squad_players ADD COLUMN IF NOT EXISTS api_player_id text;
ALTER TABLE squad_players ADD COLUMN IF NOT EXISTS api_synced_at timestamptz;
ALTER TABLE squad_players ADD COLUMN IF NOT EXISTS birth_date text;
ALTER TABLE squad_players ADD COLUMN IF NOT EXISTS height text;
ALTER TABLE squad_players ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE squad_players ADD COLUMN IF NOT EXISTS player_image_url text;

-- Create league standings table
CREATE TABLE IF NOT EXISTS league_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_standing_id text UNIQUE,
  team_id text,
  team_name text NOT NULL,
  team_badge_url text,
  position int NOT NULL,
  played int NOT NULL DEFAULT 0,
  won int NOT NULL DEFAULT 0,
  drawn int NOT NULL DEFAULT 0,
  lost int NOT NULL DEFAULT 0,
  goals_for int NOT NULL DEFAULT 0,
  goals_against int NOT NULL DEFAULT 0,
  goal_difference int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  form text,
  description text,
  season text,
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "standings_select_all" ON league_standings;
CREATE POLICY "standings_select_all" ON league_standings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "standings_admin_insert" ON league_standings;
CREATE POLICY "standings_admin_insert" ON league_standings FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "standings_admin_update" ON league_standings;
CREATE POLICY "standings_admin_update" ON league_standings FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

DROP POLICY IF EXISTS "standings_admin_delete" ON league_standings;
CREATE POLICY "standings_admin_delete" ON league_standings FOR DELETE
  TO authenticated USING (role_check());

-- Index for standings
CREATE INDEX IF NOT EXISTS idx_standings_position ON league_standings(position);
CREATE INDEX IF NOT EXISTS idx_standings_season ON league_standings(season);

-- Add sync metadata table for tracking last sync times
CREATE TABLE IF NOT EXISTS api_sync_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL UNIQUE,
  entity_type text NOT NULL,
  last_synced_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'idle',
  error_message text,
  records_synced int DEFAULT 0
);

ALTER TABLE api_sync_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_meta_select_all" ON api_sync_metadata;
CREATE POLICY "sync_meta_select_all" ON api_sync_metadata FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sync_meta_admin_insert" ON api_sync_metadata;
CREATE POLICY "sync_meta_admin_insert" ON api_sync_metadata FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "sync_meta_admin_update" ON api_sync_metadata;
CREATE POLICY "sync_meta_admin_update" ON api_sync_metadata FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());
