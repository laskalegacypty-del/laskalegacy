'use client';

import { useEffect, useState } from 'react';
import { BRAND } from '@/components/websites/ui';

export const REVIEW_PATH = '/review';

export function Stars({ value, size = 18 }) {
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} style={{ display: 'inline-flex', gap: 2, fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ color: n <= Math.round(value) ? '#f5a623' : BRAND.greyLight }}>★</span>)}
    </span>
  );
}

const fmt = (iso) => new Date(iso).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
const EMPTY = { reviews: [], count: 0, average: 0 };

// Approved reviews, shown on the home page and the Websites page. Always offers the "write a review" link.
export default function ReviewsPanel({ background = BRAND.offWhite }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let live = true;
    fetch('/api/websites/reviews')
      .then((r) => r.json())
      .then((j) => { if (live) setData(j.reviews ? j : EMPTY); })
      .catch(() => { if (live) setData(EMPTY); });
    return () => { live = false; };
  }, []);

  const reviews = data?.reviews || [];

  return (
    <section style={{ padding: '72px 24px', background }}>
      <style>{`.rv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:18px } .rv-btn { display:inline-flex; align-items:center; justify-content:center; min-height:52px; padding:0 28px; border-radius:100px; background:${BRAND.purple}; color:#fff; font-family:'Montserrat',sans-serif; font-weight:800; font-size:15px; text-decoration:none; box-shadow:0 8px 24px ${BRAND.purple}44; transition:transform .15s } .rv-btn:hover { transform:translateY(-2px) }`}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: BRAND.teal, fontWeight: 800, marginBottom: 10 }}>Reviews</div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 5vw, 40px)', margin: '0 0 12px', color: BRAND.black, lineHeight: 1.1 }}>What our customers say</h2>
          {data?.count > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: BRAND.grey, fontWeight: 700, fontSize: 15 }}>
              <Stars value={data.average} size={22} />
              <span>{data.average.toFixed(1)} from {data.count} review{data.count === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>

        {data && !reviews.length && (
          <p style={{ textAlign: 'center', color: BRAND.grey, fontSize: 15, margin: '0 0 28px' }}>No reviews yet. Be the first to share your experience.</p>
        )}

        {reviews.length > 0 && (
          <div className="rv-grid">
            {reviews.slice(0, 6).map((r) => (
              <figure key={r.id} style={{ margin: 0, background: '#fff', borderRadius: 18, padding: '22px 22px 20px', boxShadow: '0 8px 24px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Stars value={r.rating} />
                <blockquote style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: BRAND.black, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.message}</blockquote>
                <figcaption style={{ marginTop: 'auto', fontSize: 13, color: BRAND.grey }}>
                  <strong style={{ color: BRAND.black }}>{r.name}</strong>{r.business ? `, ${r.business}` : ''} · {fmt(r.created_at)}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a className="rv-btn" href={REVIEW_PATH}>Write a review</a>
        </div>
      </div>
    </section>
  );
}
