'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BACKGROUNDS, CTA_TYPES, DAYS, FONT_STYLES, ICON_STYLES, INDUSTRIES, LOGO_TYPES, MAX_GALLERY, MAX_REFERENCES,
  MAX_SERVICES, MAX_TESTIMONIALS, MAX_VIBES, PHOTO_TYPES, PRICE_ZAR, PROVINCES, SOCIALS, STEPS, VIBES,
  emptyAnswers, isHex, stepForPath, validateStep,
} from '@/lib/websites/schema';
import { formatHours } from '@/lib/websites/build';
import {
  BRAND, ChoiceChip, CheckField, Field, GalleryUpload, ImageUpload, SelectField, TextAreaField, TextField,
  inputStyle, smallBtn,
} from '@/components/websites/ui';

const STORAGE_KEY = 'laska-website-intake-v1';

// ─── helpers ───

function setIn(obj, path, value) {
  const [head, ...rest] = path;
  const next = Array.isArray(obj) ? [...obj] : { ...obj };
  next[head] = rest.length ? setIn(obj[head], rest, value) : value;
  return next;
}

// Merge saved answers onto the current empty shape so fields added later never crash an old draft.
function mergeDeep(base, saved) {
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    if (saved && typeof saved === 'object') for (const k of Object.keys(base)) if (k in saved) out[k] = mergeDeep(base[k], saved[k]);
    return out;
  }
  return saved === undefined || saved === null ? base : saved;
}

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });
}

const card = { background: BRAND.white, borderRadius: 16, padding: '24px 20px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' };
const primaryBtn = (disabled) => ({
  minHeight: 52, padding: '14px 28px', borderRadius: 12, border: 'none', background: disabled ? BRAND.grey : BRAND.teal, color: BRAND.white,
  fontWeight: 800, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", letterSpacing: 0.5,
});
const ghostBtn = { ...primaryBtn(false), background: BRAND.white, color: BRAND.black, border: `1.5px solid ${BRAND.greyLight}` };
const h2 = { fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 800, color: BRAND.black, margin: '0 0 6px' };
const lead = { fontSize: 14, color: BRAND.grey, margin: '0 0 24px', lineHeight: 1.55 };
const sub = { fontFamily: "'Montserrat', sans-serif", fontSize: 15, fontWeight: 800, margin: '28px 0 12px', color: BRAND.black };

// ─── main component ───

