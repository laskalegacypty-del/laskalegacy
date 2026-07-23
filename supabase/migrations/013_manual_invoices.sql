-- ============================================
-- Manual Invoicing System
-- Powers the private /invoice page — builds an
-- invoice from Shop products, Stall Price List items,
-- or custom one-off lines, then generates a branded PDF.
-- Numbering continues from your existing manual invoice
-- sequence (next one will be #42).
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS manual_invoice_counter (
  id INT PRIMARY KEY DEFAULT 1,
  next_number INT DEFAULT 42
);
INSERT INTO manual_invoice_counter (id, next_number) VALUES (1, 42) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION get_next_manual_invoice_number()
RETURNS INT AS $$
DECLARE
  num INT;
BEGIN
  UPDATE manual_invoice_counter SET next_number = next_number + 1 WHERE id = 1 RETURNING next_number - 1 INTO num;
  RETURN num;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS manual_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number INT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT current_date,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_invoices_number_idx ON manual_invoices(invoice_number DESC);

-- Row level security — matches the existing wide-open pattern used
-- throughout this app (no real per-table auth, just URL obscurity
-- for this private page).
ALTER TABLE manual_invoice_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read manual_invoice_counter" ON manual_invoice_counter FOR SELECT USING (true);
CREATE POLICY "Admin full access manual_invoice_counter" ON manual_invoice_counter FOR ALL USING (true);
CREATE POLICY "Public can read manual_invoices" ON manual_invoices FOR SELECT USING (true);
CREATE POLICY "Admin full access manual_invoices" ON manual_invoices FOR ALL USING (true);
