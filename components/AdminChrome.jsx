'use client';

import { useEffect, useRef, useState } from 'react';

const BRAND = {
  teal: '#0097b2', purple: '#5e17eb', black: '#000000', white: '#ffffff',
  offWhite: '#f7f8fa', tealDark: '#007a91', tealLight: '#e6f6f9',
  purpleLight: '#f0e8fd', grey: '#6b7280', greyLight: '#e5e7eb', red: '#dc2626', amber: '#d97706',
};

// ─── Icons (simple 24px line icons) ───

const ICON_PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  bag: 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6',
  tag: 'M3 12l9-9h9v9l-9 9-9-9zM16 8h.01',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  clipboard: 'M9 4h6v3H9V4zM7 5H5v16h14V5h-2M9 12h6M9 16h6',
  horse: 'M4 20l2-8 4-3 3-5 4 1 3 4-2 2-3-1-2 3 1 4M10 9l-3 2',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
  image: 'M3 5h18v14H3V5zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 16l-5-5-8 8',
  mail: 'M4 5h16v14H4V5zM4 7l8 6 8-6',
  contract: 'M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h4',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 17h.01',
  ticket: 'M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4V8zM13 6v12',
  plus: 'M12 5v14M5 12h14',
  out: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  ext: 'M14 3h7v7M21 3l-9 9M19 14v7H3V5h7',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M6 6l12 12M18 6L6 18',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeOff: 'M17.9 17.9A10.1 10.1 0 0112 19C5 19 1 12 1 12a18.5 18.5 0 015.1-5.9M9.9 5.1A9.1 9.1 0 0112 5c7 0 11 7 11 7a18.5 18.5 0 01-2.2 3.2M1 1l22 22',
  lock: 'M6 11h12v10H6V11zM8 11V7a4 4 0 018 0v4',
  warn: 'M12 3l10 18H2L12 3zM12 10v5M12 18h.01',
  check: 'M5 13l4 4L19 7',
};