export default function WebsiteIntake() {
  const [a, setA] = useState(emptyAnswers);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submissionId, setSubmissionId] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | form | submitting | pay | paid
  const [submitError, setSubmitError] = useState('');
  const [pay, setPay] = useState(null);
  const [saved, setSaved] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const topRef = useRef(null);

  // Restore draft, or handle a return from PayFast.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidId = params.get('paid');
    const cancelledId = params.get('cancelled');
    if (paidId) { setSubmissionId(paidId); setPhase('paid'); return; }
    if (cancelledId) {
      setSubmissionId(cancelledId); setPhase('submitting');
      fetch('/api/websites/payfast/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cancelledId }) })
        .then((r) => r.json())
        .then((j) => { if (j.paid) setPhase('paid'); else if (j.pay) { setPay(j.pay); setPhase('pay'); } else throw new Error(j.error); })
        .catch(() => { setSubmitError('We could not reload your payment. Please email us and we will send a fresh link.'); setPhase('form'); });
      return;
    }
    let id = '';
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw?.answers) { setA(mergeDeep(emptyAnswers(), raw.answers)); setStep(Math.min(raw.step || 0, STEPS.length - 1)); id = raw.submissionId || ''; }
    } catch { /* storage unavailable or corrupt: start fresh */ }
    setSubmissionId(id || newId());
    setPhase('form');
  }, []);

  // Autosave (debounced).
  useEffect(() => {
    if (phase !== 'form' || !submissionId) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ submissionId, answers: a, step })); setSaved(true); } catch { /* ignore */ }
    }, 600);
    return () => clearTimeout(t);
  }, [a, step, submissionId, phase]);

  const up = useCallback((path, value) => {
    setA((prev) => setIn(prev, path, value));
    setErrors((prev) => { const k = path.join('.'); if (!(k in prev)) return prev; const { [k]: _gone, ...rest } = prev; return rest; });
  }, []);
  const err = (path) => errors[path];

  function scrollTop() { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  function next() {
    const e = validateStep(step, a);
    setErrors(e);
    if (Object.keys(e).length) { setTimeout(() => document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); return; }
    setStep((s) => s + 1); scrollTop();
  }
  function back() { setStep((s) => Math.max(0, s - 1)); scrollTop(); }
  function goTo(i) { setStep(i); setErrors({}); scrollTop(); }

  async function submit() {
    const e = validateStep(STEPS.length - 1, a);
    setErrors(e);
    if (Object.keys(e).length) return;
    setPhase('submitting'); setSubmitError('');
    try {
      const res = await fetch('/api/websites/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, answers: a, website: honeypot }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 422 && json.errors) { setErrors(json.errors); setStep(json.step ?? stepForPath(Object.keys(json.errors)[0])); setPhase('form'); setSubmitError('Please fix the highlighted answers.'); scrollTop(); return; }
      if (!res.ok) throw new Error(json.error || 'Submission failed.');
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      if (!json.pay) { setPhase('paid'); return; } // honeypot tripped: nothing to pay
      setPay(json.pay); setPhase('pay'); scrollTop();
    } catch (ex) {
      setSubmitError(ex.message || 'Something went wrong. Please try again.');
      setPhase('form');
    }
  }

  function startOver() {
    if (!confirm('Clear everything you have entered and start again?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setA(emptyAnswers()); setStep(0); setErrors({}); setSubmissionId(newId()); setSaved(false);
  }

  const common = { a, up, err, submissionId };
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div style={{ minHeight: '100vh', background: BRAND.offWhite, fontFamily: "'Inter', sans-serif", color: BRAND.black }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url(https://fonts.googleapis.com/css2?family=Archivo+Black&family=Dancing+Script:wght@700&family=JetBrains+Mono:wght@700&family=Nunito:wght@800&family=Playfair+Display:wght@700&display=swap);
        @keyframes wsFade { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        .ws-in { animation: wsFade .3s ease both }
        .ws-hp { position:absolute !important; left:-9999px !important; width:1px; height:1px; overflow:hidden }
        .ws-btn:active { transform: scale(.98) }
        input:focus, select:focus, textarea:focus, button:focus-visible { outline: 3px solid ${BRAND.teal}55; outline-offset: 1px }
        .ws-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px }
        @media (max-width:560px) { .ws-grid2 { grid-template-columns:1fr } .ws-steps-label { display:none } }
      ` }} />

      <header style={{ background: BRAND.black, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo-white.png" alt="Laska Legacy" style={{ height: 32 }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: BRAND.white, letterSpacing: 1, fontSize: 15 }}>LASKA LEGACY</span>
        </a>
        <a href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}>Back to shop</a>
      </header>

      <div ref={topRef} style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px 80px' }}>
        {/* Pitch */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: BRAND.teal, fontWeight: 800 }}>Websites by Laska Legacy</div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: 900, margin: '8px 0 10px', lineHeight: 1.15 }}>
            Your business online for <span style={{ color: BRAND.purple }}>R{PRICE_ZAR}</span>
          </h1>
          <p style={{ fontSize: 15, color: BRAND.grey, lineHeight: 1.6, margin: '0 auto', maxWidth: 520 }}>
            A clean, fast one page website that works on phones. Fill in the form below (about 10 minutes), pay once, and we build it.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 14 }}>
            {[`R${PRICE_ZAR} once off`, 'One page', 'One round of changes included', 'Fast turnaround'].map((t) => (
              <span key={t} style={{ background: BRAND.tealLight, color: BRAND.tealDark, fontWeight: 700, fontSize: 12.5, padding: '6px 12px', borderRadius: 999 }}>{t}</span>
            ))}
          </div>
        </div>

        {phase === 'loading' && <div style={{ ...card, textAlign: 'center', color: BRAND.grey }}>Loading your form...</div>}

        {phase === 'paid' && (
          <div className="ws-in" style={{ ...card, textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <h2 style={h2}>Thank you!</h2>
            <p style={{ ...lead, margin: '0 auto', maxWidth: 440 }}>
              Your brief is in. We will send you a payment link for the once off R{PRICE_ZAR} shortly (by email or WhatsApp), and we start building as soon as it is paid.
            </p>
            <a href="/" style={{ ...primaryBtn(false), display: 'inline-block', textDecoration: 'none', marginTop: 20 }}>Back to the shop</a>
          </div>
        )}

        {phase === 'pay' && pay && <PayScreen pay={pay} name={a.about.fullName} business={a.about.businessName} />}

        {(phase === 'form' || phase === 'submitting') && (
          <>
            {/* Progress */}
            <div style={{ marginBottom: 16 }} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                <span>Step {step + 1} of {STEPS.length}: {STEPS[step].title}</span>
                <span style={{ color: BRAND.grey }}>{saved ? 'Progress saved' : ''}</span>
              </div>
              <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 10, background: BRAND.greyLight, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${BRAND.teal}, ${BRAND.purple})`, transition: 'width .3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {STEPS.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => i < step && goTo(i)} disabled={i >= step} aria-label={`Go to ${s.title}`}
                    style={{ flex: 1, background: 'none', border: 'none', padding: '4px 0', minHeight: 32, cursor: i < step ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: i <= step ? BRAND.tealDark : BRAND.grey }}>
                    <span style={{ display: 'inline-block', width: 22, height: 22, lineHeight: '22px', borderRadius: 11, background: i <= step ? BRAND.teal : BRAND.greyLight, color: i <= step ? '#fff' : BRAND.grey, fontSize: 11 }}>{i < step ? '✓' : i + 1}</span>
                    <span className="ws-steps-label" style={{ display: 'block', marginTop: 2 }}>{s.short}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ws-in" key={step} style={card}>
              {/* Honeypot: hidden from people, irresistible to bots */}
              <div className="ws-hp" aria-hidden="true">
                <label>Leave this empty<input tabIndex={-1} autoComplete="off" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
              </div>

              {step === 0 && <StepAbout {...common} />}
              {step === 1 && <StepContact {...common} />}
              {step === 2 && <StepServices {...common} />}
              {step === 3 && <StepBrand {...common} />}
              {step === 4 && <StepContent {...common} />}
              {step === 5 && <StepExtras {...common} />}
              {step === 6 && <StepReview {...common} goTo={goTo} />}

              {submitError && <p role="alert" style={{ color: BRAND.red, fontWeight: 700, fontSize: 14, marginTop: 8 }}>{submitError}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'space-between' }}>
                <button type="button" className="ws-btn" onClick={back} disabled={step === 0 || phase === 'submitting'} style={{ ...ghostBtn, visibility: step === 0 ? 'hidden' : 'visible' }}>Back</button>
                {step < STEPS.length - 1 ? (
                  <button type="button" className="ws-btn" onClick={next} style={primaryBtn(false)}>Next</button>
                ) : (
                  <button type="button" className="ws-btn" onClick={submit} disabled={phase === 'submitting'} style={primaryBtn(phase === 'submitting')}>
                    {phase === 'submitting' ? 'Sending...' : 'Submit my details'}
                  </button>
                )}
              </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={startOver} style={{ background: 'none', border: 'none', color: BRAND.grey, fontSize: 12.5, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }}>Clear form and start over</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pay screen ───

function PayScreen({ pay, name, business }) {
  const [going, setGoing] = useState(false);
  const formRef = useRef(null);
  return (
    <div className="ws-in" style={{ ...card, textAlign: 'center', padding: '36px 24px' }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <h2 style={h2}>Your details are in{business ? `, ${business}` : ''}</h2>
      <p style={{ ...lead, margin: '0 auto 20px', maxWidth: 460 }}>
        {name ? `${name.split(' ')[0]}, one` : 'One'} last step. Pay the once off R{PRICE_ZAR} and we start building. Work begins as soon as payment is confirmed. We have emailed you a confirmation.
      </p>
      {pay.sandbox && (
        <p style={{ background: '#fef3c7', color: '#92400e', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, margin: '0 auto 20px', maxWidth: 460 }}>
          Test mode: this goes to the PayFast sandbox and no real money is taken.
        </p>
      )}
      <form ref={formRef} action={pay.action} method="post" onSubmit={() => setGoing(true)}>
        {pay.fields.map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <button type="submit" disabled={going} className="ws-btn" style={{ ...primaryBtn(going), width: '100%', maxWidth: 360, fontSize: 18 }}>
          {going ? 'Taking you to PayFast...' : `Pay R${PRICE_ZAR} to start`}
        </button>
      </form>
      <p style={{ fontSize: 12.5, color: BRAND.grey, marginTop: 14 }}>Secure payment by PayFast. You will return here afterwards.</p>
    </div>
  );
}

// ─── Step 1: About ───

function StepAbout({ a, up, err }) {
  const x = a.about;
  const set = (k) => (v) => up(['about', k], v);
  return (
    <>
      <h2 style={h2}>About you and the business</h2>
      <p style={lead}>Tell us who you are and what you do. Plain words are perfect.</p>
      <TextField label="Your full name" required value={x.fullName} onChange={set('fullName')} error={err('about.fullName')} helper="The person we deal with about this website." />
      <div className="ws-grid2">
        <TextField label="Your email" required type="email" inputMode="email" value={x.email} onChange={set('email')} error={err('about.email')} helper="We send your confirmation and updates here." />
        <TextField label="Your phone" required type="tel" inputMode="tel" value={x.phone} onChange={set('phone')} error={err('about.phone')} helper="Include the area code, for example 082 123 4567." />
      </div>
      <TextField label="Business name" required value={x.businessName} onChange={set('businessName')} error={err('about.businessName')} helper="Exactly how you want it written on the site." />
      <TextField label="Tagline or slogan" value={x.tagline} onChange={set('tagline')} helper="A short line under your name, like 'Fresh bread every morning'. Skip it if you do not have one." />
      <SelectField label="Type of business" required value={x.industry} onChange={set('industry')} options={INDUSTRIES} error={err('about.industry')} helper="Pick the closest match." />
      {x.industry === 'Other' && <TextField label="What kind of business is it?" required value={x.industryOther} onChange={set('industryOther')} error={err('about.industryOther')} helper="For example 'mobile car wash'." />}
      <TextField label="Year started" value={x.yearStarted} onChange={set('yearStarted')} inputMode="numeric" maxLength={4} placeholder="2019" error={err('about.yearStarted')} helper="Optional. Shows customers how established you are." />
      <div className="ws-grid2">
        <TextField label="Town or city" required value={x.town} onChange={set('town')} error={err('about.town')} helper="Where you are based." />
        <SelectField label="Province" required value={x.province} onChange={set('province')} options={PROVINCES} error={err('about.province')} />
      </div>
      <TextAreaField label="What does your business do, in 2 to 3 sentences?" required value={x.description} onChange={set('description')} maxLength={500} counter="50 to 500" error={err('about.description')}
        helper="A good answer says what you offer, who for, and where. Example: 'We bake fresh sourdough and custom cakes daily for families and cafes in Stellenbosch.'" />
      <TextAreaField label="Who are your ideal customers?" required rows={3} value={x.idealCustomers} onChange={set('idealCustomers')} error={err('about.idealCustomers')} helper="The people you most want to reach. Example: 'Busy families and local coffee shops.'" />
      <TextAreaField label="What makes you different from competitors?" required rows={3} value={x.differentiator} onChange={set('differentiator')} error={err('about.differentiator')} helper="Why should someone choose you? Think price, quality, service, speed, or experience." />
    </>
  );
}

// ─── Step 2: Contact ───

function StepContact({ a, up, err }) {
  const x = a.contact;
  const set = (k) => (v) => up(['contact', k], v);
  return (
    <>
      <h2 style={h2}>Contact details to show on the site</h2>
      <p style={lead}>These are shown publicly, so use the ones you want customers to use. They can differ from the details you gave in step 1.</p>
      {err('contact.any') && <p role="alert" style={{ color: BRAND.red, fontWeight: 700, fontSize: 14, marginTop: -8 }}>{err('contact.any')}</p>}
      <TextField label="Public email" type="email" inputMode="email" value={x.publicEmail} onChange={set('publicEmail')} error={err('contact.publicEmail')} helper="Where customers should email you." />
      <div className="ws-grid2">
        <TextField label="Public phone" type="tel" inputMode="tel" value={x.publicPhone} onChange={set('publicPhone')} error={err('contact.publicPhone')} helper="For calls." />
        <TextField label="WhatsApp number" type="tel" inputMode="tel" value={x.whatsapp} onChange={set('whatsapp')} error={err('contact.whatsapp')} helper="We turn this into a tap to chat button." />
      </div>
      <TextAreaField label="Physical address" rows={2} value={x.address} onChange={set('address')} error={err('contact.address')} helper="Optional. Leave blank if you work from home or travel to clients." />
      <CheckField checked={x.showMap} onChange={set('showMap')}>Show a map on my site</CheckField>

      <h3 style={sub}>Trading hours (optional)</h3>
      <p style={{ ...lead, marginBottom: 12 }}>Tick the days you are open and set your times.</p>
      {DAYS.map(([k, label]) => {
        const h = x.hours[k];
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10, minHeight: 48 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 130, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={h.open} onChange={(e) => up(['contact', 'hours', k, 'open'], e.target.checked)} style={{ width: 22, height: 22, accentColor: BRAND.teal }} />
              {label}
            </label>
            {h.open ? (
              <>
                <input type="time" aria-label={`${label} opens`} value={h.from} onChange={(e) => up(['contact', 'hours', k, 'from'], e.target.value)} style={{ ...inputStyle(err(`contact.hours.${k}`)), width: 130 }} />
                <span>to</span>
                <input type="time" aria-label={`${label} closes`} value={h.to} onChange={(e) => up(['contact', 'hours', k, 'to'], e.target.value)} style={{ ...inputStyle(err(`contact.hours.${k}`)), width: 130 }} />
              </>
            ) : <span style={{ color: BRAND.grey, fontSize: 13 }}>Closed</span>}
            {err(`contact.hours.${k}`) && <span role="alert" style={{ color: BRAND.red, fontSize: 13, fontWeight: 600, width: '100%' }}>{err(`contact.hours.${k}`)}</span>}
          </div>
        );
      })}

      <h3 style={sub}>Social media (optional)</h3>
      <p style={{ ...lead, marginBottom: 12 }}>Paste the full link to each page you want shown. Skip any you do not use.</p>
      {SOCIALS.map(([k, label]) => (
        <TextField key={k} label={label} value={x.social[k]} onChange={(v) => up(['contact', 'social', k], v)} error={err(`contact.social.${k}`)} placeholder={`https://${k === 'x' ? 'x.com' : `${k}.com`}/yourpage`} inputMode="url" />
      ))}
    </>
  );
}

// ─── Step 3: Services ───

function StepServices({ a, up, err, submissionId }) {
  const items = a.services.items;
  const setItem = (i, k, v) => up(['services', 'items', i, k], v);
  return (
    <>
      <h2 style={h2}>Services or products</h2>
      <p style={lead}>List what you offer, up to {MAX_SERVICES}. Put your best sellers first.</p>
      {err('services.items') && <p role="alert" style={{ color: BRAND.red, fontWeight: 700, fontSize: 14 }}>{err('services.items')}</p>}
      {items.map((it, i) => (
        <div key={i} style={{ border: `1.5px solid ${BRAND.greyLight}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 14 }}>Item {i + 1}</strong>
            {items.length > 1 && <button type="button" style={smallBtn} onClick={() => up(['services', 'items'], items.filter((_, j) => j !== i))}>Remove</button>}
          </div>
          <TextField label="Name" required value={it.name} onChange={(v) => setItem(i, 'name', v)} error={err(`services.items.${i}.name`)} helper="For example 'Sourdough loaf' or 'Full car valet'." />
          <TextAreaField label="Short description" required rows={2} maxLength={200} counter="200 max" value={it.description} onChange={(v) => setItem(i, 'description', v)} error={err(`services.items.${i}.description`)} helper="One or two sentences on what the customer gets." />
          <TextField label="Price" value={it.price} onChange={(v) => setItem(i, 'price', v)} helper="Optional. For example 'R250' or 'From R250'." />
          <ImageUpload label="Image" kind="serviceImage" allowed={PHOTO_TYPES} accept=".jpg,.jpeg,.png,.webp" submissionId={submissionId} value={it.image} onChange={(v) => setItem(i, 'image', v)} helper="Optional. JPG, PNG or WEBP, up to 5 MB." />
        </div>
      ))}
      {items.length < MAX_SERVICES && (
        <button type="button" className="ws-btn" style={{ ...ghostBtn, width: '100%' }} onClick={() => up(['services', 'items'], [...items, { name: '', description: '', price: '', image: null }])}>
          + Add another ({items.length} of {MAX_SERVICES})
        </button>
      )}

      <h3 style={sub}>Main button on your site</h3>
      <SelectField label="What should most visitors do?" required value={a.services.cta.type} onChange={(v) => up(['services', 'cta', 'type'], v)} options={CTA_TYPES} error={err('services.cta.type')} helper="We show this button at the top, middle and bottom of the page." />
      <TextField label="Custom button text" value={a.services.cta.customText} onChange={(v) => up(['services', 'cta', 'customText'], v)} maxLength={30} helper="Optional. For example 'Order on WhatsApp'. Leave blank to use the option above." />
    </>
  );
}

// ─── Step 4: Brand ───

function StepBrand({ a, up, err, submissionId }) {
  const b = a.brand;
  const set = (k) => (v) => up(['brand', k], v);
  const toggleVibe = (v) => {
    if (b.vibe.includes(v)) set('vibe')(b.vibe.filter((x) => x !== v));
    else if (b.vibe.length < MAX_VIBES) set('vibe')([...b.vibe, v]);
  };
  return (
    <>
      <h2 style={h2}>Brand identity</h2>
      <p style={lead}>This is how your site will look and feel.</p>

      {!b.noLogo && (
        <ImageUpload label="Logo" required kind="logo" allowed={LOGO_TYPES} accept=".png,.svg,.jpg,.jpeg,.webp" submissionId={submissionId} value={b.logo} onChange={set('logo')} error={err('brand.logo')}
          helper="Use a high resolution logo, ideally SVG or PNG with a transparent background. PNG, SVG, JPG or WEBP, up to 5 MB." />
      )}
      <CheckField checked={b.noLogo} onChange={(v) => { set('noLogo')(v); if (v) set('logo')(null); }}>I do not have a logo</CheckField>
      {b.noLogo && <TextField label="Preferred name styling" value={b.nameStyling} onChange={set('nameStyling')} helper="How should we style your name in place of a logo? For example 'all capitals, bold, with a small star'." />}

      <h3 style={sub}>Colours</h3>
      <CheckField checked={b.autoColors} onChange={set('autoColors')}>Pick colours for me based on my logo</CheckField>
      <div style={{ opacity: b.autoColors ? 0.45 : 1, pointerEvents: b.autoColors ? 'none' : 'auto' }}>
        {[['primary', 'Primary colour', 'Your main brand colour, used for buttons and headings.'], ['secondary', 'Secondary colour', 'Supports the main colour.'], ['accent', 'Accent colour', 'A pop of colour for highlights.']].map(([k, label, helper]) => (
          <Field key={k} label={label} helper={helper} error={err(`brand.colors.${k}`)}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" aria-label={`${label} picker`} value={isHex(b.colors[k]) ? b.colors[k] : '#000000'} onChange={(e) => up(['brand', 'colors', k], e.target.value)} style={{ width: 56, height: 48, padding: 2, border: `1.5px solid ${BRAND.greyLight}`, borderRadius: 10, background: '#fff', cursor: 'pointer' }} />
              <input aria-label={`${label} hex code`} value={b.colors[k]} onChange={(e) => up(['brand', 'colors', k], e.target.value)} maxLength={7} placeholder="#0097b2" style={{ ...inputStyle(err(`brand.colors.${k}`)), width: 140 }} />
            </div>
          </Field>
        ))}
      </div>

      <h3 style={sub}>Background</h3>
      <Field error={err('brand.background')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {BACKGROUNDS.map((o) => <ChoiceChip key={o} selected={b.background === o} onClick={() => set('background')(o)}>{o}</ChoiceChip>)}
        </div>
      </Field>

      <h3 style={sub}>Font style</h3>
      <Field helper="Tap the style that feels most like your business." error={err('brand.fontStyle')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {FONT_STYLES.map((f) => {
            const on = b.fontStyle === f.id;
            return (
              <button key={f.id} type="button" onClick={() => set('fontStyle')(f.id)} aria-pressed={on}
                style={{ minHeight: 96, padding: 12, textAlign: 'left', borderRadius: 12, cursor: 'pointer', background: on ? BRAND.tealLight : BRAND.white, border: `2px solid ${on ? BRAND.teal : BRAND.greyLight}`, fontFamily: 'inherit' }}>
                <div style={{ fontFamily: f.css, fontWeight: f.weight, fontSize: 20, lineHeight: 1.2, color: BRAND.black }}>{f.sample}</div>
                <div style={{ fontSize: 12, color: BRAND.grey, marginTop: 8, fontWeight: 700 }}>{f.id}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <h3 style={sub}>Icon style</h3>
      <Field helper="The little pictures used next to your services and contact details." error={err('brand.iconStyle')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ICON_STYLES.map((o) => <ChoiceChip key={o} selected={b.iconStyle === o} onClick={() => set('iconStyle')(o)}>{o}</ChoiceChip>)}
        </div>
      </Field>

      <h3 style={sub}>Overall vibe (pick up to {MAX_VIBES})</h3>
      <Field error={err('brand.vibe')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {VIBES.map((o) => <ChoiceChip key={o} selected={b.vibe.includes(o)} disabled={!b.vibe.includes(o) && b.vibe.length >= MAX_VIBES} onClick={() => toggleVibe(o)}>{o}</ChoiceChip>)}
        </div>
      </Field>
    </>
  );
}

// ─── Step 5: Content ───

function StepContent({ a, up, err, submissionId }) {
  const c = a.content;
  const set = (k) => (v) => up(['content', k], v);
  const tests = c.testimonials;
  return (
    <>
      <h2 style={h2}>Content and images</h2>
      <p style={lead}>Everything here is optional. Anything you skip, we write for you in a friendly South African tone.</p>
      <TextField label="Hero headline" value={c.heroHeadline} onChange={set('heroHeadline')} maxLength={100} helper="The big line at the very top. Leave blank and we will write it for you." />
      <TextAreaField label="About us text" rows={5} value={c.aboutText} onChange={set('aboutText')} helper="Your story in a few paragraphs. Leave blank and we will write it for you." />

      <h3 style={sub}>Testimonials (up to {MAX_TESTIMONIALS})</h3>
      <p style={{ ...lead, marginBottom: 12 }}>Kind words from happy customers build trust. Only use quotes people are happy for you to share.</p>
      {tests.map((t, i) => (
        <div key={i} style={{ border: `1.5px solid ${BRAND.greyLight}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <TextField label="Customer name" value={t.name} onChange={(v) => up(['content', 'testimonials', i, 'name'], v)} />
          <TextAreaField label="What they said" rows={2} value={t.quote} onChange={(v) => up(['content', 'testimonials', i, 'quote'], v)} error={err(`content.testimonials.${i}`)} />
          <button type="button" style={smallBtn} onClick={() => set('testimonials')(tests.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      {tests.length < MAX_TESTIMONIALS && (
        <button type="button" className="ws-btn" style={{ ...ghostBtn, width: '100%' }} onClick={() => set('testimonials')([...tests, { name: '', quote: '' }])}>+ Add a testimonial</button>
      )}

      <h3 style={sub}>Photos</h3>
      <p style={{ ...lead, marginBottom: 12 }}>
        A good photo is bright, in focus, and shows your real work, products or team. Landscape (wide) photos work best for the top of the page. Phone photos are fine as long as they are sharp. JPG, PNG or WEBP, up to 5 MB each.
      </p>
      <ImageUpload label="Hero image (1)" kind="hero" allowed={PHOTO_TYPES} accept=".jpg,.jpeg,.png,.webp" submissionId={submissionId} value={c.heroImage} onChange={set('heroImage')} helper="The big picture at the top of your site." />
      <GalleryUpload label={`Gallery images (up to ${MAX_GALLERY})`} kind="gallery" allowed={PHOTO_TYPES} accept=".jpg,.jpeg,.png,.webp" submissionId={submissionId} values={c.galleryImages} onChange={set('galleryImages')} max={MAX_GALLERY} helper="Your work, products, premises or happy customers." error={err('content.galleryImages')} />
      <ImageUpload label="Team photo" kind="team" allowed={PHOTO_TYPES} accept=".jpg,.jpeg,.png,.webp" submissionId={submissionId} value={c.teamPhoto} onChange={set('teamPhoto')} helper="Optional. People like to see who they are dealing with." />
      <CheckField checked={c.useStock} onChange={set('useStock')}>Please use stock images where I have none</CheckField>
    </>
  );
}

// ─── Step 6: Extras ───

function StepExtras({ a, up, err }) {
  const x = a.extras;
  const set = (k) => (v) => up(['extras', k], v);
  const refs = x.references;
  return (
    <>
      <h2 style={h2}>Inspiration and extras</h2>
      <p style={lead}>Show us websites you admire so we can match your taste.</p>

      <h3 style={{ ...sub, marginTop: 0 }}>Websites you like (up to {MAX_REFERENCES})</h3>
      {refs.map((r, i) => (
        <div key={i} style={{ border: `1.5px solid ${BRAND.greyLight}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <TextField label="Website link" value={r.url} onChange={(v) => up(['extras', 'references', i, 'url'], v)} error={err(`extras.references.${i}.url`)} inputMode="url" placeholder="https://" />
          <TextAreaField label="What do you like about it?" rows={2} value={r.like} onChange={(v) => up(['extras', 'references', i, 'like'], v)} helper="The colours, the layout, the photos, the feel..." />
          <button type="button" style={smallBtn} onClick={() => set('references')(refs.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      {refs.length < MAX_REFERENCES && (
        <button type="button" className="ws-btn" style={{ ...ghostBtn, width: '100%', marginBottom: 20 }} onClick={() => set('references')([...refs, { url: '', like: '' }])}>+ Add a website you like</button>
      )}

      <TextAreaField label="Websites you dislike" rows={2} value={x.dislikes} onChange={set('dislikes')} helper="Optional. Tell us what to avoid." />
      <TextField label="Your existing website" value={x.existingUrl} onChange={set('existingUrl')} error={err('extras.existingUrl')} inputMode="url" placeholder="https://" helper="Optional. If you already have one, we will take a look." />

      <h3 style={sub}>Domain (your web address)</h3>
      <Field error={err('extras.domainMode')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['owned', 'I already own a domain'], ['need', 'I need to buy one']].map(([v, label]) => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
              <input type="radio" name="domainMode" checked={x.domainMode === v} onChange={() => set('domainMode')(v)} style={{ width: 22, height: 22, accentColor: BRAND.teal }} />{label}
            </label>
          ))}
        </div>
      </Field>
      {x.domainMode === 'owned' && <TextField label="Your domain" required value={x.ownedDomain} onChange={set('ownedDomain')} error={err('extras.ownedDomain')} placeholder="mybusiness.co.za" helper="The address you already own." />}
      {x.domainMode === 'need' && (
        <Field label="Three preferred names, in order" required error={err('extras.preferredDomains')} helper="Use .co.za or .com. We register the first one that is available. Domain registration is paid separately.">
          {[0, 1, 2].map((i) => (
            <input key={i} aria-label={`Preferred domain ${i + 1}`} value={x.preferredDomains[i]} placeholder={`${i + 1}. e.g. mybusiness.co.za`}
              onChange={(e) => up(['extras', 'preferredDomains', i], e.target.value)} style={{ ...inputStyle(false), marginBottom: 8 }} />
          ))}
        </Field>
      )}

      <TextAreaField label="Anything else we should know?" rows={4} value={x.notes} onChange={set('notes')} helper="Deadlines, things to avoid, extra ideas, anything at all." />
    </>
  );
}

// ─── Step 7: Review ───

function Row({ label, children }) {
  if (children === '' || children == null || (Array.isArray(children) && !children.length)) return null;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${BRAND.offWhite}`, fontSize: 13.5 }}>
      <div style={{ width: 120, flexShrink: 0, color: BRAND.grey, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
}

function Section({ title, onEdit, children }) {
  return (
    <div style={{ border: `1.5px solid ${BRAND.greyLight}`, borderRadius: 14, padding: '12px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <strong style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14 }}>{title}</strong>
        <button type="button" onClick={onEdit} style={{ ...smallBtn, color: BRAND.tealDark, borderColor: BRAND.teal }}>Edit</button>
      </div>
      {children}
    </div>
  );
}

function Thumb({ f }) {
  return f ? <img src={f.url} alt={f.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, marginRight: 6, background: BRAND.offWhite }} /> : null;
}

function StepReview({ a, up, err, goTo }) {
  const { about: ab, contact: c, services: s, brand: b, content: ct, extras: x } = a;
  const hours = useMemo(() => formatHours(c.hours), [c.hours]);
  const socials = SOCIALS.filter(([k]) => c.social[k].trim());
  return (
    <>
      <h2 style={h2}>Review and submit</h2>
      <p style={lead}>Check everything looks right. Tap Edit on any section to change it.</p>

      <Section title="About you" onEdit={() => goTo(0)}>
        <Row label="Name">{ab.fullName}</Row><Row label="Email">{ab.email}</Row><Row label="Phone">{ab.phone}</Row>
        <Row label="Business">{ab.businessName}</Row><Row label="Tagline">{ab.tagline}</Row>
        <Row label="Industry">{ab.industry === 'Other' ? ab.industryOther : ab.industry}</Row>
        <Row label="Location">{`${ab.town}, ${ab.province}`}</Row><Row label="Started">{ab.yearStarted}</Row>
        <Row label="What you do">{ab.description}</Row><Row label="Customers">{ab.idealCustomers}</Row><Row label="Different">{ab.differentiator}</Row>
      </Section>
      <Section title="Contact details" onEdit={() => goTo(1)}>
        <Row label="Email">{c.publicEmail}</Row><Row label="Phone">{c.publicPhone}</Row><Row label="WhatsApp">{c.whatsapp}</Row>
        <Row label="Address">{c.address ? `${c.address}${c.showMap ? ' (map shown)' : ''}` : ''}</Row>
        <Row label="Hours">{hours.length ? hours.map((h) => <div key={h}>{h}</div>) : ''}</Row>
        <Row label="Social">{socials.map(([k, l]) => <div key={k}>{l}: {c.social[k]}</div>)}</Row>
      </Section>
      <Section title="Services" onEdit={() => goTo(2)}>
        {s.items.map((it, i) => <Row key={i} label={`Item ${i + 1}`}><Thumb f={it.image} /><strong>{it.name}</strong>{it.price ? ` (${it.price})` : ''}<div style={{ color: BRAND.grey }}>{it.description}</div></Row>)}
        <Row label="Main button">{`${s.cta.type}${s.cta.customText ? `: "${s.cta.customText}"` : ''}`}</Row>
      </Section>
      <Section title="Brand" onEdit={() => goTo(3)}>
        <Row label="Logo">{b.logo ? <Thumb f={b.logo} /> : b.noLogo ? `No logo${b.nameStyling ? `. Styling: ${b.nameStyling}` : ''}` : ''}</Row>
        <Row label="Colours">{b.autoColors ? 'Chosen from logo' : <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{['primary', 'secondary', 'accent'].map((k) => <span key={k} title={b.colors[k]} style={{ width: 24, height: 24, borderRadius: 12, background: b.colors[k], border: '1px solid #0002' }} />)}</span>}</Row>
        <Row label="Background">{b.background}</Row><Row label="Font">{b.fontStyle}</Row><Row label="Icons">{b.iconStyle}</Row><Row label="Vibe">{b.vibe.join(', ')}</Row>
      </Section>
      <Section title="Content and images" onEdit={() => goTo(4)}>
        <Row label="Headline">{ct.heroHeadline || 'We will write it'}</Row><Row label="About text">{ct.aboutText || 'We will write it'}</Row>
        <Row label="Testimonials">{ct.testimonials.filter((t) => t.name && t.quote).map((t, i) => <div key={i}>"{t.quote}" ({t.name})</div>)}</Row>
        <Row label="Hero image"><Thumb f={ct.heroImage} /></Row>
        <Row label="Gallery">{ct.galleryImages.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{ct.galleryImages.map((g) => <Thumb key={g.url} f={g} />)}</div> : ''}</Row>
        <Row label="Team photo"><Thumb f={ct.teamPhoto} /></Row>
        <Row label="Stock images">{ct.useStock ? 'Yes, where I have none' : ''}</Row>
      </Section>
      <Section title="Inspiration and extras" onEdit={() => goTo(5)}>
        <Row label="Likes">{x.references.filter((r) => r.url).map((r, i) => <div key={i}>{r.url}{r.like ? ` (${r.like})` : ''}</div>)}</Row>
        <Row label="Dislikes">{x.dislikes}</Row><Row label="Current site">{x.existingUrl}</Row>
        <Row label="Domain">{x.domainMode === 'owned' ? `I own ${x.ownedDomain}` : x.domainMode === 'need' ? `Need one: ${x.preferredDomains.filter(Boolean).join(', ')}` : ''}</Row>
        <Row label="Notes">{x.notes}</Row>
      </Section>

      <h3 style={sub}>Almost done</h3>
      <div style={{ background: BRAND.offWhite, borderRadius: 12, padding: '14px 16px', fontSize: 13, color: BRAND.grey, lineHeight: 1.55, marginBottom: 16 }}>
        <strong style={{ color: BRAND.black }}>What R{PRICE_ZAR} covers:</strong> one page website, built from the details above, with one round of changes after the first version. Extra pages, extra rounds of changes and other additional work are quoted and charged separately. Domain registration and hosting costs are not included unless we agree otherwise. Work starts once payment is confirmed.
      </div>
      <CheckField checked={a.consent.terms} onChange={(v) => up(['consent', 'terms'], v)} error={err('consent.terms')}>
        I agree to the terms and scope above: one page, one round of changes, and extra work charged separately.
      </CheckField>
      <CheckField checked={a.consent.popia} onChange={(v) => up(['consent', 'popia'], v)} error={err('consent.popia')}>
        I consent (POPIA) to Laska Legacy storing my personal details and the files I uploaded, only for the purpose of building my website.
      </CheckField>
    </>
  );
}
