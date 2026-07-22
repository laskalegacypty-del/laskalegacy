-- ============================================
-- Online Sale / Promotion
-- A site-wide % discount applied to a chosen set of
-- Stall Price List items, purchasable through the real
-- Order flow. Stock is always read live from stall_items
-- so "while stocks last" stays accurate everywhere.
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'ended'
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Only one active sale at a time (client also checks; this is the DB backstop)
CREATE UNIQUE INDEX IF NOT EXISTS sales_one_active_idx
  ON sales (status) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  stall_item_id UUID NOT NULL REFERENCES stall_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sale_id, stall_item_id)
);

CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON sale_items(sale_id);

-- Row level security — matches the existing wide-open pattern used
-- throughout this app (no real per-table auth, just a client-side
-- admin password gate).
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Admin full access sales" ON sales FOR ALL USING (true);
CREATE POLICY "Public can read sale_items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Admin full access sale_items" ON sale_items FOR ALL USING (true);

-- No new stock-adjustment functions needed — reuses the existing
-- decrement_stall_stock / increment_stall_stock RPCs from migration 011.
