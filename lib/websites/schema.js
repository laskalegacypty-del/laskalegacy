// Shared by the browser wizard AND the server routes, so both validate identically.
// To add or change a field: update emptyAnswers(), the matching validate* function,
// the step in components/WebsiteIntake.jsx, and lib/websites/build.js.

export const PRICE_ZAR = 500;
export const MAX_SERVICES = 6;
export const MAX_TESTIMONIALS = 3;
export const MAX_GALLERY = 8;
export const MAX_REFERENCES = 3;
export const MAX_VIBES = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const BUCKET = 'website-assets';

// Allowed upload kinds. Logos may be SVG; photos may not.
export const LOGO_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];
export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export const UPLOAD_KINDS = {
  logo: { types: LOGO_TYPES },
  serviceImage: { types: PHOTO_TYPES },
  hero: { types: PHOTO_TYPES },
  gallery: { types: PHOTO_TYPES },
  team: { types: PHOTO_TYPES },
};

export const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
];

export const INDUSTRIES = [
  'Retail or shop', 'Restaurant, cafe or catering', 'Beauty, hair or wellness',
  'Construction or trades', 'Professional services', 'Health or medical',
  'Education or training', 'Farming or agriculture', 'Automotive',
  'Events or entertainment', 'Photography or creative', 'Tourism or accommodation',
  'Non-profit or community', 'Technology', 'Other',
];

export const CTA_TYPES = [
  'Call us', 'WhatsApp us', 'Send an email', 'Request a quote', 'Book now', 'Visit us',
];

export const BACKGROUNDS = ['Light', 'Dark', 'Let the designer choose'];

// googleFonts is the pairing suggested in the generated prompt; css is for the preview cards.
export const FONT_STYLES = [
  { id: 'Modern Sans', css: "'Inter', 'Helvetica Neue', Arial, sans-serif", weight: 600, sample: 'Clean and modern', googleFonts: 'Inter for headings and body (or Poppins for headings with Inter for body)' },
  { id: 'Classic Serif', css: "'Playfair Display', Georgia, serif", weight: 700, sample: 'Timeless and trusted', googleFonts: 'Playfair Display for headings with Source Serif 4 for body' },
  { id: 'Bold Display', css: "'Archivo Black', 'Arial Black', sans-serif", weight: 400, sample: 'Loud and confident', googleFonts: 'Archivo Black for headings with Inter for body' },
  { id: 'Elegant Script Accent', css: "'Dancing Script', cursive", weight: 700, sample: 'Warm and elegant', googleFonts: 'Dancing Script for small accent text only, with Cormorant Garamond for headings and Lato for body' },
  { id: 'Rounded Friendly', css: "'Nunito', 'Trebuchet MS', sans-serif", weight: 800, sample: 'Soft and welcoming', googleFonts: 'Nunito for headings and body' },
  { id: 'Technical Mono', css: "'JetBrains Mono', 'Courier New', monospace", weight: 700, sample: 'Precise and technical', googleFonts: 'JetBrains Mono for headings with Inter for body' },
  { id: 'No preference', css: "system-ui, sans-serif", weight: 600, sample: 'You choose for me', googleFonts: 'a pairing that fits the brand vibe' },
];

export const ICON_STYLES = ['Outline', 'Solid', 'Rounded', 'No preference'];
export const VIBES = ['Professional', 'Friendly', 'Luxury', 'Playful', 'Rustic', 'Minimal', 'Bold', 'Earthy'];

export const DAYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
];

export const SOCIALS = [
  ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'],
  ['linkedin', 'LinkedIn'], ['x', 'X'], ['youtube', 'YouTube'],
];

export const STEPS = [
  { id: 'about', title: 'About you', short: 'You' },
  { id: 'contact', title: 'Contact details', short: 'Contact' },
  { id: 'services', title: 'Services', short: 'Services' },
  { id: 'brand', title: 'Brand', short: 'Brand' },
  { id: 'content', title: 'Content and images', short: 'Content' },
  { id: 'extras', title: 'Inspiration', short: 'Extras' },
  { id: 'review', title: 'Review and submit', short: 'Review' },
];

