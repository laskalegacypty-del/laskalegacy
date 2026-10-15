import { createClient } from '@supabase/supabase-js';
import Post from './Post';

// Rendered on demand so a new post is shareable the moment it is published,
// and the link preview (WhatsApp, Facebook) shows the post's own title, summary and cover photo.
export const dynamic = 'force-dynamic';

const SITE = 'https://www.laskalegacy.co.za';

async function loadPost(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data } = await supabase.from('blog_posts').select('id, title, excerpt, body, cover_image').eq('id', id).maybeSingle();
  return data;
}

const plain = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export async function generateMetadata({ params }) {
  const post = await loadPost(params.id);
  if (!post) return { title: 'Laska Legacy | Blog' };
  const description = (post.excerpt || plain(post.body)).slice(0, 180);
  const title = `${post.title} | Laska Legacy`;
  const url = `${SITE}/blog/${post.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}) },
    twitter: { card: post.cover_image ? 'summary_large_image' : 'summary', title, description, ...(post.cover_image ? { images: [post.cover_image] } : {}) },
  };
}

export default function BlogPostPage({ params }) {
  return <Post id={params.id} />;
}
