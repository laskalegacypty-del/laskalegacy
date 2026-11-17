-- ============================================
-- Birthday breakfast orders (/birthday)
-- One row per guest: name, ordered items (jsonb), optional notes.
-- Public can insert; read is open too so the host can open
-- /birthday?host to see the list and kitchen tally (no public
-- admin login exists in this app, same approach as other tables).
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS birthday_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS birthday_orders_created_idx ON birthday_orders(created_at);

ALTER TABLE birthday_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert birthday orders" ON birthday_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read birthday orders" ON birthday_orders FOR SELECT USING (true);
