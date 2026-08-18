-- ============================================
-- WMG Quiz — lucky draw entries
-- Captured on the /quiz result screen once a round ends: name,
-- phone (WhatsApp-confirmed via a click-to-send wa.me link), the
-- level reached, and "chances" (level + 1) for a weighted draw —
-- reaching a higher level gives more tickets in the pool.
-- Public insert only (no public read) — same pattern as `messages`:
-- visitors submit their own entry, only Admin (client-side password
-- gate, same as the rest of this app) lists and draws from them.
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  level INT NOT NULL DEFAULT 0,
  chances INT NOT NULL DEFAULT 1,
  whatsapp_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_entries_created_idx ON quiz_entries(created_at DESC);

ALTER TABLE quiz_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert quiz entries" ON quiz_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access quiz entries" ON quiz_entries FOR ALL USING (true);
