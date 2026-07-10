-- ============================================
-- Stall Event Stock Reconciliation
-- Tracks per-show opening stock counts, live sales
-- logged via QR scan, and end-of-show reconciliation.
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS stall_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'closed'
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Only one active event at a time (client also checks; this is the DB backstop)
CREATE UNIQUE INDEX IF NOT EXISTS stall_events_one_active_idx
  ON stall_events (status) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS stall_event_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES stall_events(id) ON DELETE CASCADE,
  stall_item_id UUID NOT NULL REFERENCES stall_items(id) ON DELETE CASCADE,
  opening_stock INT NOT NULL DEFAULT 0,
  actual_count INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, stall_item_id)
);

CREATE INDEX IF NOT EXISTS stall_event_items_event_idx ON stall_event_items(event_id);

CREATE TABLE IF NOT EXISTS stall_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES stall_events(id) ON DELETE CASCADE,
  stall_item_id UUID NOT NULL REFERENCES stall_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  sold_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stall_sales_event_idx ON stall_sales(event_id);
CREATE INDEX IF NOT EXISTS stall_sales_item_idx ON stall_sales(stall_item_id);

-- Row level security — matches the existing wide-open pattern used
-- throughout this app (there's no real per-table auth, just a client-side
-- admin password gate).
ALTER TABLE stall_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stall_event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stall_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read stall_events" ON stall_events FOR SELECT USING (true);
CREATE POLICY "Admin full access stall_events" ON stall_events FOR ALL USING (true);
CREATE POLICY "Public can read stall_event_items" ON stall_event_items FOR SELECT USING (true);
CREATE POLICY "Admin full access stall_event_items" ON stall_event_items FOR ALL USING (true);
CREATE POLICY "Public can read stall_sales" ON stall_sales FOR SELECT USING (true);
CREATE POLICY "Admin full access stall_sales" ON stall_sales FOR ALL USING (true);

-- Atomic stock adjustments so rapid-fire scans at a live event can't race
-- a naive read-modify-write from the browser. Mirrors the existing
-- get_next_invoice_number() RPC pattern already used by createOrder().
CREATE OR REPLACE FUNCTION decrement_stall_stock(p_item_id UUID)
RETURNS stall_items AS $$
  UPDATE stall_items SET stock = GREATEST(stock - 1, 0), updated_at = now()
  WHERE id = p_item_id RETURNING *;
$$ LANGUAGE sql VOLATILE;

CREATE OR REPLACE FUNCTION increment_stall_stock(p_item_id UUID, p_qty INT DEFAULT 1)
RETURNS stall_items AS $$
  UPDATE stall_items SET stock = stock + p_qty, updated_at = now()
  WHERE id = p_item_id RETURNING *;
$$ LANGUAGE sql VOLATILE;
