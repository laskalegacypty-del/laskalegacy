'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BRAND } from '@/components/websites/ui';
import { SignedCopy } from '@/components/TrainingAgreement';

const STATUS_LABEL = { signed: 'Awaiting review', approved: 'Approved', declined: 'Declined' };
const STATUS_COLOR = { signed: BRAND.purple, approved: '#16a34a', declined: '#dc2626' };

const fmt = (iso) => new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

function Badge({ color, children }) {
  return <span style={{ background: `${color}1a`, color, fontWeight: 800, fontSize: 11, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>{children}</span>;
}

// Map a database row to the shape the contract renderer expects.
const toForm = (r) => ({
  ownerName: r.owner_name, ownerIdNumber: r.owner_id_number, ownerPhone: r.owner_phone, ownerEmail: r.owner_email,
  ownerAddress: r.owner_address, emergencyContact: r.emergency_contact || '',
  horseName: r.horse_name, horseAge: r.horse_age, horseBreed: r.horse_breed, horseSex: r.horse_sex,
  passportNumber: r.passport_number || '', startDate: r.start_date, endDate: r.end_date,
  paymentOption: r.payment_option, dietaryInstructions: r.dietary_instructions || '', vetDetails: r.vet_details || '',
  trainingGoals: r.training_goals || '', behaviourDisclosure: r.behaviour_disclosure || '', signedName: r.signed_name,
});

export default function AdminTrainingAgreements({ password, onBack, showToast }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState('signed');
  const [query, setQuery] = useState('');

  const api = useCallback(async (path, options = {}) => {
    const res = await fetch(path, { ...options, headers: { ...(options.headers || {}), 'x-admin-password': password, 'Content-Type': 'application/json' } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(res.status === 401 ? 'Not allowed. Check WEBSITE_ADMIN_PASSWORD matches your admin password.' : json.error || 'Request failed.');
    return json;
  }, [password]);

  const load = useCallback(() => {
    setError('');
    api('/api/websites/training/list').then((j) => setRows(j.agreements)).catch((e) => setError(e.message));
  }, [api]);
  useEffect(load, [load]);

  const counts = useMemo(() => {
    const c = { all: rows?.length || 0, signed: 0, approved: 0, declined: 0 };
    rows?.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);

  const shown = useMemo(() => (rows || []).filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || `${r.owner_name} ${r.horse_name} ${r.owner_phone}`.toLowerCase().includes(q);
  }), [rows, filter, query]);

  if (openId) {
    return <Detail id={openId} api={api} showToast={showToast} onBack={() => { setOpenId(null); load(); }} />;
  }

  const stat = (key, label, color) => (
    <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
      style={{ flex: '1 1 120px', textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', background: filter === key ? `${color}14` : BRAND.white, border: `2px solid ${filter === key ? color : BRAND.greyLight}` }}>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 900, color }}>{counts[key]}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: BRAND.grey, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
    </button>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.grey, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 }}>← Back to Dashboard</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, color: BRAND.black, fontWeight: 800, margin: 0 }}>Training Contracts</h1>
          <p style={{ fontSize: 13, color: BRAND.grey, margin: '4px 0 0' }}>Signed by owners at /training-agreement. Open one to review, approve or decline.</p>
        </div>
        <a href="/training-agreement" target="_blank" rel="noreferrer" className="ll-btn ll-btn-outline ll-btn-sm" style={{ textDecoration: 'none' }}>Open client form ↗</a>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {stat('signed', 'Awaiting review', STATUS_COLOR.signed)}
        {stat('approved', 'Approved', STATUS_COLOR.approved)}
        {stat('declined', 'Declined', STATUS_COLOR.declined)}
      </div>

      <input className="ll-input" placeholder="Search owner, horse or phone" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 16 }} />

      {error && <p role="alert" style={{ color: '#dc2626', fontWeight: 700, fontSize: 14 }}>{error}</p>}
      {!rows && !error && <p style={{ color: BRAND.grey, textAlign: 'center', padding: 40 }}>Loading contracts...</p>}
      {rows && !shown.length && <p style={{ color: BRAND.grey, textAlign: 'center', padding: 40 }}>{rows.length ? 'Nothing matches that filter.' : 'No contracts yet. They appear here when an owner signs at /training-agreement.'}</p>}
      {shown.map((r) => (
        <div key={r.id} className="admin-row" style={{ cursor: 'pointer' }} onClick={() => setOpenId(r.id)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: BRAND.black, fontSize: 14 }}>{r.horse_name} <span style={{ fontWeight: 500, color: BRAND.grey }}>· {r.owner_name}</span></div>
            <div style={{ fontSize: 12, color: BRAND.grey }}>Signed {fmt(r.created_at)} · Starts {fmt(r.start_date)} · {r.payment_option === 'full' ? 'Paying in full' : '30% / 70%'}</div>
          </div>
          <Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
        </div>
      ))}
    </div>
  );
}

