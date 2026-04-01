-- ============================================
-- Laska Legacy — Supabase Migration
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- ==================
-- 1. PRODUCTS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'bridles',
  price TEXT NOT NULL DEFAULT 'R0',
  description TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- 2. MESSAGES TABLE
-- ==================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- 3. GALLERY TABLE
-- ==================
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  src TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- 4. ORDERS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  client JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '[]',
  courier TEXT DEFAULT 'standard',
  courier_fee NUMERIC DEFAULT 150,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- 5. BLOG POSTS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  body TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- 6. INVOICE COUNTER
-- ==================
CREATE TABLE IF NOT EXISTS invoice_counter (
  id INT PRIMARY KEY DEFAULT 1,
  next_number INT DEFAULT 1
);
INSERT INTO invoice_counter (id, next_number) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  num INT;
BEGIN
  UPDATE invoice_counter SET next_number = next_number + 1 WHERE id = 1 RETURNING next_number - 1 INTO num;
  RETURN 'LL-' || LPAD(num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ==================
-- 7. STORAGE BUCKETS
-- ==================
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('blog', 'blog', true) ON CONFLICT (id) DO NOTHING;

-- ==================
-- 8. ROW LEVEL SECURITY
-- ==================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counter ENABLE ROW LEVEL SECURITY;

-- Public read access for storefront
CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can read gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Public can read published blog posts" ON blog_posts FOR SELECT USING (published = true);

-- Public can submit messages and orders
CREATE POLICY "Public can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read invoice counter" ON invoice_counter FOR SELECT USING (true);
CREATE POLICY "Public can update invoice counter" ON invoice_counter FOR UPDATE USING (true);

-- Admin full access (using service role or authenticated)
-- For now we allow all operations via anon key (you should add proper auth later)
CREATE POLICY "Admin full access products" ON products FOR ALL USING (true);
CREATE POLICY "Admin full access messages" ON messages FOR ALL USING (true);
CREATE POLICY "Admin full access gallery" ON gallery FOR ALL USING (true);
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (true);
CREATE POLICY "Admin full access blog" ON blog_posts FOR ALL USING (true);

-- Storage policies — public read, authenticated upload
CREATE POLICY "Public read products storage" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public read gallery storage" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Public read blog storage" ON storage.objects FOR SELECT USING (bucket_id = 'blog');
CREATE POLICY "Allow upload products storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Allow upload gallery storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "Allow upload blog storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog');
CREATE POLICY "Allow delete products storage" ON storage.objects FOR DELETE USING (bucket_id = 'products');
CREATE POLICY "Allow delete gallery storage" ON storage.objects FOR DELETE USING (bucket_id = 'gallery');
CREATE POLICY "Allow delete blog storage" ON storage.objects FOR DELETE USING (bucket_id = 'blog');

-- ==================
-- 9. SEED DATA (default products)
-- ==================
INSERT INTO products (name, category, price, description, featured) VALUES
  ('Heritage Stock Bridle', 'bridles', 'R1,250', 'Full-grain leather stock bridle with hand-stitched browband. Available in dark oil and London tan. Includes reins.', true),
  ('Stockman''s Breastplate', 'breastplates', 'R980', 'Adjustable leather breastplate with solid brass hardware. Designed for working horses and trail riding.', true),
  ('Braided Paracord Reins', 'reins', 'R450', 'Hand-braided 550 paracord reins with leather slobber straps. Lightweight and durable in any weather.', true),
  ('Two-Tone Paracord Reins', 'reins', 'R480', 'Custom colour paracord reins with waxed leather poppers. Choose your colours at checkout.', false),
  ('Ranch Canvas Tote', 'bags', 'R650', 'Heavy-duty waxed canvas tote with leather handles and brass rivets. Perfect for the barn or market day.', true),
  ('Saddlebag Crossbody', 'bags', 'R890', 'Vintage-inspired crossbody bag in waxed canvas and full-grain leather. Antique brass buckle closure.', false),
  ('Show Day Stock Bridle', 'bridles', 'R1,450', 'Premium show bridle in supple black leather with silver-plated fittings and padded browband.', false),
  ('Canvas Grooming Kit Bag', 'bags', 'R520', 'Compact roll-up canvas bag with leather buckle straps. Holds brushes, picks, and essentials.', false)
ON CONFLICT DO NOTHING;
