-- Optional size list and per-image style labels (parallel to images array)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_labels TEXT[] DEFAULT '{}';
