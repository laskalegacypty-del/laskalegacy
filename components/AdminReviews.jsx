'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BRAND } from '@/components/websites/ui';
import { Stars } from '@/components/ReviewsPanel';

const LABEL = { pending: 'Awaiting approval', approved: 'Showing on site', hidden: 'Hidden' };
const COLOR = { pending: BRAND.purple, approved: '#16a34a', hidden: '#6b7280' };
const fmt = (iso) => new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminReviews({ password, onBack, showToast }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');

  const api = useCallback(async (path, options = {}) => {
    const res = await fetch(path, { ...options, headers: { ...(options.headers || {}), 'x-admin-password': password, 'Content-Type': 'application/json' } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(res.status === 401 ? 'Not allowed. Check WEBSITE_ADMIN_PASSWORD matches your admin password.' : json.error || 'Request failed.');
    return json;
  }, [password]);

  const load = useCallback(() => {
    setError('');
    api('/api/websites/reviews/admin').then((j) => setRows(j.reviews)).catch((e) => setError(e.message));
  }, [api]);
  useEffect(load, [load]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, hidden: 0 };
    rows?.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);
  const shown = (rows || []).filter((r) => r.status === filter);

  async function setStatus(r, status, msg) {
    try {
      await api(`/api/websites/reviews/admin/${r.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
      showToast(msg);
    } catch (e) { showToast(e.message); }
  }

  async function remove(r) {
    if (!confirm(`Permanently delete the review from ${r.name}? This cannot be undone.`)) return;
    try {
      await api(`/api/websites/reviews/admin/${r.id}`, { method: 'DELETE' });
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      showToast('Review deleted');
    } catch (e) { showToast(e.message); }
  }

  const stat = (key) => (
    <button key={key} onClick={() => setFilter(key)}
      style={{ flex: '1 1 120px', textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', background: filter === key ? `${COLOR[key]}14` : BRAND.white, border: `2px solid ${filter === key ? COLOR[key] : BRAND.greyLight}` }}>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 900, color: COLOR[key] }}>{counts[key]}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: BRAND.grey, letterSpacing: 1, textTransform: 'uppercase' }}>{LABEL[key]}</div>
    </button>
  );

  const small = (label, onClick, primary) => (
    <button onClick={onClick} style={{ padding: '9px 18px', borderRadius: 100, border: primary ? 'none' : `1px solid ${BRAND.greyLight}`, background: primary || 'transparent', color: primary ? '#fff' : BRAND.black, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.grey, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 }}>← Back to Dashboard</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, color: BRAND.black, fontWeight: 800, margin: 0 }}>Reviews</h1>
          <p style={{ fontSize: 13, color: BRAND.grey, margin: '4px 0 0' }}>Customers leave these at /review. Approve one to show it on the home and Websites pages.</p>
        </div>
        <button className="ll-btn ll-btn-outline ll-btn-sm" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/review`); showToast('Review link copied'); }}>Copy review link</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>{['pending', 'approved', 'hidden'].map(stat)}</div>

      {error && <p role="alert" style={{ color: '#dc2626', fontWeight: 700, fontSize: 14 }}>{error}</p>}
      {!rows && !error && <p style={{ color: BRAND.grey, textAlign: 'center', padding: 40 }}>Loading reviews...</p>}
      {rows && !shown.length && <p style={{ color: BRAND.grey, textAlign: 'center', padding: 40 }}>Nothing here.</p>}
      {shown.map((r) => (
        <div key={r.id} style={{ background: BRAND.white, border: `1px solid ${BRAND.greyLight}`, borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <div><Stars value={r.rating} /> <strong style={{ marginLeft: 8 }}>{r.name}</strong>{r.business && <span style={{ color: BRAND.grey }}>, {r.business}</span>}</div>
            <span style={{ fontSize: 12, color: BRAND.grey }}>{fmt(r.created_at)}</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.message}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.status !== 'approved' && small('Approve', () => setStatus(r, 'approved', 'Review approved'), '#16a34a')}
            {r.status !== 'hidden' && small('Hide', () => setStatus(r, 'hidden', 'Review hidden'))}
            {r.status === 'hidden' && small('Back to pending', () => setStatus(r, 'pending', 'Moved back to pending'))}
            <span style={{ flex: 1 }} />
            {small('Delete', () => remove(r))}
          </div>
        </div>
      ))}
    </div>
  );
}
