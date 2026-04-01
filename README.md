# Laska Legacy — Leather & Canvas for Horse & Rider

Full e-commerce website with Supabase backend. Built with Next.js 14.

## Setup (3 steps)

### Step 1: Install & Configure

```bash
cd laska-legacy
npm install
```

Copy the env template and add your Supabase anon key:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` — your URL is already set. For the anon key:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → Settings → API
3. Copy the `anon` `public` key (starts with `eyJ...`)
4. Paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Run the Database Migration

1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/hasoqmxmvylgwinppthk/sql)
2. Click **New Query**
3. Open `supabase/migrations/001_initial.sql`, copy the entire contents
4. Paste into the SQL editor and click **Run**

This creates all tables, storage buckets, RLS policies, and seeds your starter products.

### Step 3: Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What's Included

### Storefront
- Homepage with hero, categories, featured products, gallery preview, "Our Story"
- Shop with category filters
- Product detail pages with image gallery
- Gallery page with lightbox
- "Between the Poles" blog with rich content, images, embedded videos
- Order form — clients select products, fill in details, choose courier
- Contact page with WhatsApp, Email, Instagram, TikTok links
- Galloping horse loading screen

### Admin Panel (password: `laska2025`)
- Products: add, edit, delete, upload multiple images, toggle featured
- Gallery: upload photos, add captions, reorder, delete
- Blog: full post editor with cover images, inline photos, YouTube/TikTok embeds
- Orders: review client orders, edit line items/pricing, generate branded PDF invoices
- Messages: view and manage contact form submissions

### Supabase Backend
- **Database**: Products, messages, gallery, orders, blog posts, invoice counter
- **Storage**: 3 public buckets (products, gallery, blog) for image uploads
- **RLS**: Public read access for storefront, full admin access via anon key
- **Invoice numbering**: Auto-incrementing LL-0001, LL-0002, etc.

## Deploy to Vercel

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Project Structure

```
laska-legacy/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   └── LaskaLegacy.jsx      ← Full app (all pages + admin)
├── lib/
│   └── supabase.js           ← Supabase client + all CRUD functions
├── public/
│   ├── logo-white.png
│   ├── logo-dark.png
│   ├── horse-gallop.gif
│   └── horse-gallop.mp4
├── supabase/
│   └── migrations/
│       └── 001_initial.sql   ← Run this in SQL Editor
├── .env.local.example
├── next.config.js
├── package.json
└── README.md
```

## Brand

- Teal: `#0097b2` | Purple: `#5e17eb` | Black: `#000000` | White: `#ffffff`
- Fonts: Montserrat (headings), Inter (body)
- Admin password: `laska2025` — **change this before going live!**

## Next Steps for Production

1. **Change admin password** — search for `laska2025` in LaskaLegacy.jsx
2. **Add proper auth** — use Supabase Auth to protect admin routes
3. **Connect email** — hook contact form to Resend/SendGrid
4. **Add analytics** — Google Analytics or Plausible
5. **Custom domain** — point your domain to Vercel

---

Built with love, for Alaska 🐴
