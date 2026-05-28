-- Quick "up to date" checkbox flags for common horse-health milestones.
-- The existing `vaccinations` text column stays as a free-form notes field
-- for anything extra the seller wants to record.

ALTER TABLE horses
ADD COLUMN IF NOT EXISTS ahs_up_to_date BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flu_up_to_date BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hooves_up_to_date BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS teeth_up_to_date BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deworming_up_to_date BOOLEAN DEFAULT false;
