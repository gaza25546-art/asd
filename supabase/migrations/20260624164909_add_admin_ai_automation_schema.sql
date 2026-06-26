/*
# DVSC Admin, AI, Automation & Community Extensions

1. Modified Tables
- `profiles` — add role, prediction_score, forum_reputation
- `news_articles` — add status, source_info, seo_title, meta_description, ai_generated, ai_summary
- `comments` — add parent_id, likes_count, is_reported, is_hidden
- `match_predictions` — add first_goalscorer, man_of_match
- `forum_topics` — add is_pinned, is_locked, is_hidden

2. New Tables
- `ai_drafts`, `automation_logs`, `notification_preferences`, `notifications`,
  `comment_likes`, `comment_reports`, `forum_reputation_log`, `achievement_badges`,
  `user_badges`, `media_library`, `audit_logs`, `automation_webhooks`, `newsletter_campaigns`

3. Security
- RLS on all new tables. Admin-only for admin tables. User-scoped for user data.
- Helper function role_check() created first.
*/

-- ============ HELPER FUNCTION (must exist before policies) ============
CREATE OR REPLACE FUNCTION role_check() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'moderator', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ MODIFY EXISTING TABLES ============

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prediction_score int NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS forum_reputation int NOT NULL DEFAULT 0;

ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_info jsonb;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS ai_summary text;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_reported boolean NOT NULL DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE match_predictions ADD COLUMN IF NOT EXISTS first_goalscorer text;
ALTER TABLE match_predictions ADD COLUMN IF NOT EXISTS man_of_match uuid;

ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;
ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Update news policy: only published visible to public, admins see all
DROP POLICY IF EXISTS "news_select_all" ON news_articles;
CREATE POLICY "news_select_all" ON news_articles FOR SELECT
  TO anon, authenticated USING (status = 'published' OR role_check());

-- Admin update/insert/delete for news
DROP POLICY IF EXISTS "news_admin_update" ON news_articles;
CREATE POLICY "news_admin_update" ON news_articles FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

DROP POLICY IF EXISTS "news_admin_insert" ON news_articles;
CREATE POLICY "news_admin_insert" ON news_articles FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "news_admin_delete" ON news_articles;
CREATE POLICY "news_admin_delete" ON news_articles FOR DELETE
  TO authenticated USING (role_check());

-- Admin update for fixtures
DROP POLICY IF EXISTS "fixtures_admin_update" ON fixtures;
CREATE POLICY "fixtures_admin_update" ON fixtures FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

DROP POLICY IF EXISTS "fixtures_admin_insert" ON fixtures;
CREATE POLICY "fixtures_admin_insert" ON fixtures FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "fixtures_admin_delete" ON fixtures;
CREATE POLICY "fixtures_admin_delete" ON fixtures FOR DELETE
  TO authenticated USING (role_check());

-- Admin update for squad
DROP POLICY IF EXISTS "squad_admin_update" ON squad_players;
CREATE POLICY "squad_admin_update" ON squad_players FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

DROP POLICY IF EXISTS "squad_admin_insert" ON squad_players;
CREATE POLICY "squad_admin_insert" ON squad_players FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "squad_admin_delete" ON squad_players;
CREATE POLICY "squad_admin_delete" ON squad_players FOR DELETE
  TO authenticated USING (role_check());

-- Admin update for polls
DROP POLICY IF EXISTS "polls_admin_insert" ON polls;
CREATE POLICY "polls_admin_insert" ON polls FOR INSERT
  TO authenticated WITH CHECK (role_check());

DROP POLICY IF EXISTS "polls_admin_delete" ON polls;
CREATE POLICY "polls_admin_delete" ON polls FOR DELETE
  TO authenticated USING (role_check());

-- Admin update for forum topics (moderation)
DROP POLICY IF EXISTS "forum_topics_admin_update" ON forum_topics;
CREATE POLICY "forum_topics_admin_update" ON forum_topics FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

