'use client';

import { BRAND } from '@/components/websites/ui';
import { PRICE_ZAR } from '@/lib/websites/schema';

const WHATSAPP = 'https://wa.me/27725858288?text=' + encodeURIComponent('Hi! I would like to know more about the R500 website.');

const INCLUDED = [
  'A custom designed one page website',
  'Looks perfect on phones, tablets and computers',
  'Your logo, colours, fonts and photos',
  'Your services, prices and contact details',
  'WhatsApp, call and email buttons',
  'Google Maps and trading hours (if you want them)',
  'Built to load fast and be found on Google',
  'One round of changes included',
];

const STEPS = [
  ['1', 'Fill in the form', 'Tell us about your business and upload your logo and photos. Takes about 10 minutes, and your progress saves as you go.'],
  ['2', 'Pay R' + PRICE_ZAR, 'One simple once off payment. No contracts, no monthly retainer.'],
  ['3', 'We build it', 'We design and build your one page website using everything you gave us.'],
  ['4', 'Review and go live', 'Check it, ask for your round of changes, and we publish it.'],
];

const FOR = ['Salons and barbers', 'Builders and trades', 'Farms and stables', 'Bakers and cafes', 'Photographers', 'Trainers and coaches', 'Shops and startups', 'Clinics and therapists'];

const FAQ = [
  ['What is a one page website?', 'Everything on one scrolling page: who you are, what you offer, photos, reviews and how to contact you. It is perfect for small businesses and loads quickly on any phone.'],
  ['What if I have no logo or photos?', 'No problem. Tick the box and we style your business name for you, and we can use professional stock photos where you have none.'],
  ['What does the R500 cover?', 'The design and build of one page, using the details you supply, plus one round of changes. Extra pages, more rounds of changes and other additional work are quoted separately.'],
  ['What about my web address?', 'If you own a domain we connect it. If you need one, tell us your three favourite names and we help you register one. Domain registration is paid separately.'],
  ['How long does it take?', 'We start as soon as your payment is confirmed. Complete details and good photos make it quicker.'],
];

