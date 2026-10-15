// Helpers for rich text blog posts. Browser only (DOMPurify needs a DOM).
import DOMPurify from 'dompurify';

export const FONT_FAMILIES = [
  ['Inter', 'Inter'],
  ['Montserrat', 'Montserrat'],
  ['Playfair Display', 'Playfair Display'],
  ['Lora', 'Lora'],
  ['Merriweather', 'Merriweather'],
  ['Oswald', 'Oswald'],
  ['Dancing Script', 'Dancing Script'],
  ['Georgia', 'Georgia'],
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48];

const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'a', 'img', 'span', 'div', 'hr', 'font', 'sub', 'sup', 'pre', 'code',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'style', 'width', 'height', 'color', 'size', 'face'];
const OK_STYLE_PROPS = new Set([
  'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style',
  'text-decoration', 'text-decoration-line', 'text-align', 'line-height', 'letter-spacing',
]);

let hooked = false;
function ensureHooks() {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Keep only harmless typography from inline styles (no url(), no layout tricks).
    if (node.hasAttribute && node.hasAttribute('style')) {
      const kept = (node.getAttribute('style') || '')
        .split(';')
        .map((d) => d.trim())
        .filter((d) => {
          const i = d.indexOf(':');
          if (i < 1) return false;
          const prop = d.slice(0, i).trim().toLowerCase();
          const val = d.slice(i + 1).trim().toLowerCase();
          return OK_STYLE_PROPS.has(prop) && !/url\(|expression|javascript|[<>]/.test(val);
        });
      if (kept.length) node.setAttribute('style', kept.join('; '));
      else node.removeAttribute('style');
    }
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    if (node.tagName === 'IMG') node.setAttribute('loading', 'lazy');
  });
}

export function stripTags(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sanitizeHtml(html) {
  if (typeof window === 'undefined' || !DOMPurify.isSupported) return stripTags(html);
  ensureHooks();
  return DOMPurify.sanitize(String(html || ''), { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/)/i });
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Posts written before the editor was added are plain text with "#" / "##" headings.
export function isHtmlBody(body) {
  return /<(p|h[1-4]|div|ul|ol|blockquote|img|br|span|strong|em)[\s>/]/i.test(String(body || ''));
}

export function legacyToHtml(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((t) => {
      if (t.startsWith('## ')) return `<h2>${escapeHtml(t.slice(3))}</h2>`;
      if (t.startsWith('# ')) return `<h2>${escapeHtml(t.slice(2))}</h2>`;
      return `<p>${escapeHtml(t)}</p>`;
    })
    .join('');
}

// Body as safe HTML, whether it was written in the old plain text style or the new editor.
export function bodyToSafeHtml(body) {
  const raw = String(body || '');
  return sanitizeHtml(isHtmlBody(raw) ? raw : legacyToHtml(raw));
}

export function plainText(body) {
  const raw = String(body || '');
  return stripTags(isHtmlBody(raw) ? raw : raw.replace(/^#{1,2}\s+/gm, ''));
}

export function excerptOf(post, max = 170) {
  const manual = String(post.excerpt || '').trim();
  if (manual) return manual;
  const t = plainText(post.body);
  return t.length > max ? `${t.slice(0, max).replace(/\s+\S*$/, '')}…` : t;
}

export function readingMinutes(body) {
  const words = plainText(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Never returns "Invalid Date": an unusable value gives an empty string.
export function formatPostDate(value, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA', opts);
}
