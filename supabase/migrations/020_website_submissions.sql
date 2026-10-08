-- ============================================
-- Website Intake — R500 one-page website service
-- Clients fill in the /websites wizard; the server route
-- (service role) stores the answers, a ready-to-paste Claude Code
-- prompt, and a settings.json for the future design studio.
--
-- RLS is ON with NO public policies: the browser can neither read
-- nor write these tables directly. All access goes through the
-- Next.js API routes (service role key, server-side only).
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS website_submissions (
  id UUID PRIMARY KEY, -- generated client-side so uploads can use it as a folder name
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'awaiting_approval', 'live')),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid')),
  paid_at TIMESTAMPTZ,
  payfast_payment_id TEXT,
  answers JSONB NOT NULL,
  generated_prompt TEXT NOT NULL,
  settings_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS website_submissions_created_idx
  ON website_submissions (created_at DESC);

ALTER TABLE website_submissions ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only the service role (API routes) can touch this table.

-- Simple DB-backed rate limiting (serverless functions have no shared memory)
CREATE TABLE IF NOT EXISTS website_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'submit' | 'upload'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_rate_limits_lookup_idx
  ON website_rate_limits (ip_hash, kind, created_at DESC);

ALTER TABLE website_rate_limits ENABLE ROW LEVEL SECURITY;

-- Storage bucket for client logos and images.
-- Public-read so the generated prompt's image URLs work for Claude Code and the built site.
-- Folder names are random UUIDs and there is no list policy, so files cannot be enumerated.
-- Uploads happen only through /api/websites/upload (service role), which checks type and size.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-assets', 'website-assets', true, 5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
