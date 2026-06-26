/*
# DVSC Fan Website - Core Schema

1. New Tables
- `profiles` — user profile data linked to auth.users
- `news_articles` — club news articles
- `fixtures` — match fixtures and results
- `squad_players` — current squad
- `legendary_players` — club legends
- `trophies` — trophy cabinet
- `history_timeline` — club history milestones
- `gallery_photos` — fan gallery photos
- `videos` — video gallery
- `comments` — comments on articles
- `forum_topics` — forum discussion topics
- `forum_replies` — replies to forum topics
- `polls` — match-day polls
- `player_of_match_votes` — player of the match voting
- `match_predictions` — match prediction game
- `newsletter_subscribers` — newsletter email list

2. Security
- Enable RLS on all tables.
- Public read on content tables via anon+authenticated.
- Authenticated-only writes for user-generated content.
- Newsletter subscription is anon-insertable.
- Polls and player-of-match votes are anon-insertable/updatable for public voting.
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'DVSC Fan',
  avatar_url text,
  favorite_player text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- News articles
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  author text NOT NULL DEFAULT 'DVSC Media',
  published_at timestamptz DEFAULT now(),
  featured boolean DEFAULT false
);
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_select_all" ON news_articles;
CREATE POLICY "news_select_all" ON news_articles FOR SELECT
  TO anon, authenticated USING (true);

-- Fixtures
CREATE TABLE IF NOT EXISTS fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition text NOT NULL,
  opponent text NOT NULL,
  home_away text NOT NULL DEFAULT 'home',
  match_date timestamptz NOT NULL,
  venue text,
  status text NOT NULL DEFAULT 'scheduled',
  dvsc_score int,
  opponent_score int,
  match_report text
);
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fixtures_select_all" ON fixtures;
CREATE POLICY "fixtures_select_all" ON fixtures FOR SELECT
  TO anon, authenticated USING (true);

-- Squad players
CREATE TABLE IF NOT EXISTS squad_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  number int,
  nationality text,
  image_url text,
  bio text,
  appearances int DEFAULT 0,
  goals int DEFAULT 0,
  assists int DEFAULT 0
);
ALTER TABLE squad_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "squad_select_all" ON squad_players;
CREATE POLICY "squad_select_all" ON squad_players FOR SELECT
  TO anon, authenticated USING (true);

-- Legendary players
CREATE TABLE IF NOT EXISTS legendary_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  years text NOT NULL,
  image_url text,
  bio text NOT NULL,
  achievements text
);
ALTER TABLE legendary_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legends_select_all" ON legendary_players;
CREATE POLICY "legends_select_all" ON legendary_players FOR SELECT
  TO anon, authenticated USING (true);

-- Trophies
CREATE TABLE IF NOT EXISTS trophies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  competition text NOT NULL,
  season text NOT NULL,
  image_url text,
  description text
);
ALTER TABLE trophies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trophies_select_all" ON trophies;
CREATE POLICY "trophies_select_all" ON trophies FOR SELECT
  TO anon, authenticated USING (true);

-- History timeline
CREATE TABLE IF NOT EXISTS history_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text
);
ALTER TABLE history_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_select_all" ON history_timeline;
CREATE POLICY "history_select_all" ON history_timeline FOR SELECT
  TO anon, authenticated USING (true);

-- Gallery photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  author text DEFAULT 'DVSC Fan',
  category text DEFAULT 'Match Day'
);
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery_select_all" ON gallery_photos;
CREATE POLICY "gallery_select_all" ON gallery_photos FOR SELECT
  TO anon, authenticated USING (true);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  embed_url text NOT NULL,
  thumbnail text NOT NULL,
  description text,
  category text DEFAULT 'Highlights',
  duration text,
  published_at timestamptz DEFAULT now()
);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "videos_select_all" ON videos;
CREATE POLICY "videos_select_all" ON videos FOR SELECT
  TO anon, authenticated USING (true);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Forum topics
CREATE TABLE IF NOT EXISTS forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'General',
  views int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_topics_select_all" ON forum_topics;
CREATE POLICY "forum_topics_select_all" ON forum_topics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "forum_topics_insert_own" ON forum_topics;
CREATE POLICY "forum_topics_insert_own" ON forum_topics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_topics_update_own" ON forum_topics;
CREATE POLICY "forum_topics_update_own" ON forum_topics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_topics_delete_own" ON forum_topics;
CREATE POLICY "forum_topics_delete_own" ON forum_topics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Forum replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_replies_select_all" ON forum_replies;
CREATE POLICY "forum_replies_select_all" ON forum_replies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "forum_replies_insert_own" ON forum_replies;
CREATE POLICY "forum_replies_insert_own" ON forum_replies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_replies_delete_own" ON forum_replies;
CREATE POLICY "forum_replies_delete_own" ON forum_replies FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Polls
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  fixture_id uuid REFERENCES fixtures(id) ON DELETE CASCADE,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  votes_a int DEFAULT 0,
  votes_b int DEFAULT 0,
  votes_c int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "polls_select_all" ON polls;
CREATE POLICY "polls_select_all" ON polls FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "polls_update_all" ON polls;
CREATE POLICY "polls_update_all" ON polls FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Player of match votes
CREATE TABLE IF NOT EXISTS player_of_match_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id uuid REFERENCES squad_players(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE player_of_match_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pom_votes_select_all" ON player_of_match_votes;
CREATE POLICY "pom_votes_select_all" ON player_of_match_votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "pom_votes_insert_all" ON player_of_match_votes;
CREATE POLICY "pom_votes_insert_all" ON player_of_match_votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Match predictions
CREATE TABLE IF NOT EXISTS match_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid REFERENCES fixtures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_dvsc_score int NOT NULL,
  predicted_opponent_score int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (fixture_id, user_id)
);
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictions_select_all" ON match_predictions;
CREATE POLICY "predictions_select_all" ON match_predictions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "predictions_insert_own" ON match_predictions;
CREATE POLICY "predictions_insert_own" ON match_predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictions_update_own" ON match_predictions;
CREATE POLICY "predictions_update_own" ON match_predictions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_select_all" ON newsletter_subscribers;
CREATE POLICY "newsletter_select_all" ON newsletter_subscribers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "newsletter_insert_all" ON newsletter_subscribers;
CREATE POLICY "newsletter_insert_all" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fixtures_date ON fixtures(match_date);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic ON forum_replies(topic_id);
