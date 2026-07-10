-- ============================================
-- Stall Price List (in-person catalog at markets/shows)
-- Separate from the online Shop — items and stock here
-- only apply to what's physically at the stall.
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS stall_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL DEFAULT 'R0',
  image TEXT DEFAULT '',
  stock INT NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stall_items_sort_idx ON stall_items(sort_order);

-- Storage bucket for stall item photos
INSERT INTO storage.buckets (id, name, public) VALUES ('stall', 'stall', true) ON CONFLICT (id) DO NOTHING;

-- Row level security
ALTER TABLE stall_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read stall items" ON stall_items FOR SELECT USING (true);
CREATE POLICY "Admin full access stall items" ON stall_items FOR ALL USING (true);

CREATE POLICY "Public read stall storage" ON storage.objects FOR SELECT USING (bucket_id = 'stall');
CREATE POLICY "Allow upload stall storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stall');
CREATE POLICY "Allow delete stall storage" ON storage.objects FOR DELETE USING (bucket_id = 'stall');

-- ==================
-- Seed: copy every product currently in the online Shop
-- into the stall price list, using its name, price, and
-- first photo. Stock defaults to 1 — update counts in the
-- admin Stall Price List page to match what's actually at
-- the stall. Safe to re-run: skips names already present.
-- ==================
INSERT INTO stall_items (name, price, image, stock, sort_order)
SELECT p.name, p.price, COALESCE(p.images[1], ''), 1, row_number() OVER (ORDER BY p.created_at)
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM stall_items s WHERE s.name = p.name);