-- Admin update/delete for comments (moderation)
DROP POLICY IF EXISTS "comments_admin_update" ON comments;
CREATE POLICY "comments_admin_update" ON comments FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

-- Admin update for profiles (role management)
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

-- ============ NEW TABLES ============

-- AI Drafts
CREATE TABLE IF NOT EXISTS ai_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_type text NOT NULL DEFAULT 'article',
  source_info jsonb,
  generated_content text NOT NULL,
  suggested_headline text,
  seo_title text,
  meta_description text,
  image_suggestion text,
  ai_summary text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_drafts_admin_select" ON ai_drafts;
CREATE POLICY "ai_drafts_admin_select" ON ai_drafts FOR SELECT
  TO authenticated USING (role_check());
DROP POLICY IF EXISTS "ai_drafts_admin_update" ON ai_drafts;
CREATE POLICY "ai_drafts_admin_update" ON ai_drafts FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());
DROP POLICY IF EXISTS "ai_drafts_admin_insert" ON ai_drafts;
CREATE POLICY "ai_drafts_admin_insert" ON ai_drafts FOR INSERT
  TO authenticated WITH CHECK (role_check());
DROP POLICY IF EXISTS "ai_drafts_admin_delete" ON ai_drafts;
CREATE POLICY "ai_drafts_admin_delete" ON ai_drafts FOR DELETE
  TO authenticated USING (role_check());

-- Automation Logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  source text NOT NULL DEFAULT 'make.com',
  payload jsonb,
  status text NOT NULL DEFAULT 'success',
  message text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_logs_admin_select" ON automation_logs;
CREATE POLICY "automation_logs_admin_select" ON automation_logs FOR SELECT
  TO authenticated USING (role_check());
DROP POLICY IF EXISTS "automation_logs_service_insert" ON automation_logs;
CREATE POLICY "automation_logs_service_insert" ON automation_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  breaking_news boolean DEFAULT true,
  match_start boolean DEFAULT true,
  goal_alerts boolean DEFAULT true,
  final_score boolean DEFAULT true,
  transfer_news boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_select_own" ON notification_preferences;
CREATE POLICY "notif_prefs_select_own" ON notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_prefs_insert_own" ON notification_preferences;
CREATE POLICY "notif_prefs_insert_own" ON notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_prefs_update_own" ON notification_preferences;
CREATE POLICY "notif_prefs_update_own" ON notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_service_insert" ON notifications;
CREATE POLICY "notifications_service_insert" ON notifications FOR INSERT
  TO anon WITH CHECK (true);

-- Comment Likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_likes_select_all" ON comment_likes;
CREATE POLICY "comment_likes_select_all" ON comment_likes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "comment_likes_insert_own" ON comment_likes;
CREATE POLICY "comment_likes_insert_own" ON comment_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comment_likes_delete_own" ON comment_likes;
CREATE POLICY "comment_likes_delete_own" ON comment_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Comment Reports
CREATE TABLE IF NOT EXISTS comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_reports_select" ON comment_reports;
CREATE POLICY "comment_reports_select" ON comment_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR role_check());
DROP POLICY IF EXISTS "comment_reports_insert_own" ON comment_reports;
CREATE POLICY "comment_reports_insert_own" ON comment_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comment_reports_update_admin" ON comment_reports;
CREATE POLICY "comment_reports_update_admin" ON comment_reports FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

-- Forum Reputation Log
CREATE TABLE IF NOT EXISTS forum_reputation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE forum_reputation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rep_log_select_all" ON forum_reputation_log;
CREATE POLICY "rep_log_select_all" ON forum_reputation_log FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "rep_log_insert_admin" ON forum_reputation_log;
CREATE POLICY "rep_log_insert_admin" ON forum_reputation_log FOR INSERT
  TO authenticated WITH CHECK (role_check());

-- Achievement Badges
CREATE TABLE IF NOT EXISTS achievement_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_select_all" ON achievement_badges;
CREATE POLICY "badges_select_all" ON achievement_badges FOR SELECT
  TO anon, authenticated USING (true);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_badges_select_all" ON user_badges;
