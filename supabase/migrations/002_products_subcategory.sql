-- Add optional subcategory support for products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT '';

