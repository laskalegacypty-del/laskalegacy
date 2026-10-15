// Readable, shareable post addresses: /blog/<title-words>-<first 8 chars of the id>
// No database change needed: the 8 character tail identifies the post. Old /blog/<full id> links still work.

export function slugify(title) {
  let slug = String(title || 'post')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length > 60) {
    slug = slug.slice(0, 60);
    const cut = slug.lastIndexOf('-');
    if (cut > 30) slug = slug.slice(0, cut); // end on a whole word
  }
  return slug.replace(/-+$/g, '') || 'post';
}

export const postPath = (post) => `/blog/${slugify(post.title)}-${String(post.id).slice(0, 8)}`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ref is the last part of the address. Returns { id } (full id) or { short } (first 8 chars), or null.
export function parsePostRef(ref) {
  const r = String(ref || '').toLowerCase();
  if (UUID.test(r)) return { id: r };
  const m = r.match(/(?:^|-)([0-9a-f]{8})$/);
  return m ? { short: m[1] } : null;
}

export function findPost(posts, ref) {
  const p = parsePostRef(ref);
  if (!p) return null;
  return posts.find((x) => (p.id ? x.id === p.id : String(x.id).startsWith(p.short))) || null;
}
