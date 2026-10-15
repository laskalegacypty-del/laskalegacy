'use client';

import { useMemo, useState } from 'react';
import { bodyToSafeHtml, excerptOf, formatPostDate, readingMinutes } from '@/lib/richtext';

const C = { teal: '#0097b2', purple: '#5e17eb', black: '#000', grey: '#6b7280', line: '#e5e7eb', off: '#f7f8fa' };

const CSS = `
  .bp-hero { position:relative; width:100%; height:clamp(280px, 52vw, 520px); background:#111; overflow:hidden }
  .bp-hero img { width:100%; height:100%; object-fit:cover; display:block }
  .bp-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.2) 40%, rgba(0,0,0,.78) 100%) }
  .bp-hero-text { position:absolute; left:0; right:0; bottom:0; z-index:2; padding:0 24px 36px }
  .bp-body { font-size:17px; line-height:1.85; color:#374151; word-wrap:break-word }
  .bp-body p { margin:0 0 20px }
  .bp-body h1, .bp-body h2 { font-family:Montserrat,sans-serif; font-weight:800; color:#000; line-height:1.25; margin:40px 0 14px }
  .bp-body h1 { font-size:32px } .bp-body h2 { font-size:25px }
  .bp-body h3 { font-family:Montserrat,sans-serif; font-weight:700; font-size:20px; color:#000; margin:30px 0 10px }
  .bp-body a { color:#0097b2; text-decoration:underline; text-underline-offset:3px }
  .bp-body blockquote { margin:28px 0; padding:10px 22px; border-left:4px solid #0097b2; background:#f7f8fa; font-style:italic; color:#4b5563; border-radius:0 8px 8px 0 }
  .bp-body img { max-width:100%; height:auto; border-radius:12px; margin:14px 0; display:block }
  .bp-body ul, .bp-body ol { padding-left:28px; margin:0 0 20px }
  .bp-body li { margin-bottom:6px }
  .bp-body hr { border:none; border-top:2px solid #e5e7eb; margin:34px 0 }
  .bp-body > p:first-child::first-letter { font-family:Montserrat,sans-serif; }
  .bp-share a, .bp-share button { display:inline-flex; align-items:center; justify-content:center; min-height:42px; padding:0 18px; border-radius:100px; font-size:13px; font-weight:700; text-decoration:none; cursor:pointer; border:none; font-family:inherit }
  .bp-more { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:18px }
  @media (max-width:640px) { .bp-body { font-size:16px } .bp-hero-text { padding-bottom:24px } }
`;

function videoEmbed(url, i) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (yt) {
    return (
      <div key={i} style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        <iframe src={`https://www.youtube.com/embed/${yt[1]}`} title={`Video ${i + 1}`} allowFullScreen loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
      </div>
    );
  }
  return (
    <div key={i} style={{ borderRadius: 12, background: C.off, padding: 18, textAlign: 'center' }}>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontWeight: 700, fontSize: 14 }}>Watch video →</a>
    </div>
  );
}

export default function BlogPostView({ post, posts = [], onBack, onOpen, onLightbox }) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => bodyToSafeHtml(post.body), [post.body]);
  const date = formatPostDate(post.date);
  const mins = readingMinutes(post.body);
  const more = useMemo(() => posts.filter((p) => p.id !== post.id).slice(0, 3), [posts, post.id]);

  const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${post.id}` : `https://www.laskalegacy.co.za/blog/${post.id}`;
  const shareText = `${post.title} | Laska Legacy`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Copy this link', url); }
  };

  const meta = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
      {date && <span>{date}</span>}
      {date && <span aria-hidden="true" style={{ opacity: 0.5 }}>•</span>}
      <span>{mins} min read</span>
    </div>
  );

  const backBtn = (light) => (
    <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: light ? 'rgba(0,0,0,.45)' : 'none', border: 'none', cursor: 'pointer', color: light ? '#fff' : C.grey, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: light ? '10px 16px' : 0, borderRadius: 100 }}>
      ← Back to Blog
    </button>
  );

  return (
    <article className="fade-in">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {post.coverImage ? (
        <header className="bp-hero">
          <img src={post.coverImage} alt={post.title} />
          <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 3 }}>{backBtn(true)}</div>
          <div className="bp-hero-text">
            <div style={{ maxWidth: 760, margin: '0 auto', color: '#fff' }}>
              <div style={{ color: '#7fe3f5', marginBottom: 12 }}>{meta}</div>
              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(28px, 5.5vw, 48px)', fontWeight: 900, lineHeight: 1.12, margin: 0, textShadow: '0 2px 18px rgba(0,0,0,.4)' }}>{post.title}</h1>
            </div>
          </div>
        </header>
      ) : (
        <header style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 0' }}>
          <div style={{ marginBottom: 28 }}>{backBtn(false)}</div>
          <div style={{ color: C.teal, marginBottom: 12 }}>{meta}</div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(28px, 5.5vw, 44px)', fontWeight: 900, lineHeight: 1.15, margin: 0, color: C.black }}>{post.title}</h1>
        </header>
      )}

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px 72px' }}>
        {post.excerpt && (
          <p style={{ fontSize: 20, lineHeight: 1.6, color: '#4b5563', fontWeight: 500, margin: '0 0 28px', paddingBottom: 28, borderBottom: `1px solid ${C.line}` }}>{post.excerpt}</p>
        )}

        <div className="bp-body" dangerouslySetInnerHTML={{ __html: html }} />

        {post.images?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, margin: '36px 0' }}>
            {post.images.map((img, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: 'hidden', cursor: 'zoom-in', background: C.off }} onClick={() => onLightbox?.({ src: img, caption: '' })}>
                <img src={img} alt={`${post.title}, photo ${i + 1}`} loading="lazy" style={{ width: '100%', display: 'block' }} />
              </div>
            ))}
          </div>
        )}

        {post.videos?.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 20, margin: '36px 0' }}>{post.videos.map(videoEmbed)}</div>}

        {/* Share */}
        <div style={{ marginTop: 48, padding: '22px 24px', background: C.off, borderRadius: 16 }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Enjoyed this? Share it</div>
          <div className="bp-share" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: '#fff' }}>WhatsApp</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#1877f2', color: '#fff' }}>Facebook</a>
            <button onClick={copy} style={{ background: '#fff', color: C.black, border: `1.5px solid ${C.line}` }}>{copied ? 'Link copied ✓' : 'Copy link'}</button>
          </div>
        </div>

        {/* More posts */}
        {more.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 18px' }}>More from Between the Poles</h2>
            <div className="bp-more">
              {more.map((p) => (
                <div key={p.id} onClick={() => onOpen?.(p)} style={{ cursor: 'pointer', borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.line}`, background: '#fff' }}>
                  {p.coverImage ? <img src={p.coverImage} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ aspectRatio: '16/10', background: `linear-gradient(135deg, ${C.teal}, ${C.purple})` }} />}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: C.teal, marginBottom: 6 }}>{formatPostDate(p.date, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: C.grey, marginTop: 6, lineHeight: 1.5 }}>{excerptOf(p, 90)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