export function Icon({ name, size = 18, color = 'currentColor', stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

// ─── Navigation structure (one source of truth for sidebar + dashboard) ───

export const NAV_GROUPS = [
  {
    title: 'Online shop',
    items: [
      { key: 'admin-products', icon: 'bag', label: 'Products', desc: 'Your shop items. Add new ones, change prices and photos.' },
      { key: 'admin-orders', icon: 'receipt', label: 'Orders & Invoices', desc: 'Orders your clients placed. Turn them into invoices.' },
      { key: 'admin-sale', icon: 'tag', label: 'Sale', desc: 'Run a discount on chosen items and end it when you are done.' },
    ],
  },
  {
    title: 'At my stall',
    items: [
      { key: 'admin-stall', icon: 'list', label: 'Stall Price List', desc: 'Prices and stock counts for market days (not shown on the website).' },
      { key: 'admin-stall-events', icon: 'clipboard', label: 'Stall Events', desc: 'Track what you sell at a market or show.' },
    ],
  },
  {
    title: 'Website content',
    items: [
      { key: 'admin-horses', icon: 'horse', label: 'Horses for Sale', desc: 'Horse listings shown on the Horses page.' },
      { key: 'admin-blog', icon: 'pen', label: 'Blog', desc: 'Write and edit posts for Between the Poles.' },
      { key: 'admin-gallery', icon: 'image', label: 'Gallery', desc: 'Photos shown on the Gallery page.' },
      { key: 'admin-messages', icon: 'mail', label: 'Messages', desc: 'Messages sent through your Contact page.' },
    ],
  },
  {
    title: 'Clients',
    items: [
      { key: 'admin-training', icon: 'contract', label: 'Training Contracts', desc: 'Signed training agreements. Review, approve or decline.' },
      { key: 'admin-websites', icon: 'globe', label: 'Website Briefs', desc: 'R500 one page website requests from clients.' },
    ],
  },
  {
    title: 'Quiz',
    items: [
      { key: 'admin-quiz', icon: 'help', label: 'Quiz Questions', desc: 'The questions for the WMG quiz.' },
      { key: 'admin-quiz-draw', icon: 'ticket', label: 'Lucky Draw', desc: 'Everyone who entered, and picking a winner.' },
    ],
  },
];

// Sub-pages (edit screens, details) light up their parent section in the sidebar.
const PARENT = {
  'admin-edit': 'admin-products',
  'admin-order-detail': 'admin-orders',
  'admin-blog-edit': 'admin-blog',
  'admin-horse-edit': 'admin-horses',
  'admin-stall-edit': 'admin-stall',
  'admin-stall-labels': 'admin-stall',
  'admin-stall-event-new': 'admin-stall-events',
  'admin-stall-event-detail': 'admin-stall-events',
  'admin-sale-new': 'admin-sale',
  'admin-sale-edit': 'admin-sale',
  'admin-quiz-edit': 'admin-quiz',
};
const activeKey = (page) => PARENT[page] || page;

const SIDEBAR_W = 264;

// ─── Login ───

export function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(null); // null = unknown until a key is pressed
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Caps Lock can be toggled while the window is anywhere, so listen on the whole page.
    const read = (e) => { if (typeof e.getModifierState === 'function') setCaps(e.getModifierState('CapsLock')); };
    window.addEventListener('keydown', read);
    window.addEventListener('keyup', read);
    return () => { window.removeEventListener('keydown', read); window.removeEventListener('keyup', read); };
  }, []);

  function submit(e) {
    e.preventDefault();
    if (!pw) { setError('Please type your password.'); return; }
    const ok = onLogin(pw);
    if (!ok) {
      setError('That password is not right. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setPw('');
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: `linear-gradient(135deg, #000 55%, ${BRAND.purple}66 100%)`, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes adminShake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
        .admin-shake { animation: adminShake 0.4s ease; }
      `}</style>
      <form onSubmit={submit} className={shake ? 'admin-shake' : ''} style={{ width: '100%', maxWidth: 400, background: BRAND.white, borderRadius: 20, padding: '36px 30px 30px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <img src="/logo-icon.png" alt="Laska Legacy" style={{ display: 'block', margin: '0 auto 14px', height: 72, width: 72, borderRadius: '50%', boxShadow: `0 0 0 3px ${BRAND.tealLight}` }} />
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, letterSpacing: 4, fontWeight: 800, color: BRAND.teal, textTransform: 'uppercase' }}>Laska Legacy</div>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 26, fontWeight: 800, margin: '6px 0 6px', color: BRAND.black }}>Admin sign in</h1>
        <p style={{ fontSize: 14, color: BRAND.grey, margin: '0 0 24px' }}>Enter your password to manage your website.</p>

        <label htmlFor="admin-pw" style={{ display: 'block', textAlign: 'left', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Password</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: BRAND.grey, display: 'flex' }}><Icon name="lock" size={18} /></span>
          <input
            id="admin-pw" ref={inputRef} type={show ? 'text' : 'password'} value={pw} autoComplete="current-password"
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            style={{ width: '100%', boxSizing: 'border-box', padding: '14px 48px 14px 42px', fontSize: 16, fontFamily: 'inherit', borderRadius: 12, border: `2px solid ${error ? BRAND.red : caps ? BRAND.amber : BRAND.greyLight}`, outline: 'none' }}
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: BRAND.grey, padding: 8, display: 'flex' }}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
          </button>
        </div>

        {/* Caps Lock status — always visible so you know before you type */}
        <div role="status" aria-live="polite" style={{ marginTop: 10, textAlign: 'left', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10,
          background: caps ? '#fffbeb' : caps === false ? '#f0fdf4' : BRAND.offWhite,
          color: caps ? '#92400e' : caps === false ? '#166534' : BRAND.grey,
          border: `1px solid ${caps ? '#fcd34d' : caps === false ? '#bbf7d0' : BRAND.greyLight}` }}>
          <Icon name={caps ? 'warn' : caps === false ? 'check' : 'lock'} size={16} />
          {caps ? 'Caps Lock is ON. Your password will be typed in capitals.' : caps === false ? 'Caps Lock is off.' : 'Caps Lock status shows as soon as you press a key.'}
        </div>

        {error && <p role="alert" style={{ color: BRAND.red, fontSize: 13.5, fontWeight: 700, margin: '12px 0 0', textAlign: 'left' }}>{error}</p>}

        <button type="submit" style={{ width: '100%', marginTop: 20, padding: '15px 20px', borderRadius: 12, border: 'none', background: BRAND.black, color: BRAND.white, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign in
        </button>
        <a href="/" style={{ display: 'inline-block', marginTop: 18, fontSize: 13, color: BRAND.grey, textDecoration: 'none', fontWeight: 600 }}>← Back to the website</a>
      </form>
    </div>
  );
}

// ─── Sidebar (desktop) + top bar and drawer (mobile) ───

export function AdminSidebar({ page, badges = {}, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false);
  const current = activeKey(page);
  const currentLabel = current === 'admin' ? 'Dashboard' : NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === current)?.label || 'Admin';

  const go = (key) => { setOpen(false); onNavigate(key); };

  const link = (key, icon, label) => {
    const active = current === key;
    const badge = badges[key];
    return (
      <button key={key} onClick={() => go(key)} aria-current={active ? 'page' : undefined}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 14.5, fontWeight: active ? 700 : 500,
          background: active ? 'rgba(0,151,178,0.18)' : 'transparent', color: active ? BRAND.white : 'rgba(255,255,255,0.72)', boxShadow: active ? `inset 3px 0 0 ${BRAND.teal}` : 'none' }}>
        <Icon name={icon} size={18} color={active ? '#5fd3e8' : 'currentColor'} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge ? <span style={{ background: BRAND.teal, color: '#fff', fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: '2px 8px', minWidth: 22, textAlign: 'center' }}>{badge}</span> : null}
      </button>
    );
  };

  const panel = (
    <>
      <div style={{ padding: '4px 6px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/logo-icon.png" alt="" style={{ height: 40, width: 40, borderRadius: '50%' }} />
        <div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: 2 }}>LASKA LEGACY</div>
          <div style={{ fontSize: 10.5, letterSpacing: 2.5, color: BRAND.teal, textTransform: 'uppercase', fontWeight: 700 }}>Admin</div>
        </div>
      </div>
      {link('admin', 'home', 'Dashboard')}
      {NAV_GROUPS.map((g) => (
        <div key={g.title} style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', padding: '0 14px 6px' }}>{g.title}</div>
          {g.items.map((it) => link(it.key, it.icon, it.label))}
        </div>
      ))}
      <div style={{ flex: 1, minHeight: 24 }} />
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <a href="/" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', color: 'rgba(255,255,255,0.72)', textDecoration: 'none', fontSize: 14.5, borderRadius: 10 }}>
          <Icon name="ext" size={18} /> View website
        </a>
        <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', cursor: 'pointer', fontSize: 14.5, fontFamily: 'inherit', borderRadius: 10, textAlign: 'left' }}>
          <Icon name="out" size={18} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .adm-side { position: fixed; top: 0; left: 0; bottom: 0; width: ${SIDEBAR_W}px; background: #0b0b0f; padding: 20px 14px; display: flex; flex-direction: column; overflow-y: auto; z-index: 90; }
        .adm-top { display: none; }
        .adm-root { padding-left: ${SIDEBAR_W}px; }
        @media (max-width: 900px) {
          .adm-side { display: none; }
          .adm-top { display: flex; }
          .adm-root { padding-left: 0; padding-top: 58px; }
        }
      `}</style>
      <aside className="adm-side" aria-label="Admin navigation">{panel}</aside>

      <div className="adm-top" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 58, background: '#0b0b0f', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', zIndex: 95 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <img src="/logo-icon.png" alt="" style={{ height: 32, width: 32, borderRadius: '50%' }} />
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentLabel}</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
          <Icon name={open ? 'x' : 'menu'} size={20} /> Menu
        </button>
      </div>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 94, background: 'rgba(0,0,0,0.5)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 58, left: 0, bottom: 0, width: 'min(300px, 86vw)', background: '#0b0b0f', padding: '18px 14px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Dashboard ───

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function AdminDashboard({ counts, attention, onNavigate, onSignOut }) {
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  const quick = [
    { label: 'Add a product', action: () => onNavigate('admin-edit', { id: '', name: '', category: 'bridles', subcategory: '', price: '', description: '', images: [], featured: false }), icon: 'bag' },
    { label: 'Write a blog post', action: () => onNavigate('admin-blog-edit', { id: '', title: '', excerpt: '', body: '', coverImage: '', images: [], videos: [], published: true }), icon: 'pen' },
    { label: 'Start a stall event', action: () => onNavigate('admin-stall-event-new'), icon: 'clipboard' },
    { label: 'Create an invoice', action: () => window.open('/invoice', '_blank'), icon: 'receipt' },
  ];

  const card = { background: BRAND.white, border: `1px solid ${BRAND.greyLight}`, borderRadius: 16, padding: 20 };
  const sectionTitle = { fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: BRAND.black };

  const todo = attention.filter((a) => a.count > 0);

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 24px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 13, color: BRAND.grey, margin: '0 0 4px', fontWeight: 600 }}>{today}</p>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 30, fontWeight: 800, margin: 0, color: BRAND.black }}>{greeting()}, Liani</h1>
          <p style={{ fontSize: 15, color: BRAND.grey, margin: '6px 0 0' }}>Here is what is happening on your website.</p>
        </div>
      </div>

      {/* Needs attention */}
      <h2 style={sectionTitle}>Needs your attention</h2>
      {todo.length === 0 ? (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, color: '#166534', background: '#f0fdf4', borderColor: '#bbf7d0', marginBottom: 28 }}>
          <Icon name="check" size={22} /> <strong>You are all caught up.</strong> <span style={{ color: BRAND.grey }}>Nothing is waiting for you right now.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 28 }}>
          {todo.map((a) => (
            <button key={a.key} onClick={() => onNavigate(a.key)} style={{ ...card, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', borderLeft: `5px solid ${a.color}` }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 34, fontWeight: 900, color: a.color, lineHeight: 1 }}>{a.count}</div>
              <div style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 2px', color: BRAND.black }}>{a.label}</div>
              <div style={{ fontSize: 13, color: BRAND.grey }}>{a.hint} →</div>
            </button>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <h2 style={sectionTitle}>Quick actions</h2>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 30 }}>
        {quick.map((q) => (
          <button key={q.label} onClick={q.action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, border: `1px solid ${BRAND.greyLight}`, background: BRAND.white, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: BRAND.black }}>
            <span style={{ color: BRAND.teal, display: 'flex' }}><Icon name="plus" size={18} /></span>{q.label}
          </button>
        ))}
      </div>

      {/* Everything, grouped */}
      <h2 style={sectionTitle}>Everything you can manage</h2>
      {NAV_GROUPS.map((g) => (
        <div key={g.title} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: BRAND.grey, margin: '0 0 8px 2px' }}>{g.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {g.items.map((it) => (
              <button key={it.key} onClick={() => onNavigate(it.key)} style={{ ...card, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: BRAND.tealLight, color: BRAND.tealDark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={it.icon} size={21} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: BRAND.black }}>
                    {it.label}
                    {counts[it.key] != null && <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.grey, background: BRAND.offWhite, borderRadius: 999, padding: '2px 9px' }}>{counts[it.key]}</span>}
                  </span>
                  <span style={{ display: 'block', fontSize: 13, color: BRAND.grey, lineHeight: 1.45, marginTop: 3 }}>{it.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <p style={{ fontSize: 12.5, color: BRAND.grey, marginTop: 30 }}>
        Done for the day? <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: BRAND.teal, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, padding: 0 }}>Sign out</button>
      </p>
    </div>
  );
}
