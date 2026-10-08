// One real URL per shop tab, so any tab can be shared as a link.
// key = the internal page name used by components/LaskaLegacy.jsx
export const TAB_PATHS = {
  home: '/',
  shop: '/shop',
  sale: '/sale',
  horses: '/horses',
  about: '/about',
  gallery: '/gallery',
  blog: '/blog',
  order: '/order',
  websites: '/webadd',
  contact: '/contact',
};

export const PATH_TABS = Object.fromEntries(Object.entries(TAB_PATHS).map(([k, v]) => [v, k]));

// Share-preview text for each URL (slug = path without the slash). 'home' and 'webadd' have their own route files.
export const TAB_META = {
  shop: ['Shop', 'Handcrafted stock bridles, breastplates, paracord reins and canvas bags. Made in South Africa.'],
  sale: ['Sale', 'Laska Legacy sale. Handcrafted leather and canvas for horse and rider while stocks last.'],
  horses: ['Horses', 'Meet the horses behind Laska Legacy.'],
  about: ['About', 'The story behind Laska Legacy: handcrafted leather and canvas for horse and rider.'],
  gallery: ['Gallery', 'See Laska Legacy tack and canvas in action.'],
  blog: ['Blog | Between the Poles', 'Stories, tips and news from Laska Legacy.'],
  order: ['Order', 'Place an order with Laska Legacy.'],
  contact: ['Contact', 'Get in touch with Laska Legacy on WhatsApp, email, Instagram or TikTok.'],
};

export const TAB_SLUGS = Object.keys(TAB_META);
