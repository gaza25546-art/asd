/*
# Make forum user_id nullable for seeding

1. Modified Tables
- `forum_topics` — user_id now nullable (allows seeded sample topics without a real auth user)
- `forum_replies` — user_id now nullable (same reason)

2. Notes
- Real user-created topics/replies will still have user_id populated via DEFAULT auth.uid().
- Seeded sample content can use NULL user_id and display as "DVSC Community" in the UI.
*/

ALTER TABLE forum_topics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE forum_replies ALTER COLUMN user_id DROP NOT NULL;