function Detail({ id, api, showToast, onBack }) {
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api(`/api/websites/training/${id}`).then((j) => { setRow(j.agreement); setNotes(j.agreement.trainer_notes || ''); }).catch((e) => setError(e.message));
  }, [api, id]);

  async function patch(body, msg) {
    setBusy(true);
    try {
      const r = await api(`/api/websites/training/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setRow((prev) => ({ ...prev, ...body, ...(body.status !== undefined ? { reviewed_at: body.status === 'signed' ? null : r.reviewed_at } : {}) }));
      showToast(msg);
    } catch (e) { showToast(e.message); } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm(`Permanently delete the contract for ${row.horse_name} (${row.owner_name})? This cannot be undone.`)) return;
    try { await api(`/api/websites/training/${id}`, { method: 'DELETE' }); showToast('Contract deleted'); onBack(); } catch (e) { showToast(e.message); }
  }

  const back = <button onClick={onBack} className="ta-noprint" style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.grey, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 }}>← Back to contracts</button>;

  if (error) return <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>{back}<p role="alert" style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p></div>;
  if (!row) return <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>{back}<p style={{ color: BRAND.grey }}>Loading...</p></div>;

  const btn = (label, onClick, bg, color = '#fff') => (
    <button disabled={busy} onClick={onClick} style={{ padding: '11px 22px', borderRadius: 100, border: bg === 'transparent' ? `1px solid ${BRAND.greyLight}` : 'none', background: bg, color: bg === 'transparent' ? BRAND.black : color, fontWeight: 800, fontSize: 13.5, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{label}</button>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <style>{`@media print { .ta-noprint { display: none !important; } }`}</style>
      {back}

      <div className="ta-noprint" style={{ background: BRAND.white, border: `1px solid ${BRAND.greyLight}`, borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <Badge color={STATUS_COLOR[row.status]}>{STATUS_LABEL[row.status]}</Badge>
          {row.reviewed_at && <span style={{ fontSize: 12.5, color: BRAND.grey }}>on {fmt(row.reviewed_at)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {row.status !== 'approved' && btn('Approve', () => patch({ status: 'approved' }, 'Contract approved'), '#16a34a')}
          {row.status !== 'declined' && btn('Decline', () => patch({ status: 'declined' }, 'Contract declined'), '#dc2626')}
          {row.status !== 'signed' && btn('Back to review', () => patch({ status: 'signed' }, 'Moved back to review'), 'transparent')}
          {btn('Print / Save PDF', () => window.print(), 'transparent')}
          <span style={{ flex: 1 }} />
          {btn('Delete', remove, 'transparent')}
        </div>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Private notes (the owner never sees these)</label>
        <textarea className="ll-input" style={{ minHeight: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button disabled={busy || notes === (row.trainer_notes || '')} onClick={() => patch({ trainer_notes: notes }, 'Notes saved')} style={{ marginTop: 8, background: 'none', border: 'none', color: BRAND.teal, fontWeight: 800, fontSize: 13, cursor: 'pointer', padding: 0, opacity: notes === (row.trainer_notes || '') ? 0.4 : 1 }}>Save notes</button>
      </div>

      <div style={{ background: BRAND.white, borderRadius: 16, padding: '28px 24px', border: `1px solid ${BRAND.greyLight}` }}>
        <SignedCopy
          form={toForm(row)}
          signature={row.signature_data}
          signedAt={new Date(row.signed_at)}
          approvedAt={row.status === 'approved' && row.reviewed_at ? new Date(row.reviewed_at) : null}
        />
      </div>
    </div>
  );
}
