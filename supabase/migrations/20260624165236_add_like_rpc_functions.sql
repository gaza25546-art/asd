/*
# Add like increment/decrement RPC functions

1. New Functions
- `increment_like(comment_id uuid)` — increments likes_count on a comment
- `decrement_like(comment_id uuid)` — decrements likes_count on a comment

2. Notes
- Used by the comment like/unlike system to atomically update the count.
*/

CREATE OR REPLACE FUNCTION increment_like(comment_id uuid) RETURNS void AS $$
BEGIN
  UPDATE comments SET likes_count = likes_count + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like(comment_id uuid) RETURNS void AS $$
BEGIN
  UPDATE comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