export default function WebsitesPromo({ onStart }) {
  const css = `
    .wp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:56px; padding:0 32px; border-radius:100px; font-family:'Montserrat',sans-serif; font-weight:800; font-size:16px; letter-spacing:.5px; text-decoration:none; border:none; cursor:pointer; transition:transform .15s, box-shadow .15s }
    .wp-btn:hover { transform:translateY(-2px) }
    .wp-btn-primary { background:#fff; color:${BRAND.purple}; box-shadow:0 10px 30px rgba(0,0,0,.25) }
    .wp-btn-ghost { background:transparent; color:#fff; border:2px solid rgba(255,255,255,.7) }
    .wp-btn-solid { background:${BRAND.purple}; color:#fff; box-shadow:0 10px 30px ${BRAND.purple}55 }
    .wp-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:18px }
    .wp-split { display:grid; grid-template-columns:1.1fr .9fr; gap:32px; align-items:center }
    @media (max-width:860px) { .wp-grid4 { grid-template-columns:1fr 1fr } .wp-split { grid-template-columns:1fr } }
    @media (max-width:520px) { .wp-grid4 { grid-template-columns:1fr } .wp-btn { width:100% } }
    .wp-faq summary { cursor:pointer; font-weight:700; font-size:16px; padding:18px 0; list-style:none; display:flex; justify-content:space-between; gap:12px }
    .wp-faq summary::after { content:'+'; font-size:22px; color:${BRAND.purple}; line-height:1 }
    .wp-faq details[open] summary::after { content:'\\2212' }
  `;
  const h2 = { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 5vw, 40px)', margin: '0 0 12px', color: BRAND.black, lineHeight: 1.1 };

  return (
    <div className="fade-in">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* HERO */}
      <section style={{ background: `linear-gradient(135deg, ${BRAND.black} 0%, #1a0b4d 45%, ${BRAND.purple} 100%)`, color: '#fff', padding: '72px 24px 88px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -120, top: -120, width: 420, height: 420, borderRadius: '50%', background: `${BRAND.teal}33`, filter: 'blur(10px)' }} />
        <div className="wp-split" style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div>
            <span style={{ display: 'inline-block', background: BRAND.teal, color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', padding: '8px 16px', borderRadius: 100, marginBottom: 22 }}>New · Websites by Laska Legacy</span>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(38px, 8vw, 72px)', lineHeight: 1.02, margin: '0 0 20px', textTransform: 'uppercase' }}>
              Your business.<br />Online. <span style={{ color: BRAND.teal }}>R{PRICE_ZAR}.</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2.4vw, 20px)', lineHeight: 1.55, opacity: 0.9, maxWidth: 520, margin: '0 0 30px' }}>
              A beautiful, fast, mobile friendly one page website for your small business or startup. One simple price. No contracts. No monthly fees.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <button className="wp-btn wp-btn-primary" onClick={onStart}>Get my website →</button>
              <a className="wp-btn wp-btn-ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
            </div>
          </div>

          {/* price badge */}
          <div style={{ justifySelf: 'center' }}>
            <div style={{ width: 'min(300px, 80vw)', aspectRatio: '1', borderRadius: '50%', background: '#fff', color: BRAND.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 10px ${BRAND.teal}, 0 30px 60px rgba(0,0,0,.4)`, transform: 'rotate(-6deg)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: BRAND.grey }}>Once off</div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(64px, 14vw, 96px)', lineHeight: 1, color: BRAND.purple }}>R{PRICE_ZAR}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>Everything included</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ background: BRAND.teal, color: '#fff', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '8px 36px', justifyContent: 'center', fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
          <span>✓ One page</span><span>✓ Mobile friendly</span><span>✓ One round of changes</span><span>✓ No monthly fees</span>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section style={{ padding: '72px 24px', background: BRAND.white }}>
        <div className="wp-split" style={{ maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: BRAND.teal, fontWeight: 800, marginBottom: 10 }}>What you get</div>
            <h2 style={h2}>A professional website without the professional price tag.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: BRAND.grey }}>
              Customers search online before they call. Be the business they find, trust and contact in one tap.
            </p>
          </div>
          <div style={{ background: BRAND.offWhite, borderRadius: 24, padding: '28px 26px', border: `3px solid ${BRAND.purple}`, boxShadow: `12px 12px 0 ${BRAND.purple}22` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 56, color: BRAND.purple, lineHeight: 1 }}>R{PRICE_ZAR}</span>
              <span style={{ fontWeight: 700, color: BRAND.grey }}>once off</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'grid', gap: 12 }}>
              {INCLUDED.map((t) => (
                <li key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, fontWeight: 600 }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 12, background: BRAND.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>✓</span>{t}
                </li>
              ))}
            </ul>
            <button className="wp-btn wp-btn-solid" style={{ width: '100%' }} onClick={onStart}>Start my website →</button>
            <p style={{ fontSize: 12, color: BRAND.grey, textAlign: 'center', margin: '12px 0 0' }}>Extra pages and extra changes are quoted separately. Domain registration is paid separately.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '72px 24px', background: BRAND.offWhite }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: BRAND.teal, fontWeight: 800, marginBottom: 10 }}>How it works</div>
            <h2 style={h2}>Live in four simple steps</h2>
          </div>
          <div className="wp-grid4">
            {STEPS.map(([n, title, text]) => (
              <div key={n} style={{ background: '#fff', borderRadius: 20, padding: '26px 22px', boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.purple})`, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{n}</div>
                <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: BRAND.grey, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ padding: '64px 24px', background: BRAND.white, textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={h2}>Made for small businesses like yours</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 24 }}>
            {FOR.map((t) => <span key={t} style={{ background: BRAND.purpleLight, color: BRAND.purple, fontWeight: 800, fontSize: 14, padding: '10px 18px', borderRadius: 100 }}>{t}</span>)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '64px 24px', background: BRAND.offWhite }}>
        <div className="wp-faq" style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ ...h2, textAlign: 'center', marginBottom: 24 }}>Questions? Answered.</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} style={{ borderBottom: `1px solid ${BRAND.greyLight}` }}>
              <summary>{q}</summary>
              <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: BRAND.grey }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.teal})`, color: '#fff', padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ ...h2, color: '#fff', textTransform: 'uppercase', fontSize: 'clamp(30px, 6vw, 52px)' }}>Ready to get online?</h2>
        <p style={{ fontSize: 18, opacity: 0.92, margin: '0 auto 28px', maxWidth: 480 }}>Fill in the form today. Your business could have its own website for just R{PRICE_ZAR}.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          <button className="wp-btn wp-btn-primary" onClick={onStart}>Get my website →</button>
          <a className="wp-btn wp-btn-ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
        </div>
      </section>
    </div>
  );
}
