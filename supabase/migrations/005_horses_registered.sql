-- Add a simple "registered" boolean flag for horses for sale.
-- The existing `registration` text column stays as a free-form studbook
-- description; this new boolean is just the quick yes/no indicator shown
-- next to the breed in the admin form and on the listing.

ALTER TABLE horses
ADD COLUMN IF NOT EXISTS registered BOOLEAN DEFAULT false;
