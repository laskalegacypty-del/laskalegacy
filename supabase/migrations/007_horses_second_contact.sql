-- Optional second contact person for a horse listing.
ALTER TABLE horses
ADD COLUMN IF NOT EXISTS contact_name_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_phone_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_email_2 TEXT DEFAULT '';
