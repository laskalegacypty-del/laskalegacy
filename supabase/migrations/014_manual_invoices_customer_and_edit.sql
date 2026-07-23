-- ============================================
-- Manual Invoices — customer details + editing support
-- Customer details are entirely optional per invoice —
-- leave them blank to keep the invoice exactly as before.
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT '';
