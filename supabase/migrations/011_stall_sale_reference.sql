-- ============================================
-- Stall Sale Reference Codes
-- Gives every scanned sale a short, unique, human-typeable
-- code to enter into the card machine so recon is easy —
-- and lets a sale's quantity be adjusted before it's logged.
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE stall_sales ADD COLUMN IF NOT EXISTS reference_code TEXT;

-- Simple ever-incrementing counter, same pattern as the existing
-- invoice_counter / get_next_invoice_number().
CREATE TABLE IF NOT EXISTS sale_reference_counter (
  id INT PRIMARY KEY DEFAULT 1,
  next_number INT DEFAULT 1
);
INSERT INTO sale_reference_counter (id, next_number) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION get_next_sale_reference()
RETURNS TEXT AS $$
DECLARE
  num INT;
BEGIN
  UPDATE sale_reference_counter SET next_number = next_number + 1 WHERE id = 1 RETURNING next_number - 1 INTO num;
  RETURN LPAD(num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE sale_reference_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read sale_reference_counter" ON sale_reference_counter FOR SELECT USING (true);
CREATE POLICY "Admin full access sale_reference_counter" ON sale_reference_counter FOR ALL USING (true);

-- Support selling more than one of an item per scan.
-- Does NOT floor at 0 — stock can dip negative when overselling so that an
-- "Undo" always exactly reverses the sale (see increment_stall_stock).
-- Display code clamps negative stock to 0 wherever it's shown to a human.
DROP FUNCTION IF EXISTS decrement_stall_stock(UUID);
CREATE OR REPLACE FUNCTION decrement_stall_stock(p_item_id UUID, p_qty INT DEFAULT 1)
RETURNS stall_items AS $$
  UPDATE stall_items SET stock = stock - p_qty, updated_at = now()
  WHERE id = p_item_id RETURNING *;
$$ LANGUAGE sql VOLATILE;
