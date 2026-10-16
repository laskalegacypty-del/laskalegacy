-- ============================================
-- Training Agreements — owner review & approval
-- `status` flow: 'signed' (waiting for the trainer) -> 'approved' | 'declined'.
-- Reviewed from Admin > Training Contracts via a server route (service role),
-- so the table still has no public read policy.
-- Run this in your Supabase SQL Editor (021_training_agreements.sql first)
-- ============================================

ALTER TABLE training_agreements ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE training_agreements ADD COLUMN IF NOT EXISTS trainer_notes TEXT;
ALTER TABLE training_agreements DROP CONSTRAINT IF EXISTS training_agreements_status_check;
ALTER TABLE training_agreements ADD CONSTRAINT training_agreements_status_check CHECK (status IN ('signed', 'approved', 'declined'));
