-- ============================================
-- Horse Box Rental — request submissions
-- Captured on the /horse-box-rental page: renter details, horse
-- transport details, and confirmation the renter agreed to the
-- rental terms & conditions.
-- Public insert only (no public read) — same pattern as `messages`
-- and `quiz_entries`: visitors submit their own request, only Admin
-- (client-side password gate, same as the rest of this app) lists them.
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS horse_box_rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  num_horses INT NOT NULL DEFAULT 1,
  horse_details TEXT,
  collection_date DATE NOT NULL,
  return_date DATE NOT NULL,
  destination TEXT,
  towing_vehicle_confirmed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS horse_box_rentals_created_idx ON horse_box_rentals(created_at DESC);

ALTER TABLE horse_box_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert horse box rentals" ON horse_box_rentals FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access horse box rentals" ON horse_box_rentals FOR ALL USING (true);
