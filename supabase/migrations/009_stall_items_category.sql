-- ============================================
-- Add category to the Stall Price List so items
-- can be grouped/filtered on the /catalog page.
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE stall_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

-- Backfill: for items seeded from the online Shop, copy their existing
-- category across (matched by name) so nothing lands in "Other" by default.
UPDATE stall_items s
SET category = p.category
FROM products p
WHERE s.name = p.name AND (s.category IS NULL OR s.category = '' OR s.category = 'other');
