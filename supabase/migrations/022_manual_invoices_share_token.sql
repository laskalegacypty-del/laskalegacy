-- ============================================
-- Manual Invoices — shareable digital invoice links
-- Every invoice gets an unguessable token. The public page at
-- /i/<token> looks the invoice up by that token only, so a link
-- can't be used to browse other invoices.
-- Existing invoices are back-filled with their own token.
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE manual_invoices
  ADD COLUMN IF NOT EXISTS share_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE UNIQUE INDEX IF NOT EXISTS manual_invoices_share_token_idx ON manual_invoices(share_token);

CREATE OR REPLACE FUNCTION get_manual_invoice_by_token(p_token TEXT)
RETURNS SETOF manual_invoices
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM manual_invoices WHERE share_token = p_token LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_manual_invoice_by_token(TEXT) TO anon, authenticated;
