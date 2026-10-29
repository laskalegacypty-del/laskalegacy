-- ============================================
-- Customer reviews
-- Submitted from the shareable /review page. New reviews start as 'pending'
-- and only appear on the home page and the Websites page once approved in
-- Admin > Reviews. There are NO public policies: every read and write goes
-- through /api/websites/reviews* (service role), which does the validation,
-- rate limiting and only ever returns approved reviews to the public.
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_status_created_idx ON reviews (status, created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