export function emptyAnswers() {
  return {
    about: {
      fullName: '', email: '', phone: '', businessName: '', tagline: '',
      industry: '', industryOther: '', yearStarted: '', town: '', province: '',
      description: '', idealCustomers: '', differentiator: '',
    },
    contact: {
      publicEmail: '', publicPhone: '', whatsapp: '', address: '', showMap: false,
      hours: Object.fromEntries(DAYS.map(([k]) => [k, { open: false, from: '08:00', to: '17:00' }])),
      social: Object.fromEntries(SOCIALS.map(([k]) => [k, ''])),
    },
    services: {
      items: [{ name: '', description: '', price: '', image: null }],
      cta: { type: '', customText: '' },
    },
    brand: {
      logo: null, noLogo: false, nameStyling: '',
      colors: { primary: '#0097b2', secondary: '#5e17eb', accent: '#f59e0b' },
      autoColors: false, background: '', fontStyle: '', iconStyle: '', vibe: [],
    },
    content: {
      heroHeadline: '', aboutText: '',
      testimonials: [],
      heroImage: null, galleryImages: [], teamPhoto: null, useStock: false,
    },
    extras: {
      references: [], dislikes: '', existingUrl: '',
      domainMode: '', ownedDomain: '', preferredDomains: ['', '', ''],
      notes: '',
    },
    consent: { terms: false, popia: false },
  };
}

// ─── Small validators ───

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const isEmail = (v) => EMAIL_RE.test(String(v || '').trim());
export const isHex = (v) => HEX_RE.test(String(v || '').trim());
export const isPhone = (v) => String(v || '').replace(/\D/g, '').length >= 9;
export const isUrl = (v) => {
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
};
const blank = (v) => !String(v ?? '').trim();
const len = (v) => String(v ?? '').trim().length;

// Each validator returns { 'dotted.path': 'message' }. Empty object means valid.

function validateAbout(a) {
  const e = {};
  const x = a.about;
  if (blank(x.fullName)) e['about.fullName'] = 'Please tell us your full name.';
  if (!isEmail(x.email)) e['about.email'] = 'Please enter a valid email address.';
  if (!isPhone(x.phone)) e['about.phone'] = 'Please enter a phone number we can reach you on.';
  if (blank(x.businessName)) e['about.businessName'] = 'Please enter your business name.';
  if (blank(x.industry)) e['about.industry'] = 'Please pick the closest match.';
  if (x.industry === 'Other' && blank(x.industryOther)) e['about.industryOther'] = 'Please tell us what kind of business it is.';
  if (!blank(x.yearStarted) && !(/^\d{4}$/.test(x.yearStarted) && +x.yearStarted >= 1900 && +x.yearStarted <= new Date().getFullYear())) {
    e['about.yearStarted'] = 'Please enter a 4 digit year, for example 2019.';
  }
  if (blank(x.town)) e['about.town'] = 'Please enter your town or city.';
  if (blank(x.province)) e['about.province'] = 'Please pick your province.';
  if (len(x.description) < 50 || len(x.description) > 500) e['about.description'] = `Please write between 50 and 500 characters (you have ${len(x.description)}).`;
  if (blank(x.idealCustomers)) e['about.idealCustomers'] = 'Please describe who you want to reach.';
  if (blank(x.differentiator)) e['about.differentiator'] = 'Please tell us what sets you apart.';
  return e;
}

function validateContact(a) {
  const e = {};
  const x = a.contact;
  if (blank(x.publicEmail) && blank(x.publicPhone) && blank(x.whatsapp)) {
    e['contact.any'] = 'Please give at least one way for customers to reach you: email, phone or WhatsApp.';
  }
  if (!blank(x.publicEmail) && !isEmail(x.publicEmail)) e['contact.publicEmail'] = 'That email address does not look right.';
  if (!blank(x.publicPhone) && !isPhone(x.publicPhone)) e['contact.publicPhone'] = 'That phone number does not look right.';
  if (!blank(x.whatsapp) && !isPhone(x.whatsapp)) e['contact.whatsapp'] = 'That WhatsApp number does not look right.';
  if (x.showMap && blank(x.address)) e['contact.address'] = 'Please add the address so we can show the map.';
  for (const [k] of DAYS) {
    const h = x.hours[k];
    if (h.open && (!h.from || !h.to || h.from >= h.to)) e[`contact.hours.${k}`] = 'Closing time must be after opening time.';
  }
  for (const [k, label] of SOCIALS) {
    if (!blank(x.social[k]) && !isUrl(x.social[k])) e[`contact.social.${k}`] = `Please paste the full ${label} link.`;
  }
  return e;
}

