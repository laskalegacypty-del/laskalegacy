-- ============================================
-- Horse Box Rentals — collection-day fields
-- Adds the collection-inspection acknowledgment fields now that the
-- /horse-box-rental page is filled in at pickup (not as an advance
-- request): confirms the box was inspected and records any damage
-- noted at collection. Also switches the default status to
-- 'collected' since a submission now IS the finalised handover.
-- Run this in your Supabase SQL Editor (018_horse_box_rentals.sql
-- must already have been run).
-- ============================================

ALTER TABLE horse_box_rentals ADD COLUMN IF NOT EXISTS inspection_confirmed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE horse_box_rentals ADD COLUMN IF NOT EXISTS damage_notes TEXT;
ALTER TABLE horse_box_rentals ALTER COLUMN status SET DEFAULT 'collected';
