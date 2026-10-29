'use client';

import { useState } from 'react';
import { BRAND, TextField, TextAreaField } from '@/components/websites/ui';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// Standalone review page (/review). Short on purpose so people actually finish it.
export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!rating) errs.rating = 'Please choose a star rating.';
    if (!name.trim()) errs.name = 'Please enter your name.';
    if (message.trim().length < 10) errs.message = 'Please write at least 10 characters.';
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await fetch('/api/websites/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, business, rating, message, website: honeypot }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
      setDone(true);
    } catch (err) { setServerError(err.message); } finally { setBusy(false); }
  }

  const shown = hover || rating;

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${BRAND.black} 0%, #1a0b4d 55%, ${BRAND.purple} 100%)`, padding: '32px 16px 64px', fontFamily: "'Open Sans', sans-serif" }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-block', color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', textDecoration: 'none', marginBottom: 20 }}>← Laska Legacy</a>
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', boxShadow: '0 30px 60px rgba(0,0,0,.35)' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 8 }} aria-hidden="true">🎉</div>
              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, margin: '0 0 10px' }}>Thank you, {name.trim().split(/\s+/)[0]}!</h1>
              <p style={{ color: BRAND.grey, lineHeight: 1.6, margin: '0 0 24px' }}>Your review has been sent. It will appear on our website once we have had a look at it.</p>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 52, padding: '0 28px', borderRadius: 100, background: BRAND.purple, color: '#fff', fontWeight: 800, textDecoration: 'none' }}>Back to the website</a>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, margin: '0 0 6px', lineHeight: 1.1 }}>Leave a review</h1>
              <p style={{ color: BRAND.grey, margin: '0 0 24px', lineHeight: 1.5 }}>It takes less than a minute. Thank you for helping us grow.</p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>How was your experience? <span style={{ color: BRAND.red }}>*</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} star${n === 1 ? '' : 's'}`} aria-pressed={rating === n}
                      onClick={() => setRating(n)} onMouseEnter={() => setHover(n)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 40, lineHeight: 1, color: n <= shown ? '#f5a623' : BRAND.greyLight, minWidth: 44, minHeight: 48 }}>★</button>
                  ))}
                  <span style={{ marginLeft: 8, fontWeight: 700, color: BRAND.grey, fontSize: 14 }}>{LABELS[shown]}</span>
                </div>
                {errors.rating && <p role="alert" style={{ fontSize: 13, color: BRAND.red, margin: '4px 0 0', fontWeight: 600 }}>{errors.rating}</p>}
              </div>

              <TextField label="Your name" required value={name} onChange={setName} maxLength={80} error={errors.name} />
              <TextField label="Business or horse (optional)" value={business} onChange={setBusiness} maxLength={100} />
              <TextAreaField label="Your review" required value={message} onChange={setMessage} maxLength={1000} rows={5} error={errors.message} placeholder="Tell us what you liked..." />

              {/* Honeypot: hidden from people, bots fill it in */}
              <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
                <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
              </div>

              {serverError && <p role="alert" style={{ color: BRAND.red, fontWeight: 700, fontSize: 14, margin: '0 0 12px' }}>{serverError}</p>}
              <button type="submit" disabled={busy} style={{ width: '100%', minHeight: 56, borderRadius: 100, border: 'none', background: BRAND.purple, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}>{busy ? 'Sending...' : 'Submit review'}</button>
              <p style={{ fontSize: 12, color: BRAND.grey, textAlign: 'center', margin: '12px 0 0', lineHeight: 1.5 }}>By submitting you agree that your name and review may be shown on our website.</p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