CREATE POLICY "user_badges_select_all" ON user_badges FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "user_badges_insert_admin" ON user_badges;
CREATE POLICY "user_badges_insert_admin" ON user_badges FOR INSERT
  TO authenticated WITH CHECK (role_check());

-- Media Library
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  category text DEFAULT 'General',
  uploaded_by uuid REFERENCES auth.users(id),
  ai_generated boolean DEFAULT false,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select_all" ON media_library;
CREATE POLICY "media_select_all" ON media_library FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "media_insert_admin" ON media_library;
CREATE POLICY "media_insert_admin" ON media_library FOR INSERT
  TO authenticated WITH CHECK (role_check());
DROP POLICY IF EXISTS "media_update_admin" ON media_library;
CREATE POLICY "media_update_admin" ON media_library FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());
DROP POLICY IF EXISTS "media_delete_admin" ON media_library;
CREATE POLICY "media_delete_admin" ON media_library FOR DELETE
  TO authenticated USING (role_check());

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
CREATE POLICY "audit_logs_admin_select" ON audit_logs FOR SELECT
  TO authenticated USING (role_check());
DROP POLICY IF EXISTS "audit_logs_admin_insert" ON audit_logs;
CREATE POLICY "audit_logs_admin_insert" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (role_check());

-- Automation Webhooks
CREATE TABLE IF NOT EXISTS automation_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  action_type text NOT NULL,
  webhook_url text,
  secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhooks_admin_select" ON automation_webhooks;
CREATE POLICY "webhooks_admin_select" ON automation_webhooks FOR SELECT
  TO authenticated USING (role_check());
DROP POLICY IF EXISTS "webhooks_admin_insert" ON automation_webhooks;
CREATE POLICY "webhooks_admin_insert" ON automation_webhooks FOR INSERT
  TO authenticated WITH CHECK (role_check());
DROP POLICY IF EXISTS "webhooks_admin_update" ON automation_webhooks;
CREATE POLICY "webhooks_admin_update" ON automation_webhooks FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());
DROP POLICY IF EXISTS "webhooks_admin_delete" ON automation_webhooks;
CREATE POLICY "webhooks_admin_delete" ON automation_webhooks FOR DELETE
  TO authenticated USING (role_check());

-- Newsletter Campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  sent_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_admin_select" ON newsletter_campaigns;
CREATE POLICY "campaigns_admin_select" ON newsletter_campaigns FOR SELECT
  TO authenticated USING (role_check());
DROP POLICY IF EXISTS "campaigns_admin_insert" ON newsletter_campaigns;
CREATE POLICY "campaigns_admin_insert" ON newsletter_campaigns FOR INSERT
  TO authenticated WITH CHECK (role_check());
DROP POLICY IF EXISTS "campaigns_admin_update" ON newsletter_campaigns;
CREATE POLICY "campaigns_admin_update" ON newsletter_campaigns FOR UPDATE
  TO authenticated USING (role_check()) WITH CHECK (role_check());

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_ai_drafts_status ON ai_drafts(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- ============ SEED DATA ============
INSERT INTO achievement_badges (name, description, icon, requirement) VALUES
('First Prediction', 'Made your first match prediction', 'Target', 'Make 1 prediction'),
('Perfect Score', 'Predicted an exact match score', 'Trophy', 'Get 1 exact score prediction'),
('Top Predictor', 'Reached top 10 on the leaderboard', 'Crown', 'Reach top 10 leaderboard'),
('Forum Regular', 'Created 10 forum topics', 'MessageSquare', 'Create 10 forum topics'),
('Commentator', 'Posted 50 comments', 'MessageCircle', 'Post 50 comments'),
('Loki Legend', 'Earned 1000 reputation points', 'Star', 'Reach 1000 forum reputation'),
('Match Day Hero', 'Voted for Player of the Match 10 times', 'Award', 'Vote 10 times for POTM')
ON CONFLICT DO NOTHING;
