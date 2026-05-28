-- ============================================
-- Horses for Sale section
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS horses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT DEFAULT '',
  sex TEXT DEFAULT '',
  age NUMERIC DEFAULT 0,
  height_hh NUMERIC DEFAULT 0,
  color TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  price_label TEXT DEFAULT '',
  location TEXT DEFAULT '',
  province TEXT DEFAULT '',
  vaccinations TEXT DEFAULT '',
  passport BOOLEAN DEFAULT false,
  passport_details TEXT DEFAULT '',
  registration TEXT DEFAULT '',
  microchipped BOOLEAN DEFAULT false,
  rider_level TEXT DEFAULT '',
  disciplines TEXT[] DEFAULT '{}',
  experience TEXT DEFAULT '',
  temperament TEXT DEFAULT '',
  health_notes TEXT DEFAULT '',
  description TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'available',
  featured BOOLEAN DEFAULT false,
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS horses_status_idx ON horses(status);
CREATE INDEX IF NOT EXISTS horses_featured_idx ON horses(featured);
CREATE INDEX IF NOT EXISTS horses_province_idx ON horses(province);

-- Storage bucket for horse photos
INSERT INTO storage.buckets (id, name, public) VALUES ('horses', 'horses', true) ON CONFLICT (id) DO NOTHING;

-- Row level security
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read horses" ON horses FOR SELECT USING (true);
CREATE POLICY "Admin full access horses" ON horses FOR ALL USING (true);

CREATE POLICY "Public read horses storage" ON storage.objects FOR SELECT USING (bucket_id = 'horses');
CREATE POLICY "Allow upload horses storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'horses');
CREATE POLICY "Allow delete horses storage" ON storage.objects FOR DELETE USING (bucket_id = 'horses');
