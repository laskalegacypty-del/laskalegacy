-- ============================================
-- Training Agreements — 30-Day Training & Correction Agreement
-- Filled in and signed digitally by the horse owner when they bring a
-- horse for training (/training-agreement). Stores the owner & horse
-- details, chosen payment option, health/behaviour disclosure, the
-- acknowledgements ticked, and the drawn signature (PNG data URL).
--
-- Public INSERT only — there is deliberately NO public read policy, because
-- these records hold ID numbers, addresses and signatures. View them in the
-- Supabase Table Editor (or add an admin view that reads server-side).
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS training_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_version TEXT NOT NULL,

  -- Owner
  owner_name TEXT NOT NULL,
  owner_id_number TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  emergency_contact TEXT,

  -- Horse
  horse_name TEXT NOT NULL,
  horse_age TEXT NOT NULL,
  horse_breed TEXT NOT NULL,
  horse_sex TEXT NOT NULL,
  passport_number TEXT,

  -- Training period & fee
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fee_total INT NOT NULL,
  payment_option TEXT NOT NULL CHECK (payment_option IN ('split', 'full')),

  -- Care, health & behaviour
  dietary_instructions TEXT,
  vet_details TEXT,
  training_goals TEXT,
  behaviour_disclosure TEXT,

  -- Acceptance
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  risk_accepted BOOLEAN NOT NULL DEFAULT false,
  disclosure_confirmed BOOLEAN NOT NULL DEFAULT false,
  signed_name TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  status TEXT NOT NULL DEFAULT 'signed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_agreements_created_idx ON training_agreements(created_at DESC);

ALTER TABLE training_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert training agreements" ON training_agreements FOR INSERT WITH CHECK (true);