function validateServices(a) {
  const e = {};
  const { items, cta } = a.services;
  if (items.length < 1) e['services.items'] = 'Please add at least one service or product.';
  items.forEach((it, i) => {
    if (blank(it.name)) e[`services.items.${i}.name`] = 'Please give this a name.';
    if (blank(it.description)) e[`services.items.${i}.description`] = 'Please add a short description.';
    else if (len(it.description) > 200) e[`services.items.${i}.description`] = 'Please keep this to 200 characters or fewer.';
  });
  if (items.length > MAX_SERVICES) e['services.items'] = `You can add up to ${MAX_SERVICES}.`;
  if (blank(cta.type)) e['services.cta.type'] = 'Please choose the main button for your site.';
  return e;
}

function validateBrand(a) {
  const e = {};
  const b = a.brand;
  if (!b.noLogo && !b.logo) e['brand.logo'] = 'Please upload your logo, or tick "I do not have a logo".';
  for (const k of ['primary', 'secondary', 'accent']) {
    if (!b.autoColors && !isHex(b.colors[k])) e[`brand.colors.${k}`] = 'Please use a hex colour such as #0097b2.';
  }
  if (blank(b.background)) e['brand.background'] = 'Please choose a background style.';
  if (blank(b.fontStyle)) e['brand.fontStyle'] = 'Please pick a font style, or "No preference".';
  if (blank(b.iconStyle)) e['brand.iconStyle'] = 'Please pick an icon style, or "No preference".';
  if (b.vibe.length < 1) e['brand.vibe'] = 'Please pick at least one (up to 3).';
  if (b.vibe.length > MAX_VIBES) e['brand.vibe'] = `Please pick no more than ${MAX_VIBES}.`;
  return e;
}

function validateContent(a) {
  const e = {};
  a.content.testimonials.forEach((t, i) => {
    const hasName = !blank(t.name);
    const hasQuote = !blank(t.quote);
    if (hasName !== hasQuote) e[`content.testimonials.${i}`] = 'Please fill in both the name and the quote, or remove this one.';
  });
  return e;
}

function validateExtras(a) {
  const e = {};
  const x = a.extras;
  x.references.forEach((r, i) => {
    if (!blank(r.url) && !isUrl(r.url)) e[`extras.references.${i}.url`] = 'Please paste a full website link.';
  });
  if (!blank(x.existingUrl) && !isUrl(x.existingUrl)) e['extras.existingUrl'] = 'Please paste a full website link.';
  if (blank(x.domainMode)) e['extras.domainMode'] = 'Please tell us about your domain.';
  if (x.domainMode === 'owned' && blank(x.ownedDomain)) e['extras.ownedDomain'] = 'Please enter your domain, for example mybusiness.co.za.';
  if (x.domainMode === 'need' && blank(x.preferredDomains[0])) e['extras.preferredDomains'] = 'Please give at least your first choice.';
  return e;
}

function validateReview(a) {
  const e = {};
  if (!a.consent.terms) e['consent.terms'] = 'Please agree to the terms to continue.';
  if (!a.consent.popia) e['consent.popia'] = 'We need your consent to store your details and files.';
  return e;
}

const VALIDATORS = [validateAbout, validateContact, validateServices, validateBrand, validateContent, validateExtras, validateReview];

export function validateStep(index, answers) {
  return VALIDATORS[index](answers);
}

export function validateAll(answers) {
  const errors = {};
  VALIDATORS.forEach((fn) => Object.assign(errors, fn(answers)));
  return errors;
}

// Which step does an error path belong to? Used to jump back from Review.
export function stepForPath(path) {
  const head = path.split('.')[0];
  const map = { about: 0, contact: 1, services: 2, brand: 3, content: 4, extras: 5, consent: 6 };
  return map[head] ?? 0;
}
