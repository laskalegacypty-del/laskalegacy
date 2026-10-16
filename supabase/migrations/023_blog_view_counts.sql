-- ============================================
-- Blog post view counts
-- Each time someone opens a post on the website (once per post per browser
-- tab session) the site calls increment_blog_view(). Admin > Blog shows the totals.
-- Only counts published posts, and only touches view_count (not updated_at).
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_blog_view(p_id UUID)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE blog_posts SET view_count = view_count + 1
  WHERE id = p_id AND published = true;
$$;

GRANT EXECUTE ON FUNCTION increment_blog_view(UUID) TO anon, authenticated;
