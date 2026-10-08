// Pure functions: answers -> settings_json and generated_prompt.
// No browser or server APIs in here, so it runs anywhere (and in node for testing).

import { DAYS, SOCIALS, FONT_STYLES } from './schema';

// The prompt must never contain em or en dashes, including inside client-written text.
export function clean(text) {
  return String(text ?? '').replace(/[ \t]*[—–][ \t]*/g, ', ');
}

const has = (v) => String(v ?? '').trim().length > 0;
const urlOf = (f) => (f && f.url ? f.url : '');

function normaliseUrl(u) {
  const v = String(u || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function whatsappLink(num) {
  let d = String(num || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = `27${d.slice(1)}`; // South African national format
  return `https://wa.me/${d}`;
}

function industryOf(a) {
  return a.about.industry === 'Other' ? a.about.industryOther.trim() : a.about.industry;
}

function backgroundHex(mode) {
  if (mode === 'Light') return '#ffffff';
  if (mode === 'Dark') return '#0b0b0f';
  return 'auto';
}

// Group consecutive days with identical hours: "Mon to Fri 08:00 to 17:00".
export function formatHours(hours) {
  const rows = DAYS.map(([k, label]) => ({ label, ...hours[k] }));
  const groups = [];
  for (const r of rows) {
    const key = r.open ? `${r.from} to ${r.to}` : 'Closed';
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(r.label);
    else groups.push({ key, days: [r.label] });
  }
  if (!rows.some((r) => r.open)) return [];
  return groups
    .map((g) => `${g.days.length > 1 ? `${g.days[0].slice(0, 3)} to ${g.days[g.days.length - 1].slice(0, 3)}` : g.days[0]}: ${g.key}`);
}

export function buildSettings(a) {
  const b = a.brand;
  const c = a.contact;
  const x = a.extras;
  const gallery = a.content.galleryImages.map(urlOf).filter(Boolean);

  return {
    brand: {
      name: a.about.businessName.trim(),
      tagline: a.about.tagline.trim(),
      logoUrl: urlOf(b.logo),
      colors: {
        primary: b.autoColors ? 'auto-from-logo' : b.colors.primary,
        secondary: b.autoColors ? 'auto-from-logo' : b.colors.secondary,
        accent: b.autoColors ? 'auto-from-logo' : b.colors.accent,
        background: backgroundHex(b.background),
      },
      fontStyle: b.fontStyle,
      iconStyle: b.iconStyle,
      vibe: b.vibe,
    },
    sections: {
      hero: true,
      about: true,
      services: a.services.items.length > 0,
      gallery: gallery.length > 0 || a.content.useStock,
      testimonials: a.content.testimonials.some((t) => has(t.name) && has(t.quote)),
      contact: true,
    },
    content: {
      heroHeadline: a.content.heroHeadline.trim(),
      aboutText: a.content.aboutText.trim(),
      services: a.services.items.map((s) => ({
        name: s.name.trim(),
        description: s.description.trim(),
        price: s.price.trim(),
        imageUrl: urlOf(s.image),
      })),
      testimonials: a.content.testimonials
        .filter((t) => has(t.name) && has(t.quote))
        .map((t) => ({ name: t.name.trim(), quote: t.quote.trim() })),
      cta: { type: a.services.cta.type, customText: a.services.cta.customText.trim() },
    },
    images: {
      hero: urlOf(a.content.heroImage),
      gallery,
      team: urlOf(a.content.teamPhoto),
    },
    contact: {
      email: c.publicEmail.trim(),
      phone: c.publicPhone.trim(),
      whatsapp: c.whatsapp.trim(),
      address: c.address.trim(),
      showMap: !!c.showMap,
      hours: c.hours,
      social: Object.fromEntries(SOCIALS.map(([k]) => [k, normaliseUrl(c.social[k])]).filter(([, v]) => v)),
    },
    domain: {
      owned: x.domainMode === 'owned',
      name: x.domainMode === 'owned' ? x.ownedDomain.trim() : '',
      preferred: x.domainMode === 'need' ? x.preferredDomains.map((d) => d.trim()).filter(Boolean) : [],
    },
  };
}

export function buildPrompt(a, settings = buildSettings(a)) {
  const b = a.brand;
  const c = a.contact;
  const x = a.extras;
  const biz = a.about.businessName.trim();
  const font = FONT_STYLES.find((f) => f.id === b.fontStyle);
  const out = [];
  const push = (...lines) => out.push(...lines);

  push(`# Build a one-page website for ${biz}`, '');

  push(
    '## Brief',
    'Build a modern, responsive, fast one-page website for a small business in South Africa. Output clean static HTML, CSS, and minimal JS, ready to deploy on Cloudflare Pages. Include SEO basics (title, meta description, Open Graph tags, semantic HTML, alt text), accessibility basics, and a favicon generated from the logo.',
    '',
  );

  // Business
  push('## Business', `- Name: ${biz}`);
  if (has(a.about.tagline)) push(`- Tagline: ${a.about.tagline.trim()}`);
  push(`- Industry: ${industryOf(a)}`);
  push(`- Location: ${a.about.town.trim()}, ${a.about.province}`);
  if (has(a.about.yearStarted)) push(`- Year started: ${a.about.yearStarted.trim()}`);
  push(
    `- What they do: ${a.about.description.trim()}`,
    `- Ideal customers: ${a.about.idealCustomers.trim()}`,
    `- What makes them different: ${a.about.differentiator.trim()}`,
    '',
  );

  // Brand
  push('## Brand');
  if (settings.brand.logoUrl) push(`- Logo file: ${settings.brand.logoUrl}`);
  else {
    push('- Logo file: none supplied. Create a clean text wordmark.');
    if (has(b.nameStyling)) push(`- Preferred name styling: ${b.nameStyling.trim()}`);
  }
  if (b.autoColors) {
    push('- Colors: choose primary, secondary, and accent colors that match the logo');
  } else {
    push(`- Colors: primary ${b.colors.primary}, secondary ${b.colors.secondary}, accent ${b.colors.accent}`);
  }
  push(`- Background mode: ${b.background}`);
  if (font && b.fontStyle !== 'No preference') {
    push(`- Font style: ${b.fontStyle}. Suggested Google Fonts pairing: ${font.googleFonts}. Adjust if a better match exists.`);
  } else {
    push('- Font style: no preference. Suggest a specific Google Fonts pairing that matches the vibe.');
  }
  push(`- Icon style: ${b.iconStyle === 'No preference' ? 'no preference, pick a consistent set that suits the brand' : b.iconStyle}`);
  push(`- Vibe keywords: ${b.vibe.join(', ')}`);
  push('- Use CSS variables for all colors and fonts so they can be changed in one place.', '');

  // Sections
  const order = ['Hero'];
  order.push('About');
  if (settings.sections.services) order.push('Services');
  if (settings.sections.gallery) order.push('Gallery');
  if (settings.sections.testimonials) order.push('Testimonials');
  order.push('Contact', 'Footer');
  push('## Sections (in order)', order.join(', ') + '. Use the real content supplied. Where content is missing, write professional, on-brand copy in South African English based on the business description.');
  if (has(a.content.heroHeadline)) push(`- Hero headline: ${a.content.heroHeadline.trim()}`);
  else push('- Hero headline: not supplied, write one.');
  if (has(a.content.aboutText)) push(`- About text: ${a.content.aboutText.trim()}`);
  else push('- About text: not supplied, write it from the business description.');
  push('');

  // Services
  if (settings.sections.services) {
    push('## Services');
    settings.content.services.forEach((s, i) => {
      push(`${i + 1}. ${s.name}: ${s.description}${s.price ? ` Price: ${s.price}.` : ''}${s.imageUrl ? ` Image: ${s.imageUrl}` : ''}`);
    });
    push('');
  }

  // Testimonials
  if (settings.sections.testimonials) {
    push('## Testimonials');
    settings.content.testimonials.forEach((t) => push(`- "${t.quote}" (${t.name})`));
    push('');
  }

  // Contact
  push('## Contact');
  if (has(c.publicEmail)) push(`- Email: ${c.publicEmail.trim()}`);
  if (has(c.publicPhone)) push(`- Phone: ${c.publicPhone.trim()}`);
  if (has(c.whatsapp)) push(`- WhatsApp link: ${whatsappLink(c.whatsapp)}`);
  if (has(c.address)) push(`- Address: ${c.address.trim()}`);
  if (c.showMap && has(c.address)) push('- Show an embedded map for the address (Google Maps embed, lazy loaded).');
  const hours = formatHours(c.hours);
  if (hours.length) push('- Trading hours:', ...hours.map((h) => `  - ${h}`));
  const socials = Object.entries(settings.contact.social);
  if (socials.length) {
    push('- Social links (use icon links in the footer and contact section):', ...socials.map(([k, v]) => `  - ${SOCIALS.find(([id]) => id === k)[1]}: ${v}`));
  }
  const ctaType = settings.content.cta.type;
  const ctaText = settings.content.cta.customText || ctaType;
  push(`- Primary CTA: "${ctaText}" (${ctaType}), repeated in the hero, mid page, and footer.`);
  if (!has(c.publicEmail) && !has(c.publicPhone) && !has(c.whatsapp)) {
    push('- Add a contact form (Formspree ready).');
  }
  push('');

  // Images
  const imgLines = [];
  if (settings.images.hero) imgLines.push(`- Hero image: ${settings.images.hero}`);
  settings.images.gallery.forEach((u, i) => imgLines.push(`- Gallery image ${i + 1}: ${u}`));
  if (settings.images.team) imgLines.push(`- Team photo (use in the About section): ${settings.images.team}`);
  if (settings.brand.logoUrl) imgLines.push(`- Logo (header, footer, favicon source): ${settings.brand.logoUrl}`);
  if (imgLines.length || a.content.useStock) {
    push('## Images', ...imgLines);
    if (a.content.useStock) push('- The client asked for stock placeholder images wherever they have none. Use clearly relevant royalty free images (Unsplash or Pexels) and note their sources in a comment.');
    push('');
  }

  // Inspiration
  const refs = x.references.filter((r) => has(r.url));
  if (refs.length || has(x.dislikes) || has(x.existingUrl)) {
    push('## Inspiration');
    refs.forEach((r) => push(`- Likes ${normaliseUrl(r.url)}${has(r.like) ? `: ${r.like.trim()}` : ''}`));
    if (has(x.dislikes)) push(`- Dislikes: ${x.dislikes.trim()}`);
    if (has(x.existingUrl)) push(`- Existing website (for reference only): ${normaliseUrl(x.existingUrl)}`);
    push('');
  }

  // Domain
  push('## Domain');
  if (x.domainMode === 'owned') push(`- Client already owns: ${x.ownedDomain.trim()}`);
  else push(`- Client needs a domain. Preferred names in order: ${settings.domain.preferred.join(', ')}`);
  push('');

  if (has(x.notes)) push('## Extra notes from the client', x.notes.trim(), '');

  push(
    '## Constraints',
    '- One page only. No sections beyond those listed.',
    '- Lightweight (Lighthouse 90+).',
    '- Expose all editable values in a single `settings.json` so a design studio can modify them later. The reference values for this site are:',
    '',
    '```json',
    JSON.stringify(settings, null, 2),
    '```',
  );

  return clean(out.join('\n')).replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
