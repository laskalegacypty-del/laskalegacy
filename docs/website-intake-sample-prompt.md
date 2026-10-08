# Build a one-page website for Sunrise Bakery

## Brief
Build a modern, responsive, fast one-page website for a small business in South Africa. Output clean static HTML, CSS, and minimal JS, ready to deploy on Cloudflare Pages. Include SEO basics (title, meta description, Open Graph tags, semantic HTML, alt text), accessibility basics, and a favicon generated from the logo.

## Business
- Name: Sunrise Bakery
- Tagline: Fresh, every morning
- Industry: Restaurant, cafe or catering
- Location: Stellenbosch, Western Cape
- Year started: 2018
- What they do: We bake fresh sourdough, pastries and custom celebration cakes daily for families and local cafes in the Winelands.
- Ideal customers: Local families and coffee shops
- What makes them different: Everything is baked at 4am with stone-milled flour

## Brand
- Logo file: https://x.supabase.co/storage/v1/object/public/website-assets/abc/logo.png
- Colors: primary #0097b2, secondary #5e17eb, accent #f59e0b
- Background mode: Light
- Font style: Classic Serif. Suggested Google Fonts pairing: Playfair Display for headings with Source Serif 4 for body. Adjust if a better match exists.
- Icon style: Rounded
- Vibe keywords: Friendly, Rustic
- Use CSS variables for all colors and fonts so they can be changed in one place.

## Sections (in order)
Hero, About, Services, Gallery, Testimonials, Contact, Footer. Use the real content supplied. Where content is missing, write professional, on-brand copy in South African English based on the business description.
- Hero headline: not supplied, write one.
- About text: not supplied, write it from the business description.

## Services
1. Sourdough loaves: Slow-fermented, baked daily. Price: From R45.
2. Custom cakes: Birthdays and weddings.

## Testimonials
- "Best bread in town, hands down." (Pieter)

## Contact
- Email: hello@sunrise.co.za
- WhatsApp link: https://wa.me/27825550101
- Address: 12 Church St, Stellenbosch
- Show an embedded map for the address (Google Maps embed, lazy loaded).
- Trading hours:
  - Mon to Wed: 07:00 to 16:00
  - Thu to Fri: Closed
  - Saturday: 07:00 to 12:00
  - Sunday: Closed
- Social links (use icon links in the footer and contact section):
  - Instagram: https://instagram.com/sunrisebakery
- Primary CTA: "Order on WhatsApp" (WhatsApp us), repeated in the hero, mid page, and footer.

## Images
- Hero image: https://x.supabase.co/storage/v1/object/public/website-assets/abc/hero.jpg
- Logo (header, footer, favicon source): https://x.supabase.co/storage/v1/object/public/website-assets/abc/logo.png
- The client asked for stock placeholder images wherever they have none. Use clearly relevant royalty free images (Unsplash or Pexels) and note their sources in a comment.

## Inspiration
- Likes https://example.com: Clean layout

## Domain
- Client needs a domain. Preferred names in order: sunrisebakery.co.za, sunrise-bakery.co.za

## Constraints
- One page only. No sections beyond those listed.
- Lightweight (Lighthouse 90+).
- Expose all editable values in a single `settings.json` so a design studio can modify them later. The reference values for this site are:

```json
{
  "brand": {
    "name": "Sunrise Bakery",
    "tagline": "Fresh, every morning",
    "logoUrl": "https://x.supabase.co/storage/v1/object/public/website-assets/abc/logo.png",
    "colors": {
      "primary": "#0097b2",
      "secondary": "#5e17eb",
      "accent": "#f59e0b",
      "background": "#ffffff"
    },
    "fontStyle": "Classic Serif",
    "iconStyle": "Rounded",
    "vibe": [
      "Friendly",
      "Rustic"
    ]
  },
  "sections": {
    "hero": true,
    "about": true,
    "services": true,
    "gallery": true,
    "testimonials": true,
    "contact": true
  },
  "content": {
    "heroHeadline": "",
    "aboutText": "",
    "services": [
      {
        "name": "Sourdough loaves",
        "description": "Slow-fermented, baked daily.",
        "price": "From R45",
        "imageUrl": ""
      },
      {
        "name": "Custom cakes",
        "description": "Birthdays and weddings.",
        "price": "",
        "imageUrl": ""
      }
    ],
    "testimonials": [
      {
        "name": "Pieter",
        "quote": "Best bread in town, hands down."
      }
    ],
    "cta": {
      "type": "WhatsApp us",
      "customText": "Order on WhatsApp"
    }
  },
  "images": {
    "hero": "https://x.supabase.co/storage/v1/object/public/website-assets/abc/hero.jpg",
    "gallery": [],
    "team": ""
  },
  "contact": {
    "email": "hello@sunrise.co.za",
    "phone": "",
    "whatsapp": "0825550101",
    "address": "12 Church St, Stellenbosch",
    "showMap": true,
    "hours": {
      "mon": {
        "open": true,
        "from": "07:00",
        "to": "16:00"
      },
      "tue": {
        "open": true,
        "from": "07:00",
        "to": "16:00"
      },
      "wed": {
        "open": true,
        "from": "07:00",
        "to": "16:00"
      },
      "thu": {
        "open": false,
        "from": "08:00",
        "to": "17:00"
      },
      "fri": {
        "open": false,
        "from": "08:00",
        "to": "17:00"
      },
      "sat": {
        "open": true,
        "from": "07:00",
        "to": "12:00"
      },
      "sun": {
        "open": false,
        "from": "08:00",
        "to": "17:00"
      }
    },
    "social": {
      "instagram": "https://instagram.com/sunrisebakery"
    }
  },
  "domain": {
    "owned": false,
    "name": "",
    "preferred": [
      "sunrisebakery.co.za",
      "sunrise-bakery.co.za"
    ]
  }
}
```

